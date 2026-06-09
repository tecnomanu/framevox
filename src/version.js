import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { runCapture, err, dim } from './utils.js'

const PACKAGE = 'framevox'
const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

export function currentPkgVersion() {
  return JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf8')).version
}

export function isDevCheckout() {
  return !PKG_ROOT.includes('node_modules')
}

export function fetchLatestVersion() {
  const r = runCapture('npm', ['view', PACKAGE, 'version'])
  if (r.status !== 0) {
    const msg = (r.stderr || r.stdout || '').trim()
    if (msg.includes('E404') || msg.includes('404')) {
      err(`${PACKAGE} is not published on npm yet`)
      console.log(dim('Publish first, then: framevox update'))
    } else {
      err(`Could not reach npm registry: ${msg}`)
    }
    throw new Error(msg || 'npm view failed')
  }
  return r.stdout.trim()
}

export function compareVersions(a, b) {
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
