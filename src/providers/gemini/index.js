import { writeFileSync, unlinkSync, readFileSync } from 'fs'
import { spawnSync } from 'child_process'
import { tmpdir } from 'os'
import { join } from 'path'
import { getKey } from '../../config.js'
import { err, log } from '../../utils.js'
import { buildGeminiPrompt } from './prompt.js'

const DEFAULT_MODEL = 'gemini-2.5-flash-preview-tts'
const REQUEST_TIMEOUT_SECONDS = 180
const DEFAULT_VOICE = 'Aoede'

export const VOICES = {
  Aoede:  'female, warm, modern content creator',
  Kore:   'neutral, clear, professional',
  Charon: 'male, deep, narrative',
  Fenrir: 'male, young, energetic',
  Puck:   'neutral, friendly, casual',
}

export async function generateGemini({ text, instruction, voice, model, outFile, seed, temperature }) {
  const key = getKey('GEMINI_API_KEY')
  if (!key) {
    err('Gemini API key not set. Run: framevox add-key gemini YOUR_KEY')
    process.exit(1)
  }

  const voiceName = voice || getKey('GEMINI_VOICE') || DEFAULT_VOICE
  const modelId   = model || getKey('GEMINI_TTS_MODEL') || DEFAULT_MODEL

  log(`Gemini TTS · voice=${voiceName} · model=${modelId}`)

  const prompt = buildGeminiPrompt({ text, instruction })
  if (instruction) log(`Style steering active (${instruction.length} chars · English TTS frame)`)
  const contents = [{ parts: [{ text: prompt }] }]

  const generationConfig = {
    responseModalities: ['AUDIO'],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName }
      }
    }
  }
  if (typeof seed === 'number') {
    generationConfig.seed = seed
    if (typeof temperature !== 'number') generationConfig.temperature = 0
  }
  if (typeof temperature === 'number') generationConfig.temperature = temperature
  if (typeof seed === 'number') {
    log(`Stability · seed=${seed} · temperature=${generationConfig.temperature ?? 'default'}`)
  }

  const body = JSON.stringify({ contents, generationConfig })

  const respFile = join(tmpdir(), `framevox-gemini-${Date.now()}.json`)
  const pcmFile  = join(tmpdir(), `framevox-voice-${Date.now()}.pcm`)

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${key}`

  const MAX_ATTEMPTS = 2
  let audioB64 = null
  let lastErrorMsg = null

  log(`API call in progress… (${text.length} chars — often 30–90s, wait for cache file)`)

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const curl = spawnSync('curl', [
      '-s', '--max-time', String(REQUEST_TIMEOUT_SECONDS),
      '-X', 'POST', url,
      '-H', 'Content-Type: application/json',
      '-d', body,
      '-o', respFile,
      '-w', '%{http_code}'
    ], { stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8' })

    const httpCode = (curl.stdout || '').trim()
    let timedOut = false

    if (curl.status !== 0) {
      timedOut = curl.status === 28
      lastErrorMsg = timedOut
        ? `curl exit=28 (request timed out — NOT retrying to avoid double billing)`
        : `curl exit=${curl.status} (network error)`
    } else {
      try {
        const resp = JSON.parse(readFileSync(respFile, 'utf8'))
        if (resp?.error?.code === 429) {
          lastErrorMsg = `quota exceeded (429) · ${resp.error.message?.split('\n')[0] || 'daily limit'}`
        } else {
          const cand = resp?.candidates?.[0]
          const data = cand?.content?.parts?.[0]?.inlineData?.data
          if (data) {
            audioB64 = data
            break
          }
          const finish = cand?.finishReason ?? 'none'
          lastErrorMsg = `http=${httpCode} · finish=${finish} · ${resp?.error?.message || 'no audio in response'}`
        }
      } catch (e) {
        lastErrorMsg = `http=${httpCode} · parse error: ${e.message}`
      }
    }

    if (timedOut || lastErrorMsg?.startsWith('quota exceeded')) {
      err(lastErrorMsg)
      try { unlinkSync(respFile) } catch {}
      process.exit(1)
    }

    if (attempt < MAX_ATTEMPTS) {
      const delayMs = 1000 * Math.pow(2, attempt - 1)
      console.error(`\x1b[33m[framevox]\x1b[0m Attempt ${attempt}/${MAX_ATTEMPTS} failed: ${lastErrorMsg} — retrying in ${delayMs}ms`)
      spawnSync('sleep', [String(delayMs / 1000)])
    }
  }

  if (!audioB64) {
    err(`Gemini API failed after ${MAX_ATTEMPTS} attempts. Last error: ${lastErrorMsg}`)
    try { unlinkSync(respFile) } catch {}
    process.exit(1)
  }

  writeFileSync(pcmFile, Buffer.from(audioB64, 'base64'))

  const ffmpeg = spawnSync('ffmpeg', [
    '-y', '-f', 's16le', '-ar', '24000', '-ac', '1',
    '-i', pcmFile,
    '-codec:a', 'libmp3lame', '-b:a', '192k',
    outFile
  ], { stdio: ['ignore', 'inherit', 'inherit'] })

  try { unlinkSync(respFile); unlinkSync(pcmFile) } catch {}

  if (ffmpeg.status !== 0) {
    err('ffmpeg conversion failed. Is ffmpeg installed?')
    process.exit(1)
  }

  log(`Voice saved → ${outFile}`)
}
