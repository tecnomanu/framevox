import { readScript, log, md5File } from '../utils.js'
import { generateVoice } from '../providers/index.js'
import { readProjectConfig, writeProjectConfig } from '../config.js'
import { existsSync } from 'fs'
import { join } from 'path'

export async function cmdVoice(opts) {
  const text    = opts.text || readScript()
  const outFile = join(process.cwd(), opts.out || 'voice.mp3')
  const prevMd5 = existsSync(outFile) ? md5File(outFile) : null

  await generateVoice({
    provider: opts.provider,
    text,
    voice:    opts.voice,
    model:    opts.model,
    outFile,
    lang:     opts.lang,
  })

  const newMd5 = md5File(outFile)

  if (prevMd5 && prevMd5 === newMd5) {
    console.error('\x1b[31m[framevox]\x1b[0m MD5 unchanged — voice was NOT regenerated. Check your API key / quota.')
    process.exit(1)
  }

  // Persist provider choice in project config
  const config = readProjectConfig()
  config.provider    = opts.provider || config.provider || 'gemini'
  config.lastVoice   = opts.voice
  config.lastVoiceMd5 = newMd5
  writeProjectConfig(config)

  log(`MD5: ${newMd5}`)
}
