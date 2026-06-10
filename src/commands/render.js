import { existsSync } from 'fs'
import { join, resolve } from 'path'
import { readProjectConfig, writeProjectConfig } from '../config.js'
import { runHyperframes } from '../hyperframes.js'
import { findIndexHtml, syncVoiceDurationInHtml } from '../timing.js'
import { defaultSplashPath, extractSplashFromVideo } from '../splash-screenshot.js'
import { printCommandHeader } from '../banner.js'
import { pkgVersion } from '../agent-skills.js'
import { log, err, warn } from '../utils.js'

export function cmdRender(opts) {
  printCommandHeader(pkgVersion())
  const outFile = opts.out || 'output.mp4'
  const quality = opts.quality || 'normal'
  const skipLint = opts.noLint === true

  const indexHtml = findIndexHtml()
  if (!indexHtml) {
    err('No index.html found in cwd or .framevox/. Run: framevox init or create your composition manually.')
    process.exit(1)
  }

  const renderCwd = join(indexHtml, '..')

  const voiceMp3 = join(renderCwd, 'voice.mp3')
  if (!existsSync(voiceMp3)) {
    warn('No voice.mp3 found. Run: framevox voice  (if your composition uses audio)')
  } else {
    const sync = syncVoiceDurationInHtml(voiceMp3, indexHtml)
    if (sync?.changed) {
      log(`Audio data-duration → ${sync.dataDuration}s (${sync.measured.toFixed(2)}s voice + ${sync.margin}s margin)`)
    }
  }

  if (!skipLint) {
    log('Linting composition…')
    runHyperframes(['lint'], { cwd: renderCwd })
  }

  const hfArgs = ['render', '--output', resolve(outFile)]
  if (quality === 'draft') hfArgs.push('--quality', 'draft')
  if (quality === 'high') hfArgs.push('--quality', 'high', '--fps', '60')

  log(`Rendering → ${outFile}  (quality: ${quality})`)
  runHyperframes(hfArgs, { cwd: renderCwd })

  const resolvedOut = resolve(outFile)
  const splashPath = opts.splashOut
    ? resolve(opts.splashOut)
    : defaultSplashPath(resolvedOut)

  const config = readProjectConfig()
  config.lastRender = {
    file: resolvedOut,
    quality,
    timestamp: new Date().toISOString(),
  }

  if (opts.splash !== false) {
    log(`Splash screenshot → ${splashPath}`)
    extractSplashFromVideo(resolvedOut, splashPath)
    config.lastRender.splash = splashPath
  }

  writeProjectConfig(config)

  log(`Done → ${resolvedOut}`)
  log('Run: open ' + resolvedOut)
  if (opts.splash !== false) {
    log('Run: open ' + splashPath)
  }
}
