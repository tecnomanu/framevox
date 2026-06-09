import { spawnSync } from 'child_process'
import { tmpdir } from 'os'
import { join } from 'path'
import { unlinkSync } from 'fs'
import { getKey } from '../../config.js'
import { err, log, warn } from '../../utils.js'

export const VOICES = {
  'es_ES-mls-medium':          'Spanish ES · female · medium quality',
  'es_ES-sharvard-medium':     'Spanish ES · male · medium quality',
  'es_MX-ald-medium':          'Spanish MX · male · medium quality',
  'en_US-lessac-medium':       'English US · female · medium quality',
  'en_US-ryan-medium':         'English US · male · medium quality',
  'pt_BR-faber-medium':        'Portuguese BR · male · medium quality',
}

export async function generatePiper({ text, voice, outFile }) {
  const piperCheck = spawnSync('which', ['piper'], { encoding: 'utf8' })
  const piperBin = piperCheck.stdout?.trim()

  if (!piperBin) {
    err('piper binary not found. Install from: https://github.com/rhasspy/piper')
    process.exit(1)
  }

  const voiceName  = voice || getKey('PIPER_VOICE') || 'es_ES-mls-medium'
  const voicesDir  = getKey('PIPER_VOICES_DIR')
  const speed      = getKey('PIPER_SPEED') || '1.0'

  if (!voicesDir) {
    warn('PIPER_VOICES_DIR not set. Piper may not find voice models.')
    warn('Run: framevox add-key piper-voices-dir /path/to/voices')
  }

  const wavFile = join(tmpdir(), `framevox-piper-${Date.now()}.wav`)

  log(`Piper TTS · voice=${voiceName}`)

  const args = [
    '--model', voiceName,
    '--output_file', wavFile,
    '--length_scale', String(1 / parseFloat(speed)),
  ]
  if (voicesDir) args.push('--data_dir', voicesDir)

  const piper = spawnSync('piper', args, {
    input: text,
    encoding: 'utf8',
    stdio: ['pipe', 'inherit', 'inherit']
  })

  if (piper.status !== 0) {
    err('Piper failed. Check voice model is installed.')
    process.exit(1)
  }

  const ffmpeg = spawnSync('ffmpeg', [
    '-y', '-i', wavFile,
    '-codec:a', 'libmp3lame', '-b:a', '192k',
    outFile
  ], { stdio: ['ignore', 'inherit', 'inherit'] })

  try { unlinkSync(wavFile) } catch {}

  if (ffmpeg.status !== 0) {
    err('ffmpeg conversion failed.')
    process.exit(1)
  }

  log(`Voice saved → ${outFile}`)
}
