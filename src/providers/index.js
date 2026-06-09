import { readProjectConfig } from '../config.js'
import { err } from '../utils.js'

export async function generateVoice({ provider, text, instruction, voice, model, outFile, lang, seed, temperature }) {
  const config   = readProjectConfig()
  const resolved = provider || config.provider || 'gemini'

  switch (resolved) {
    case 'gemini': {
      const { generateGemini } = await import('./gemini/index.js')
      return generateGemini({ text, instruction, voice, model, outFile, lang, seed, temperature })
    }
    case 'piper': {
      const { generatePiper } = await import('./piper/index.js')
      return generatePiper({ text, voice, outFile, lang })
    }
    case 'elevenlabs': {
      const { generateElevenLabs } = await import('./elevenlabs/index.js')
      return generateElevenLabs({ text, instruction, voice, model, outFile, lang })
    }
    default:
      err(`Unknown provider: ${resolved}. Use: gemini | piper | elevenlabs`)
      process.exit(1)
  }
}
