import { spawnSync } from 'child_process'
import { existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { log } from './utils.js'

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const LOCAL_BIN = join(PKG_ROOT, 'node_modules', '.bin', 'hyperframes')

/** Resolve hyperframes executable: bundled dep first, then PATH/npx. */
export function resolveHyperframesBin() {
  if (existsSync(LOCAL_BIN)) return LOCAL_BIN
  return null
}

/** Verify hyperframes is callable; install bundled dep if missing (e.g. partial global install). */
export function ensureHyperFrames() {
  let bin = resolveHyperframesBin()

  if (bin) {
    const probe = spawnSync(bin, ['--help'], { encoding: 'utf8', stdio: 'pipe' })
    if (probe.status === 0 && probe.stdout?.includes('hyperframes')) return bin
  }

  log('HyperFrames not found — installing dependency…')
  const install = spawnSync(
    'npm',
    ['install', 'hyperframes@latest', '--no-save', '--no-package-lock'],
    { cwd: PKG_ROOT, stdio: 'inherit' },
  )

  if (install.status !== 0) {
    console.error('[framevox] Failed to install hyperframes. Try: npm install -g hyperframes')
    process.exit(1)
  }

  bin = resolveHyperframesBin()
  if (!bin) {
    console.error('[framevox] hyperframes installed but binary not found.')
    process.exit(1)
  }

  return bin
}

/** Run hyperframes with args; uses bundled binary when available. */
export function runHyperframes(args, opts = {}) {
  const bin = ensureHyperFrames()
  const result = spawnSync(bin, args, { stdio: 'inherit', ...opts })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
  return result
}
