import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { readProjectConfig, writeProjectConfig } from './config.js'
import { findVoiceJson, parseVoiceJson } from './voice-json.js'

/** Merge voice.json into .framevox/config.json (runtime settings). */
export function writeVoiceProjectConfig(projectDir, { voiceData, base = {} } = {}) {
  let voice = voiceData
  if (!voice) {
    const voicePath = findVoiceJson(projectDir)
    if (voicePath) {
      voice = parseVoiceJson(readFileSync(voicePath, 'utf8'))
    }
  }

  const config = {
    provider: voice?.provider || 'gemini',
    ...base,
    ...(voice?.prompt ? { prompt: voice.prompt } : {}),
    ...(voice?.seed != null ? { seed: voice.seed } : {}),
    ...(voice?.temperature != null ? { temperature: voice.temperature } : {}),
    ...(voice?.gap != null ? { gap: voice.gap } : {}),
    ...(voice?.scenes ? { scenes: voice.scenes } : {}),
  }

  const dir = join(projectDir, '.framevox')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'config.json'), JSON.stringify(config, null, 2), 'utf8')
  return config
}

/** Re-read voice.json and patch project config before voice/render. */
export function syncVoiceProjectConfig(cwd = process.cwd()) {
  const voicePath = findVoiceJson(cwd)
  if (!voicePath) return null

  const voice = parseVoiceJson(readFileSync(voicePath, 'utf8'))
  const existing = readProjectConfig()
  const config = { ...existing }
  if (voice.provider) config.provider = voice.provider
  if (voice.prompt) config.prompt = voice.prompt
  else delete config.prompt
  if (voice.seed != null) config.seed = voice.seed
  else delete config.seed
  if (voice.temperature != null) config.temperature = voice.temperature
  else delete config.temperature
  if (voice.gap != null) config.gap = voice.gap
  if (voice.scenes) config.scenes = voice.scenes
  else delete config.scenes
  writeProjectConfig(config)
  return voice
}
