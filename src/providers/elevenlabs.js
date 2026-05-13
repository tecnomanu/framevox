import { spawnSync } from 'child_process'
import { getKey } from '../config.js'
import { err, log } from '../utils.js'

const DEFAULT_MODEL = 'eleven_multilingual_v2'

// Popular ElevenLabs voice IDs (public library)
export const VOICES = {
  'Rachel':  'EXAVITQu4vr4xnSDxMaL',  // female, calm
  'Antoni':  'ErXwobaYiN019PkySvjV',  // male, well-rounded
  'Domi':    'AZnzlk1XvdvUeBnXmlld',  // female, strong
  'Bella':   'EXAVITQu4vr4xnSDxMaL',  // female, soft
  'Josh':    'TxGEqnHWrfWFTfGW9XjX',  // male, deep
}

export async function generateElevenLabs({ text, voice, model, outFile }) {
  const key = getKey('ELEVENLABS_API_KEY')
  if (!key) {
    err('ElevenLabs API key not set. Run: framevox add-key elevenlabs YOUR_KEY')
    process.exit(1)
  }

  const voiceId = voice || getKey('ELEVENLABS_VOICE_ID') || Object.values(VOICES)[0]
  const modelId = model || getKey('ELEVENLABS_MODEL') || DEFAULT_MODEL

  log(`ElevenLabs TTS · voice=${voiceId} · model=${modelId}`)

  const body = JSON.stringify({
    text,
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
