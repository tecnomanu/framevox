import { mkdirSync, existsSync } from 'fs'
import {
  installTemplate,
  projectTemplatesDir,
  userTemplatesDir,
  hasProjectFramevox,
} from '../templates.js'
import { writeProjectConfig } from '../config.js'
import { ensureGlobalDir } from '../config.js'
import { log, bold, dim } from '../utils.js'

export function cmdTemplateAdd(name, opts) {
  const from = opts.from || name
  const destRoot = projectTemplatesDir()

  try {
    const { destDir, sourceName, entry } = installTemplate(name, { from, destRoot })
    if (!hasProjectFramevox()) {
      writeProjectConfig({
        templatesInstalled: [name],
        provider: 'gemini',
        created: new Date().toISOString(),
      })
    }
    const srcLabel = entry.source === 'builtin' ? 'builtin' : entry.source
    log(`Template ${bold(name)} copied → ${bold(destDir)}`)
    console.log(dim(`  Source: ${sourceName} (${srcLabel})`))
    console.log(dim('  Edit files there — init uses this copy, not the builtin.'))
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }
}

export function cmdTemplateInstall(name, opts) {
  const from = opts.from || name
  ensureGlobalDir()
  const destRoot = userTemplatesDir()
  if (!existsSync(destRoot)) mkdirSync(destRoot, { recursive: true })

  try {
    const { destDir, sourceName, entry } = installTemplate(name, { from, destRoot })
    const srcLabel = entry.source === 'builtin' ? 'builtin' : entry.source
    log(`Template ${bold(name)} installed → ${bold(destDir)}`)
    console.log(dim(`  Source: ${sourceName} (${srcLabel})`))
    console.log(dim('  Available in all projects. Project .framevox/templates overrides this.'))
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }
}
