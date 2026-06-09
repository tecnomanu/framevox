import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { err } from './utils.js'

export function voiceJsonCandidates(cwd = process.cwd()) {
  return [
    join(cwd, 'voice.json'),
    join(cwd, '.framevox', 'voice.json'),
  ]
}

export function findVoiceJson(cwd = process.cwd()) {
  return voiceJsonCandidates(cwd).find(existsSync) ?? null
}

/** Parse and validate voice.json. Returns normalized voice config. */
export function parseVoiceJson(raw) {
  let data
  try {
    data = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch (e) {
    err(`Invalid voice.json: ${e.message}`)
    process.exit(1)
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    err('voice.json must be a JSON object')
    process.exit(1)
  }

  const prompt = typeof data.prompt === 'string' ? data.prompt.trim() : null
  const text = typeof data.text === 'string' ? data.text.trim() : null
  const scenes = Array.isArray(data.scenes) ? data.scenes : null

  const hasScenes = scenes && scenes.length > 0
  const hasText = !!text

  if (!hasScenes && !hasText) {
    err('voice.json needs "text" (single audio) or "scenes" (multi-scene)')
    process.exit(1)
  }

  if (hasScenes) {
    for (const scene of scenes) {
      if (!scene?.text?.trim()) {
        err(`Scene "${scene?.id || '?'}" missing "text"`)
        process.exit(1)
      }
    }
  }

  return {
    prompt,
    text: hasScenes ? null : text,
    scenes: hasScenes ? scenes : null,
    seed: data.seed,
    temperature: data.temperature,
    gap: data.gap,
    provider: data.provider,
    voice: data.voice,
    model: data.model,
  }
}

export function readVoiceJson(cwd = process.cwd()) {
  const path = findVoiceJson(cwd)
  if (!path) {
    err('No voice.json found. Create one or use --text.')
    process.exit(1)
  }
  const data = parseVoiceJson(readFileSync(path, 'utf8'))
  return { path, data }
}

/** Serialize voice config for RECIPE.md / logs. */
export function formatVoiceForRecipe(data) {
  const out = { ...data }
  if (out.scenes) {
    out.scenes = out.scenes.map(s => ({ id: s.id, text: s.text }))
  }
  return JSON.stringify(out, null, 2)
}
