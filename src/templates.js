import { readdirSync, readFileSync, existsSync, cpSync, mkdirSync } from 'fs'
import { homedir } from 'os'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const BUILTIN_DIR = join(__dir, '..', 'templates')
const SKIP_DIRS = new Set(['_archive'])

function readMeta(dir) {
  const metaPath = join(dir, 'template.json')
  if (!existsSync(metaPath)) return null
  try {
    return JSON.parse(readFileSync(metaPath, 'utf8'))
  } catch {
    return null
  }
}

function readFamilyMeta(familyDir) {
  const p = join(familyDir, 'family.json')
  if (!existsSync(p)) return {}
  try {
    return JSON.parse(readFileSync(p, 'utf8'))
  } catch {
    return {}
  }
}

function isFamilyDir(dir) {
  return ['mobile', 'desktop'].some(fmt => existsSync(join(dir, fmt, 'index.html')))
}

function familyDirFor(entryDir) {
  const parent = dirname(entryDir)
  const fmt = dirname(entryDir).split('/').pop()
  if (['mobile', 'desktop'].includes(dirname(entryDir).split(/[/\\]/).pop())) {
    return parent
  }
  return null
}

function buildEntry(name, dir, source, meta = {}, extra = {}) {
  const m = { ...meta }
  const familyDir = extra.familyDir || null
  return {
    name,
    dir,
    source,
    label: m.label || name,
    width: m.width,
    height: m.height,
    duration: m.duration,
    scenes: m.scenes,
    family: extra.family || m.family || null,
    format: extra.format || m.format || null,
    familyDir,
    preview: previewPath(dir),
  }
}

export function builtinTemplatesDir() {
  return BUILTIN_DIR
}

export function stylesDir() {
  return join(BUILTIN_DIR, 'styles')
}

export function projectTemplatesDir(cwd = process.cwd()) {
  return join(cwd, '.framevox', 'templates')
}

export function userTemplatesDir() {
  return join(homedir(), '.framevox', 'templates')
}

export function hasProjectFramevox(cwd = process.cwd()) {
  return existsSync(join(cwd, '.framevox'))
}

export function previewPath(templateDir) {
  return join(templateDir, 'preview.mp4')
}

function scanTemplateRoot(root, source) {
  if (!existsSync(root)) return []
  const entries = []

  for (const d of readdirSync(root, { withFileTypes: true })) {
    if (!d.isDirectory() || SKIP_DIRS.has(d.name) || d.name.startsWith('.')) continue
    const path = join(root, d.name)

    if (isFamilyDir(path)) {
      const familyMeta = readFamilyMeta(path)
      for (const fmt of ['mobile', 'desktop']) {
        const fmtDir = join(path, fmt)
        if (!existsSync(join(fmtDir, 'index.html'))) continue
        const tplName = `${d.name}-${fmt}`
        const fmtMeta = readMeta(fmtDir) || {}
        entries.push(buildEntry(
          tplName,
          fmtDir,
          source,
          { ...familyMeta, ...fmtMeta },
          { family: d.name, format: fmt, familyDir: path },
        ))
      }
      continue
    }

    if (existsSync(join(path, 'index.html'))) {
      entries.push(buildEntry(d.name, path, source, readMeta(path) || {}))
    }
  }

  return entries
}

