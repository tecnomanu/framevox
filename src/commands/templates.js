import {
  listTemplates,
  listBuiltinTemplates,
  projectTemplatesDir,
  userTemplatesDir,
  stylesDir,
  hasProjectFramevox,
  previewPath,
} from '../templates.js'
import { readdirSync, existsSync } from 'fs'
import { bold, dim } from '../utils.js'

export function cmdTemplatesList(opts) {
  const templates = listTemplates()
  const projectDir = projectTemplatesDir()
  const userDir = userTemplatesDir()
  const hasFramevox = hasProjectFramevox()

  if (opts.json) {
    console.log(JSON.stringify({
      hasProjectFramevox: hasFramevox,
      projectTemplatesDir: projectDir,
      userTemplatesDir: userDir,
      templates,
      builtinPreviews: listBuiltinTemplates().map(t => ({
        name: t.name,
        label: t.label,
        preview: t.preview,
        previewExists: existsSync(t.preview),
      })),
    }, null, 2))
    return
  }

  console.log(bold('Templates'))
  if (!hasFramevox) {
    console.log(dim('  No .framevox/ in this project — run templates add <name> to install project copies'))
  }
  console.log()

  if (templates.length === 0) {
    console.log(dim('No templates found.'))
    return
  }

  for (const t of templates) {
    const size = t.width && t.height ? `${t.width}×${t.height}` : '?'
    const dur  = t.duration ? `${t.duration}s` : '?'
    const preview = existsSync(t.preview) ? t.preview : null
    console.log(`  ${bold(t.name)}`)
    console.log(dim(`    ${t.label}`))
    console.log(dim(`    ${size} · ${dur} · ${t.source}${t.style ? ` · style:${t.style}` : ''}`))
    if (preview) console.log(dim(`    preview: ${preview}`))
    console.log()
  }

  console.log(dim('Resolution: project > ~/.framevox/templates > builtin'))
  console.log(dim('Add to project:  framevox templates add <name>'))
  console.log(dim('Install global:  framevox templates install <name>'))
  console.log(dim('Scaffold video:  framevox init <folder> --template <name>'))
  console.log(dim(`Project dir: ${projectDir}`))
  console.log(dim(`User dir:    ${userDir}`))

  const styles = existsSync(stylesDir())
    ? readdirSync(stylesDir()).filter(f => f.endsWith('.css')).map(f => f.replace('.css', ''))
    : []
  if (styles.length) {
    console.log(dim(`Style packs: ${styles.join(', ')}`))
  }
}
