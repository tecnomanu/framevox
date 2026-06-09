import { spawnSync } from 'child_process'
import { runHyperframes } from './hyperframes.js'

export function run(cmd, args = [], opts = {}) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', ...opts })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
  return result
}

export function runCapture(cmd, args = [], opts = {}) {
  return spawnSync(cmd, args, { encoding: 'utf8', ...opts })
}

export function spawnHF(args = [], opts = {}) {
  runHyperframes(args, opts)
}

export function md5File(path) {
  const result = runCapture('md5', ['-q', path])
  if (!result.stdout) {
    const r2 = runCapture('md5sum', [path])
    return r2.stdout?.split(' ')[0]?.trim()
  }
  return result.stdout.trim()
}

export function log(msg) {
  console.log(`\x1b[36m[framevox]\x1b[0m ${msg}`)
}

export function warn(msg) {
  console.warn(`\x1b[33m[framevox]\x1b[0m ${msg}`)
}

export function err(msg) {
  console.error(`\x1b[31m[framevox]\x1b[0m ${msg}`)
}

export function bold(str) {
  return `\x1b[1m${str}\x1b[0m`
}

export function dim(str) {
  return `\x1b[2m${str}\x1b[0m`
}