export function listTemplates(cwd = process.cwd()) {
  const project = scanTemplateRoot(projectTemplatesDir(cwd), 'project')
  const user    = scanTemplateRoot(userTemplatesDir(), 'user')
  const builtin = scanTemplateRoot(BUILTIN_DIR, 'builtin')
  const byName = new Map()
  for (const t of builtin) byName.set(t.name, t)
  for (const t of user)    byName.set(t.name, t)
  for (const t of project) byName.set(t.name, t)
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export function listBuiltinTemplates() {
  return scanTemplateRoot(BUILTIN_DIR, 'builtin').sort((a, b) => a.name.localeCompare(b.name))
}

export function listFamilies(cwd = process.cwd()) {
  const roots = [
    { root: projectTemplatesDir(cwd), source: 'project' },
    { root: userTemplatesDir(), source: 'user' },
    { root: BUILTIN_DIR, source: 'builtin' },
  ]
  const byName = new Map()
  for (const { root, source } of roots) {
    if (!existsSync(root)) continue
    for (const d of readdirSync(root, { withFileTypes: true })) {
      if (!d.isDirectory() || SKIP_DIRS.has(d.name)) continue
      const dir = join(root, d.name)
      if (isFamilyDir(dir)) byName.set(d.name, { name: d.name, dir, source, meta: readFamilyMeta(dir) })
    }
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export function resolveFamily(name, cwd = process.cwd()) {
  const roots = [
    { root: projectTemplatesDir(cwd), source: 'project' },
    { root: userTemplatesDir(), source: 'user' },
    { root: BUILTIN_DIR, source: 'builtin' },
  ]
  for (const { root, source } of roots) {
    const dir = join(root, name)
    if (isFamilyDir(dir)) {
      return { name, dir, source, meta: readFamilyMeta(dir) }
    }
  }
  return null
}

export function resolveTemplate(name, cwd = process.cwd()) {
  const projectDir = join(projectTemplatesDir(cwd), name)
  if (existsSync(join(projectDir, 'index.html'))) {
    return buildEntry(name, projectDir, 'project', readMeta(projectDir) || {})
  }

  // family format: promo-mobile → project/.framevox/templates/promo/mobile
  const slash = name.match(/^([^/]+)-(mobile|desktop)$/)
  if (slash) {
    const nested = join(projectTemplatesDir(cwd), slash[1], slash[2])
    if (existsSync(join(nested, 'index.html'))) {
      const familyDir = join(projectTemplatesDir(cwd), slash[1])
      return buildEntry(name, nested, 'project', readMeta(nested) || {}, {
        family: slash[1], format: slash[2], familyDir,
      })
    }
  }

  const userDir = join(userTemplatesDir(), name)
  if (existsSync(join(userDir, 'index.html'))) {
    return buildEntry(name, userDir, 'user', readMeta(userDir) || {})
  }
  if (slash) {
    const nested = join(userTemplatesDir(), slash[1], slash[2])
    if (existsSync(join(nested, 'index.html'))) {
      const familyDir = join(userTemplatesDir(), slash[1])
      return buildEntry(name, nested, 'user', readMeta(nested) || {}, {
        family: slash[1], format: slash[2], familyDir,
      })
    }
  }

  const builtinDir = join(BUILTIN_DIR, name)
  if (existsSync(join(builtinDir, 'index.html'))) {
    return buildEntry(name, builtinDir, 'builtin', readMeta(builtinDir) || {})
  }
  if (slash) {
    const nested = join(BUILTIN_DIR, slash[1], slash[2])
    if (existsSync(join(nested, 'index.html'))) {
      const familyDir = join(BUILTIN_DIR, slash[1])
      return buildEntry(name, nested, 'builtin', readMeta(nested) || {}, {
        family: slash[1], format: slash[2], familyDir,
      })
    }
  }

  return null
}

export function copyFamilyStyle(familyDir, destPath) {
  const styleFile = join(familyDir, 'style.css')
  if (!existsSync(styleFile)) return false
  cpSync(styleFile, destPath)
  return true
}

export function copyTemplateBundle(entry, destDir) {
  mkdirSync(destDir, { recursive: true })
  cpSync(entry.dir, destDir, { recursive: true })

  if (entry.familyDir) {
    copyFamilyStyle(entry.familyDir, join(destDir, 'style.css'))
  }

  const assetsDir = join(destDir, 'assets')
  if (!existsSync(assetsDir)) mkdirSync(assetsDir)
}

export function installTemplate(name, { from, destRoot, cwd = process.cwd() }) {
  const sourceName = from || name

  const family = resolveFamily(sourceName, cwd)
  if (family) {
    const destDir = join(destRoot, sourceName)
    if (existsSync(destDir)) throw new Error(`Template family already exists: ${destDir}`)
    cpSync(family.dir, destDir, { recursive: true })
    return { entry: family, destDir, sourceName, isFamily: true }
  }

  const entry = resolveTemplate(sourceName, cwd)
  if (!entry) throw new Error(`Unknown template: ${sourceName}`)

  const destDir = join(destRoot, name)
  if (existsSync(destDir)) throw new Error(`Template already exists: ${destDir}`)

  copyTemplateBundle(entry, destDir)
  return { entry, destDir, sourceName, isFamily: false }
}
