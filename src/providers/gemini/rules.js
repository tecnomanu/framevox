/** Base delivery rules appended to every Gemini TTS call (after user style guide). */
export const DELIVERY_RULES = `Rules:
- Read bracket tags as acting cues only — never speak the tag labels aloud.
- Tags use open/close pairs: [tag]...[/tag]. Outside any tag, use a neutral, natural tone with no extra drama.
- [eloquent]...[/eloquent] = strong emphasis, theatrical, almost shouting.
- [sad]...[/sad] = subdued, melancholic, softer delivery.
- [whisper]...[/whisper] = quiet, intimate whisper.
- [excited]...[/excited] = high energy, upbeat.
- When you see ... (ellipsis), pause for at least one second before continuing.
- Do not read URLs as letters — spell domains as words (e.g. "myapp punto com").`
