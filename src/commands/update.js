import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { run, runCapture, log, warn, err, bold, dim } from '../utils.js'

const PACKAGE = 'framevox'
const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

function currentVersion() {
  return JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf8')).version
}

function isDevCheckout() {
  return !PKG_ROOT.includes('node_modules')
}

function fetchLatestVersion() {
  const r = runCapture('npm', ['view', PACKAGE, 'version'])
  if (r.status !== 0) {
    const msg = (r.stderr || r.stdout || '').trim()
    if (msg.includes('E404') || msg.includes('404')) {
      err(`${PACKAGE} is not published on npm yet`)
      console.log(dim('Publish first, then: framevox update'))
    } else {
      err(`Could not reach npm registry: ${msg}`)
    }
    process.exit(1)
  }
  return r.stdout.trim()
}

function compareVersions(a, b) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const da = pa[i] || 0
    const db = pb[i] || 0
    if (da > db) return 1
    if (da < db) return -1
  }
  return 0
}

export function cmdUpdate(opts) {
  const current = currentVersion()
  const latest  = fetchLatestVersion()
  const cmp     = compareVersions(current, latest)

  if (opts.check) {
    if (cmp >= 0) {
      log(`Up to date · ${bold(current)}`)
    } else {
      log(`Update available · ${bold(current)} → ${bold(latest)}`)
      console.log(dim('Run: framevox update'))
    }
    return
  }

  if (cmp >= 0 && !opts.force) {
    log(`Already on latest · ${bold(current)}`)
    console.log(dim('Use --force to reinstall'))
    return
  }

  if (isDevCheckout()) {
    warn('Running from source checkout — this installs the global npm package')
  }

  log(`Updating ${PACKAGE} · ${current} → ${latest}`)
  run('npm', ['install', '-g', `${PACKAGE}@latest`])

  const installed = runCapture('npm', ['list', '-g', PACKAGE, '--depth=0', '--json'])
  let newVersion = latest
  if (installed.status === 0) {
    try {
      const tree = JSON.parse(installed.stdout)
      newVersion = tree.dependencies?.[PACKAGE]?.version || latest
    } catch { /* use latest from registry */ }
  }

  log(`Done · ${bold(newVersion)}`)
  console.log(dim('Verify: framevox --version'))
  console.log(dim('npx users: npx framevox@latest … always pulls latest without global install'))
}
