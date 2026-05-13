import { getKey, listKeys } from '../config.js'
import { bold, dim } from '../utils.js'

function mask(val) {
  if (!val) return dim('(not set)')
  if (val.length <= 8) return '••••'
  return val.slice(0, 4) + '••••' + val.slice(-4)
}

export function cmdKeys() {
  console.log('\nFramevox · configured TTS providers\n')

  const providers = {
    'Gemini (remote)': {
      'GEMINI_API_KEY':   { label: 'API key',      required: true },
      'GEMINI_VOICE':     { label: 'Voice',         default: 'Aoede' },
      'GEMINI_TTS_MODEL': { label: 'Model',         default: 'gemini-2.5-flash-preview-tts' },
    },
    'ElevenLabs (remote)': {
      'ELEVENLABS_API_KEY':  { label: 'API key',   required: true },
      'ELEVENLABS_VOICE_ID': { label: 'Voice ID',  default: 'Rachel' },
      'ELEVENLABS_MODEL':    { label: 'Model',     default: 'eleven_multilingual_v2' },
    },
    'Piper (local)': {
      'PIPER_VOICE':      { label: 'Voice model',  required: true },
      'PIPER_VOICES_DIR': { label: 'Models dir',   default: '~/.local/share/piper' },
      'PIPER_SPEED':      { label: 'Speed',        default: '1.0' },
    },
  }

  for (const [pName, keys] of Object.entries(providers)) {
    console.log(bold(pName))
    for (const [envKey, { label, required, default: def }] of Object.entries(keys)) {
      const val = getKey(envKey)
      const display = val ? mask(val) : (def ? dim(`default: ${def}`) : dim('(not set)'))
      const req = required && !val ? ' \x1b[31m← required\x1b[0m' : ''
      console.log(`  ${label.padEnd(16)} ${display}${req}`)
    }
    console.log()
  }

  console.log(dim('Set keys with: framevox add-key <name> <value>'))
  console.log(dim('Keys are stored in ~/.framevox/.env'))
  console.log(dim('Gemini key also reads from ~/.claude/skills/video-docs-builder/.env as fallback'))
  console.log()
}
