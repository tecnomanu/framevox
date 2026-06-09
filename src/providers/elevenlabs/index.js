import { spawnSync } from 'child_process'
import { getKey } from '../../config.js'
import { err, log } from '../../utils.js'

const DEFAULT_MODEL = 'eleven_multilingual_v2'

export const VOICES = {
  'Rachel':  'EXAVITQu4vr4xnSDxMaL',
  'Antoni':  'ErXwobaYiN019PkySvjV',
  'Domi':    'AZnzlk1XvdvUeBnXmlld',
  'Bella':   'EXAVITQu4vr4xnSDxMaL',
  'Josh':    'TxGEqnHWrfWFTfGW9XjX',
}

// v2 reads [tags] aloud — strip them. v3 supports inline audio tags natively.
function prepareSpokenText(text, modelId) {
  if (!text) return text
  const isV3 = typeof modelId === 'string' && /eleven_v3|v3/i.test(modelId)
  if (isV3) {
    return text.replace(/\[(\w+)\]([\s\S]*?)\[\/\1\]/g, (_, tag, inner) => `[${tag}] ${inner.trim()}`)
  }
  return text
    .replace(/\[(\w+)\]([\s\S]*?)\[\/\1\]/g, '$2')
    .replace(/\[\/?\w+\]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export async function generateElevenLabs({ text, instruction, voice, model, outFile }) {
  const key = getKey('ELEVENLABS_API_KEY')
  if (!key) {
    err('ElevenLabs API key not set. Run: framevox add-key elevenlabs YOUR_KEY')
    process.exit(1)
  }

  const voiceId = voice || getKey('ELEVENLABS_VOICE_ID') || Object.values(VOICES)[0]
  const modelId = model || getKey('ELEVENLABS_MODEL') || DEFAULT_MODEL
  const spoken = prepareSpokenText(text, modelId)

  log(`ElevenLabs TTS · voice=${voiceId} · model=${modelId}`)
  if (spoken !== text && !/eleven_v3|v3/i.test(modelId)) {
    log(`Bracket tags stripped (eleven_multilingual_v2 — use eleven_v3 for emotion tags)`)
  }
  if (instruction) {
    log(`Note: ElevenLabs has no style prefix — delivery tags need eleven_v3 or use Gemini.`)
  }

  const body = JSON.stringify({
    text: spoken,
    model_id: modelId,
    voice_settings: { stability: 0.5, similarity_boost: 0.75 }
  })

  const curl = spawnSync('curl', [
    '-s', '-X', 'POST',
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    '-H', `xi-api-key: ${key}`,
    '-H', 'Content-Type: application/json',
    '-H', 'Accept: audio/mpeg',
    '-d', body,
    '-o', outFile
  ], { stdio: ['ignore', 'inherit', 'inherit'] })

  if (curl.status !== 0) {
    err('ElevenLabs API request failed.')
    process.exit(1)
  }

  log(`Voice saved → ${outFile}`)
}
