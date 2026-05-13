import { spawnSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

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

export function spawnHF(args = []) {
  run('npx', ['hyperframes', ...args])
}

export function readScript() {
  const path = join(process.cwd(), 'script.txt')
  if (!existsSync(path)) {
    console.error('No script.txt found in current directory. Create one or use --text.')
    process.exit(1)
  }
  return readFileSync(path, 'utf8').trim()
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
