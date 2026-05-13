import { spawnSync } from 'child_process'
import { existsSync } from 'fs'
import { join, resolve } from 'path'
import { readProjectConfig, writeProjectConfig } from '../config.js'
import { log, err, warn } from '../utils.js'

export function cmdRender(opts) {
  const outFile  = opts.out || 'output.mp4'
  const quality  = opts.quality || 'normal'
  const indexHtml = join(process.cwd(), 'index.html')

  if (!existsSync(indexHtml)) {
    err('No index.html found. Run: framevox init or create your composition manually.')
    process.exit(1)
  }

  const voiceMp3 = join(process.cwd(), 'voice.mp3')
  if (!existsSync(voiceMp3)) {
    warn('No voice.mp3 found. Run: framevox voice  (if your composition uses audio)')
  }

  const hfArgs = ['hyperframes', 'render', '--output', outFile]
  if (quality === 'draft') hfArgs.push('--quality', 'draft')
  if (quality === 'high')  hfArgs.push('--quality', 'high', '--fps', '60')

  log(`Rendering → ${outFile}  (quality: ${quality})`)

  const result = spawnSync('npx', hfArgs, { stdio: 'inherit', cwd: process.cwd() })

  if (result.status !== 0) {
    err('HyperFrames render failed.')
    process.exit(1)
  }

  // Save render record
  const config = readProjectConfig()
  config.lastRender = {
    file: resolve(outFile),
    quality,
    timestamp: new Date().toISOString(),
  }
  writeProjectConfig(config)

  log(`Done → ${resolve(outFile)}`)
  log('Run: open ' + outFile)
}
