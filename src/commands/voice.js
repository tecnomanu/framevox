import { log, md5File, err } from '../utils.js'
import { generateVoice } from '../providers/index.js'
import { generateScenes } from '../scenes.js'
import { readProjectConfig, writeProjectConfig } from '../config.js'
import { findIndexHtml, syncVoiceDurationInHtml, writeSingleVoiceTimeline } from '../timing.js'
import { syncVoiceProjectConfig } from '../voice-config.js'
import { readVoiceJson } from '../voice-json.js'
import { existsSync } from 'fs'
import { join, isAbsolute, resolve } from 'path'

export async function cmdVoice(opts) {
  const voiceFile = syncVoiceProjectConfig()
  const voiceData = voiceFile ?? readVoiceJson().data

  const projectConfig = readProjectConfig()

  const provider    = opts.provider || projectConfig.provider || voiceData.provider || 'gemini'
  const voice       = opts.voice    || projectConfig.voice    || voiceData.voice    || null
  const model       = opts.model    || projectConfig.model    || voiceData.model    || null
  const instruction = voiceData.prompt || projectConfig.prompt || null

  const rawOut  = opts.out || 'voice.mp3'
  let outFile
  if (isAbsolute(rawOut)) {
    outFile = rawOut
  } else {
    const framevoxDir = join(process.cwd(), '.framevox')
    const hasFramevoxHtml = existsSync(join(framevoxDir, 'index.html'))
    outFile = hasFramevoxHtml
      ? resolve(framevoxDir, rawOut)
      : resolve(process.cwd(), rawOut)
  }
  const prevMd5 = existsSync(outFile) ? md5File(outFile) : null

  const seed        = voiceData.seed ?? projectConfig.seed
  const temperature = voiceData.temperature ?? projectConfig.temperature

  const scenes = voiceData.scenes ?? projectConfig.scenes

  if (opts.scene && !(Array.isArray(scenes) && scenes.length > 0)) {
    err('--scene requires multi-scene voice.json ("scenes" array)')
    process.exit(1)
  }

  if (Array.isArray(scenes) && scenes.length > 0) {
    if (instruction) log(`Style guide loaded (${instruction.length} chars)`)

    let music = projectConfig.music
    if (music && music.src && !isAbsolute(music.src)) {
      const configDir = join(process.cwd(), '.framevox')
      music = { ...music, src: resolve(configDir, music.src) }
    }
    await generateScenes({
      scenes,
      provider, voice, model,
      instruction,
      seed, temperature,
      outFile,
      music,
      gap: projectConfig.gap ?? voiceData.gap ?? 0.25,
      voiceOffset: projectConfig.voiceOffset ?? 0,
      onlyScene: opts.scene ?? null,
    })
  } else {
    const text = opts.text || voiceData.text
    if (!text) {
      err('voice.json needs "text" for single-audio mode (or use --text)')
      process.exit(1)
    }

    if (instruction) log(`Style guide loaded (${instruction.length} chars)`)

    await generateVoice({
      provider,
      text,
      instruction,
      voice, model,
      seed, temperature,
      outFile,
      lang: opts.lang,
    })

    const timeline = writeSingleVoiceTimeline(outFile)
    if (timeline.pauses.length > 0) {
      log(`Pauses detected · ${timeline.pauses.map(p => `${p.duration.toFixed(1)}s@${p.start.toFixed(1)}s`).join(', ')}`)
    }
    log(`Timeline → .framevox/voice-timeline.json (${timeline.segments.length} speech parts · ${timeline.total}s)`)
  }

  const newMd5 = md5File(outFile)

  if (prevMd5 && prevMd5 === newMd5 && !opts.scene) {
    console.error('\x1b[31m[framevox]\x1b[0m MD5 unchanged — voice was NOT regenerated. Check your API key / quota.')
    process.exit(1)
  }

  const config = readProjectConfig()
  config.provider     = provider
  config.lastVoice    = voice
  config.lastVoiceMd5 = newMd5
  writeProjectConfig(config)

  log(`MD5: ${newMd5}`)

  const htmlPath = findIndexHtml()
  if (htmlPath) {
    const sync = syncVoiceDurationInHtml(outFile, htmlPath)
    if (sync?.changed) {
      log(`Audio data-duration → ${sync.dataDuration}s (${sync.measured.toFixed(2)}s voice + ${sync.margin}s margin)`)
    }
  }
}
