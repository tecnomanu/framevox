import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const GLOBAL_DIR = join(homedir(), '.framevox')
const GLOBAL_ENV = join(GLOBAL_DIR, '.env')
const LEGACY_ENV = join(homedir(), '.claude', 'skills', 'video-docs-builder', '.env')

export function ensureGlobalDir() {
  if (!existsSync(GLOBAL_DIR)) mkdirSync(GLOBAL_DIR, { recursive: true })
}

function parseEnvFile(path) {
  if (!existsSync(path)) return {}
  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split('\n')
      .filter(l => l.trim() && !l.startsWith('#') && l.includes('='))
      .map(l => {
        const idx = l.indexOf('=')
        let val = l.slice(idx + 1).trim()
        const hash = val.indexOf('#')
        if (hash >= 0) val = val.slice(0, hash).trim()
        return [l.slice(0, idx).trim(), val]
      })
  )
}

function writeEnvFile(path, data) {
  const lines = Object.entries(data).map(([k, v]) => `${k}=${v}`)
  writeFileSync(path, lines.join('\n') + '\n', 'utf8')
}

export function getKey(name) {
  // 1. process env
  if (process.env[name]) return process.env[name]
  // 2. ~/.framevox/.env
  const global = parseEnvFile(GLOBAL_ENV)
  if (global[name]) return global[name]
  // 3. legacy video-docs-builder .env (backward compat)
  const legacy = parseEnvFile(LEGACY_ENV)
  if (legacy[name]) return legacy[name]
  return null
}

export function setKey(name, value) {
  ensureGlobalDir()
  const data = parseEnvFile(GLOBAL_ENV)
  data[name] = value
  writeEnvFile(GLOBAL_ENV, data)
}

export function listKeys() {
  const data = parseEnvFile(GLOBAL_ENV)
  return data
}

// Project config: .framevox/config.json in cwd
export function readProjectConfig(cwd = process.cwd()) {
  const path = join(cwd, '.framevox', 'config.json')
  if (!existsSync(path)) return {}
  return JSON.parse(readFileSync(path, 'utf8'))
}

export function writeProjectConfig(data, cwd = process.cwd()) {
  const dir = join(cwd, '.framevox')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'config.json'), JSON.stringify(data, null, 2), 'utf8')
}

// Key names per provider
export const KEY_NAMES = {
  gemini:      { api: 'GEMINI_API_KEY', voice: 'GEMINI_VOICE', model: 'GEMINI_TTS_MODEL' },
  elevenlabs:  { api: 'ELEVENLABS_API_KEY', voice: 'ELEVENLABS_VOICE_ID', model: 'ELEVENLABS_MODEL' },
  piper:       { voice: 'PIPER_VOICE', dir: 'PIPER_VOICES_DIR', speed: 'PIPER_SPEED' },
}
