/**
 * Build Gemini TTS prompt.
 *
 * Findings (gemini-2.5-flash-preview-tts):
 * - Spanish style prefixes with "Leé en español…: <text>" often hang until timeout.
 * - English TTS framing ("Read the following text aloud… Text: …") is reliable.
 * - Long DELIVERY_RULES block + colon suffix can yield finishReason OTHER (no audio).
 * - Rules only needed when text has tags or ellipsis.
 */

export function buildGeminiPrompt({ text, instruction }) {
  const hasTags = /\[\/?\w+\]/.test(text)
  const hasEllipsis = /\.{3}/.test(text)

  // Keep style hint short — long Spanish "Leé en español…" in the payload causes finish=OTHER.
  const stylePart = instruction
    ? `Style: ${instruction.trim().replace(/:\s*$/, '').slice(0, 120)}. `
    : ''

  const ruleBits = []
  if (hasTags) {
    ruleBits.push('Bracket tags = acting cues, not spoken.')
  }
  if (hasEllipsis) ruleBits.push('... = one second pause.')
  const rulesPart = ruleBits.length ? `${ruleBits.join(' ')} ` : ''

  return `Read aloud in the given style. ${stylePart}${rulesPart}Text: ${text}`
}
