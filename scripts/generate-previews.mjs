#!/usr/bin/env node
/**
 * Renders preview.mp4 for builtin templates.
 * Uses tmp/preview-gen/ — never writes .framevox into template source dirs.
 */
import { cpSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, rmSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { spawnSync } from 'child_process'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dir, '..')
const TMP  = join(ROOT, 'tmp', 'preview-gen')
const BIN  = join(ROOT, 'bin', 'framevox.js')
const { writeVoiceProjectConfig } = await import(pathToFileURL(join(ROOT, 'src', 'voice-config.js')).href)

const FAMILIES = ['minimal', 'promo', 'studio', 'immersive']
const FORMATS  = process.argv.includes('--all') ? ['mobile', 'desktop'] : ['mobile']

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit' })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

for (const family of FAMILIES) {
  for (const fmt of FORMATS) {
    const name = `${family}-${fmt}`
    const src = join(ROOT, 'templates', family, fmt)
    const familyDir = join(ROOT, 'templates', family)
    const work = join(TMP, name)
    const out  = join(src, 'preview.mp4')

    if (!existsSync(join(src, 'index.html'))) {
      console.warn(`Skip ${name} — no index.html`)
      continue
    }

    const voicePath = join(src, 'voice.json')
    if (!existsSync(voicePath)) {
      console.warn(`Skip ${name} — no voice.json`)
      continue
    }

    console.log(`\n=== ${name} ===`)
    rmSync(work, { recursive: true, force: true })
    mkdirSync(work, { recursive: true })

    cpSync(src, work, { recursive: true, filter: (p) => !p.endsWith('preview.mp4') })
    cpSync(join(familyDir, 'mobile', 'assets'), join(work, 'assets'), { recursive: true, force: true })

    if (existsSync(join(familyDir, 'style.css'))) {
      copyFileSync(join(familyDir, 'style.css'), join(work, 'style.css'))
    }

    mkdirSync(join(work, 'assets'), { recursive: true })

    writeVoiceProjectConfig(work, { base: { provider: 'gemini' } })

    run('node', [BIN, 'voice', '-o', 'voice.mp3'], work)
    run('node', [BIN, 'render', '--out', 'output.mp4', '--quality', 'draft'], work)

    copyFileSync(join(work, 'output.mp4'), out)
    console.log(`→ ${out}`)
  }
}

rmSync(TMP, { recursive: true, force: true })
console.log('\nDone.')
