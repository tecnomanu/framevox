import { writeFileSync, unlinkSync } from 'fs'
import { spawnSync } from 'child_process'
import { tmpdir } from 'os'
import { join } from 'path'
import { getKey } from '../config.js'
import { err, log } from '../utils.js'

const DEFAULT_MODEL = 'gemini-2.5-flash-preview-tts'
const DEFAULT_VOICE = 'Aoede'

// Voice presets for quick selection
export const VOICES = {
  Aoede:  'femenina, cálida, creadora de contenido moderna',
  Kore:   'neutra, clara, profesional',
  Charon: 'masculina, profunda, narrativa',
  Fenrir: 'masculina, joven, energética',
  Puck:   'neutra, amigable, casual',
}

export async function generateGemini({ text, voice, model, outFile }) {
  const key = getKey('GEMINI_API_KEY')
  if (!key) {
    err('Gemini API key not set. Run: framevox add-key gemini YOUR_KEY')
    process.exit(1)
  }

  const voiceName = voice || getKey('GEMINI_VOICE') || DEFAULT_VOICE
  const modelId   = model || getKey('GEMINI_TTS_MODEL') || DEFAULT_MODEL

  log(`Gemini TTS · voice=${voiceName} · model=${modelId}`)

  const body = JSON.stringify({
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName }
        }
      }
    }
  })

  const respFile = join(tmpdir(), `framevox-gemini-${Date.now()}.json`)
  const pcmFile  = join(tmpdir(), `framevox-voice-${Date.now()}.pcm`)

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${key}`

  const curl = spawnSync('curl', [
    '-s', '-X', 'POST', url,
    '-H', 'Content-Type: application/json',
    '-d', body,
    '-o', respFile
  ], { stdio: ['ignore', 'inherit', 'inherit'] })

  if (curl.status !== 0) {
    err('Gemini API request failed.')
    process.exit(1)
  }

  // Extract base64 audio
  const jq = spawnSync('jq', [
    '-r',
    '.candidates[0].content.parts[0].inlineData.data',
    respFile
  ], { encoding: 'utf8' })

  if (!jq.stdout?.trim() || jq.stdout.trim() === 'null') {
    err('Gemini returned no audio. Check your key and quota.')
    try { unlinkSync(respFile) } catch {}
    process.exit(1)
  }

  // Decode base64 to PCM
  writeFileSync(pcmFile, Buffer.from(jq.stdout.trim(), 'base64'))

  // Convert PCM → MP3 via ffmpeg
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
