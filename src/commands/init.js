import { cpSync, mkdirSync, existsSync, writeFileSync, unlinkSync } from 'fs'
import { ensureHyperFrames } from '../hyperframes.js'
import { join } from 'path'
import { writeVoiceProjectConfig } from '../voice-config.js'
import { resolveTemplate, listTemplates, copyFamilyStyle } from '../templates.js'
import { log, warn, bold, dim } from '../utils.js'

export function cmdInit(name, opts) {
  ensureHyperFrames()

  const template = opts.template || 'minimal-mobile'
  const entry = resolveTemplate(template)

  if (!entry) {
    console.error(`Unknown template: ${bold(template)}`)
    console.error('Available templates:')
    listTemplates().forEach(t => {
      console.error(`  ${t.name.padEnd(18)} ${dim(t.label)} ${dim(`(${t.source})`)}`)
    })
    console.error()
    console.error(dim('Add to project: framevox templates add <name>'))
    console.error(dim('Install global: framevox templates install <name>'))
    process.exit(1)
  }

  const projectDir = name ? join(process.cwd(), name) : process.cwd()

  if (name) {
    if (existsSync(projectDir)) {
      warn(`Directory "${name}" already exists. Writing into it.`)
    } else {
      mkdirSync(projectDir, { recursive: true })
    }
  }

  cpSync(entry.dir, projectDir, { recursive: true })

  // Drop template metadata — not needed in scaffolded project
  const metaInProject = join(projectDir, 'template.json')
  if (existsSync(metaInProject)) unlinkSync(metaInProject)

  // Copy family style into project (self-contained after init)
  if (entry.familyDir) {
    copyFamilyStyle(entry.familyDir, join(projectDir, 'style.css'))
  }

  const assetsDir = join(projectDir, 'assets')
  if (!existsSync(assetsDir)) {
    mkdirSync(assetsDir)
    writeFileSync(join(assetsDir, '.gitkeep'), '', 'utf8')
  }

  const rendersDir = join(projectDir, 'renders')
  if (!existsSync(rendersDir)) mkdirSync(rendersDir)

  // Fresh projects should regenerate voice — template voice.mp3 is only a reference
  const voiceInProject = join(projectDir, 'voice.mp3')
  if (existsSync(voiceInProject)) unlinkSync(voiceInProject)

  writeVoiceProjectConfig(projectDir, {
    base: {
      template,
      templateSource: entry.source,
      family: entry.family || null,
      width: entry.width,
      height: entry.height,
      created: new Date().toISOString(),
    },
  })

  const dir = name || '(current directory)'
  const srcLabel = { project: 'project template', user: 'user template', builtin: 'builtin template' }[entry.source] || entry.source
  log(`Project ready · ${bold(template)} (${srcLabel})`)
  if (entry.family) log(`Family: ${bold(entry.family)} → style.css`)
  log(`Directory: ${bold(projectDir)}`)
  console.log()
  console.log(dim('Next steps:'))
  console.log(dim('  1. Edit DESIGN.md — brand colors, product info'))
  console.log(dim('  2. Edit index.html — replace <!-- BRAND: --> and <!-- COPY: --> comments'))
  console.log(dim('  3. Edit voice.json — prompt + text or scenes'))
  console.log(dim('  4. Add logo.png to assets/ if needed'))
  console.log(dim('  5. framevox voice → framevox render  (lint incluido; --no-lint para saltar)'))
  console.log()
  console.log(dim('Template source: project > ~/.framevox/templates > builtin'))
  console.log(dim('API keys: framevox add-key gemini YOUR_KEY  (stored in ~/.framevox/.env)'))
}
