import { DELIVERY_RULES } from './gemini/rules.js'

/** Merge user style guide with provider-specific delivery rules. */
export function mergeInstruction(provider, userInstruction) {
  const user = (userInstruction || '').trim()
  if (provider === 'gemini') {
    return user ? `${user}\n\n${DELIVERY_RULES}` : DELIVERY_RULES
  }
  // ElevenLabs / Piper: no API style prefix — user guide unused at request level.
  return user || null
}
