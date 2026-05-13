import { cpSync, mkdirSync, existsSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { writeProjectConfig, readProjectConfig } from '../config.js'
import { log, warn, bold, dim } from '../utils.js'

const __dir = dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = join(__dir, '..', '..', 'templates')

const TEMPLATES = {
  'mobile-promo':   { width: 1080, height: 1920, label: 'Mobile · 1080×1920 · 5-scene product promo' },
  'desktop-promo':  { width: 1920, height: 1080, label: 'Desktop · 1920×1080 · 5-scene product promo' },
  'mobile-minimal': { width: 1080, height: 1920, label: 'Mobile · 1080×1920 · minimal hook+CTA' },
  'desktop-minimal':{ width: 1920, height: 1080, label: 'Desktop · 1920×1080 · minimal hook+CTA' },
}

export function cmdInit(name, opts) {
  const template = opts.template || 'mobile-promo'

  if (!TEMPLATES[template]) {
    console.error(`Unknown template: ${bold(template)}`)
    console.error('Available templates:')
    Object.entries(TEMPLATES).forEach(([k, v]) => console.error(`  ${k.padEnd(18)} ${dim(v.label)}`))
    process.exit(1)
  }

  const projectDir = name ? join(process.cwd(), name) : process.cwd()
  const templateDir = join(TEMPLATES_DIR, template)

  if (!existsSync(templateDir)) {
    console.error(`Template not found at: ${templateDir}`)
    process.exit(1)
  }

  if (name) {
    if (existsSync(projectDir)) {
      warn(`Directory "${name}" already exists. Writing into it.`)
    } else {
      mkdirSync(projectDir, { recursive: true })
    }
  }

  // Copy template files
  cpSync(templateDir, projectDir, { recursive: true })

  // Create assets/ directory stub
  const assetsDir = join(projectDir, 'assets')
  if (!existsSync(assetsDir)) {
    mkdirSync(assetsDir)
    writeFileSync(join(assetsDir, '.gitkeep'), '', 'utf8')
  }

  // Create .framevox/config.json
  const meta = TEMPLATES[template]
  writeProjectConfig({
    template,
    width: meta.width,
    height: meta.height,
    provider: 'gemini',
    created: new Date().toISOString(),
  })

  const dir = name || '(current directory)'
  log(`Project ready · template: ${bold(template)}`)
  log(`Directory: ${bold(projectDir)}`)
  console.log()
  console.log(dim('Next steps:'))
  console.log(dim('  1. Edit index.html — replace <!-- BRAND: --> comments with your content'))
  console.log(dim('  2. Edit script.txt — write your voiceover script'))
  console.log(dim('  3. Add logo.png to assets/ if needed'))
  console.log(dim('  4. framevox voice   — generate audio'))
  console.log(dim('  5. framevox lint    — check composition'))
  console.log(dim('  6. framevox render  — render video'))
  console.log(dim('  7. framevox recipe  — document the process'))
  console.log()
  console.log(dim('Voice provider: gemini (change in .framevox/config.json or via --provider flag)'))
  console.log(dim('Missing API keys? Run: framevox keys'))
}
