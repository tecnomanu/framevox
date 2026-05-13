import { readProjectConfig } from '../config.js'
import { err } from '../utils.js'

export async function generateVoice({ provider, text, voice, model, outFile, lang }) {
  const config   = readProjectConfig()
  const resolved = provider || config.provider || 'gemini'

  switch (resolved) {
    case 'gemini': {
      const { generateGemini } = await import('./gemini.js')
      return generateGemini({ text, voice, model, outFile, lang })
    }
    case 'piper': {
      const { generatePiper } = await import('./piper.js')
      return generatePiper({ text, voice, outFile, lang })
    }
    case 'elevenlabs': {
      const { generateElevenLabs } = await import('./elevenlabs.js')
      return generateElevenLabs({ text, voice, model, outFile, lang })
    }
    default:
      err(`Unknown provider: ${resolved}. Use: gemini | piper | elevenlabs`)
      process.exit(1)
  }
}
