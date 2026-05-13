import { setKey, KEY_NAMES } from '../config.js'
import { log, bold } from '../utils.js'

const PROVIDER_MAP = {
  gemini:              'GEMINI_API_KEY',
  'gemini-voice':      'GEMINI_VOICE',
  'gemini-model':      'GEMINI_TTS_MODEL',
  elevenlabs:          'ELEVENLABS_API_KEY',
  'elevenlabs-voice':  'ELEVENLABS_VOICE_ID',
  'elevenlabs-model':  'ELEVENLABS_MODEL',
  'piper-voice':       'PIPER_VOICE',
  'piper-voices-dir':  'PIPER_VOICES_DIR',
  'piper-speed':       'PIPER_SPEED',
}

export function cmdAddKey(provider, key) {
  const envName = PROVIDER_MAP[provider]
  if (!envName) {
    console.error(`Unknown key name: ${bold(provider)}`)
    console.error('Valid names:')
    Object.keys(PROVIDER_MAP).forEach(k => console.error(`  ${k}`))
    process.exit(1)
  }

  setKey(envName, key)
  log(`${bold(envName)} saved to ~/.framevox/.env`)
}
