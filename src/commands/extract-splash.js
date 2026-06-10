import { existsSync } from 'fs'
import { join, resolve } from 'path'
import { printCommandHeader } from '../banner.js'
import { pkgVersion } from '../agent-skills.js'
import { findIndexHtml } from '../timing.js'
import {
  extractSplashFromComposition,
  extractSplashFromVideo,
} from '../splash-screenshot.js'
import { err, log } from '../utils.js'

export function cmdExtractSplash(opts) {
  printCommandHeader(pkgVersion())

  const outFile = resolve(opts.out || 'splash.png')
  const fromVideo = opts.from ? resolve(opts.from) : null

  if (fromVideo) {
    log(`Extracting splash from ${fromVideo} → ${outFile}`)
    extractSplashFromVideo(fromVideo, outFile)
  } else {
    const indexHtml = findIndexHtml()
    if (!indexHtml) {
      err('No index.html found. Run from a framevox project or pass --from output.mp4')
      process.exit(1)
    }

    const cwd = join(indexHtml, '..')
    const fallbackMp4 = join(cwd, 'output.mp4')

    if (existsSync(fallbackMp4) && outFile === resolve('splash.png')) {
      log(`Extracting splash from ${fallbackMp4} → ${outFile}`)
      extractSplashFromVideo(fallbackMp4, outFile)
    } else {
      log(`Capturing splash frame (t=0) → ${outFile}`)
      extractSplashFromComposition(cwd, outFile)
    }
  }

  log(`Splash → ${outFile}`)
  log('Run: open ' + outFile)
}
