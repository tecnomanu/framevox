import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { spawnSync } from 'child_process'
import { runHyperframes } from './hyperframes.js'
import { err } from './utils.js'

/** Default splash.png next to the rendered MP4. */
export function defaultSplashPath(outMp4) {
  return join(dirname(resolve(outMp4)), 'splash.png')
}

/** Extract frame 0 from a rendered MP4 (matches video pixels). */
export function extractSplashFromVideo(videoPath, outPath) {
  const src = resolve(videoPath)
  const dest = resolve(outPath)

  if (!existsSync(src)) {
    err(`Video not found: ${src}`)
    process.exit(1)
  }

  mkdirSync(dirname(dest), { recursive: true })

  const r = spawnSync('ffmpeg', [
    '-y',
    '-ss', '0',
    '-i', src,
    '-vframes', '1',
    '-q:v', '2',
    dest,
  ], { encoding: 'utf8', stdio: 'pipe' })

  if (r.status !== 0) {
    err('ffmpeg splash extract failed. Is ffmpeg installed?')
    if (r.stderr) console.error(r.stderr.trim())
    process.exit(1)
  }

  return dest
}

/** Capture composition at t=0 via HyperFrames snapshot (no render required). */
export function extractSplashFromComposition(cwd, outPath, { at = 0 } = {}) {
  const dest = resolve(outPath)
  mkdirSync(dirname(dest), { recursive: true })

  runHyperframes(['snapshot', '--at', String(at), '--timeout', '8000'], { cwd })

  const snapshotsDir = join(cwd, 'snapshots')
  if (!existsSync(snapshotsDir)) {
    err('HyperFrames snapshot produced no output.')
    process.exit(1)
  }

  const atTag = `${Number(at).toFixed(1)}s`
  const match = readdirSync(snapshotsDir)
    .filter((f) => f.endsWith('.png') && f.includes(`at-${atTag}`))
    .sort()
    .at(-1)

  if (!match) {
    err(`No snapshot found for t=${at}s in ${snapshotsDir}`)
    process.exit(1)
  }

  copyFileSync(join(snapshotsDir, match), dest)
  return dest
}
