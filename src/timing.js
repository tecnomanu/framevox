import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { basename, join } from 'path'
import { spawnSync } from 'child_process'

/** Extra headroom on <audio data-duration> so HyperFrames never trims the tail. */
export const AUDIO_DURATION_MARGIN = 0.5

export function findIndexHtml(cwd = process.cwd()) {
  const candidates = [
    join(cwd, 'index.html'),
    join(cwd, '.framevox', 'index.html'),
  ]
  return candidates.find(existsSync) ?? null
}

export function probeAudioDuration(file) {
  const r = spawnSync('ffprobe', [
    '-i', file,
    '-show_entries', 'format=duration',
    '-v', 'quiet',
    '-of', 'csv=p=0',
  ], { encoding: 'utf8' })
  const d = parseFloat((r.stdout || '').trim())
  return Number.isFinite(d) && d > 0 ? d : null
}

/**
 * Effective end of speech in an audio file (strips trailing silence).
 * Used to place the next segment without overlap when mixing on a timeline.
 */
export function probeSpeechEnd(file, { noise = '-40dB', minSilence = 0.3 } = {}) {
  const total = probeAudioDuration(file)
  if (!total) return null

  const r = spawnSync('ffmpeg', [
    '-i', file,
    '-af', `silencedetect=noise=${noise}:d=${minSilence}`,
    '-f', 'null',
    '-',
  ], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })

  const log = r.stderr || ''
  const silenceStarts = [...log.matchAll(/silence_start:\s*([\d.]+)/g)].map(m => parseFloat(m[1]))
  if (silenceStarts.length === 0) return total

  const last = silenceStarts[silenceStarts.length - 1]
  if (total - last >= minSilence * 0.4) return Math.min(last, total)
  return total
}

/** Conservative duration for timeline placement (max of container length and speech end). */
export function probeSegmentDuration(file) {
  const total = probeAudioDuration(file) ?? 0
  const speechEnd = probeSpeechEnd(file) ?? total
  return Math.max(total, speechEnd)
}

/** Parse ffmpeg silencedetect into speech runs and internal pause gaps. */
export function analyzeSilences(file, { noise = '-35dB', minSilence = 0.35 } = {}) {
  const total = probeAudioDuration(file) ?? 0
  if (!total) return { total: 0, speech: [], pauses: [] }

  const r = spawnSync('ffmpeg', [
    '-i', file,
    '-af', `silencedetect=noise=${noise}:d=${minSilence}`,
    '-f', 'null',
    '-',
  ], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })

  const log = r.stderr || ''
  const events = []
  for (const m of log.matchAll(/silence_(start|end):\s*([\d.]+)/g)) {
    events.push({ type: m[1], t: parseFloat(m[2]) })
  }

  const pauses = []
  const speech = []
  let speechStart = 0
  let i = 0
  while (i < events.length) {
    if (events[i].type === 'start') {
      const pauseStart = events[i].t
      if (pauseStart > speechStart + 0.05) {
        speech.push({ start: speechStart, end: pauseStart, duration: pauseStart - speechStart })
      }
      const pauseEnd = events[i + 1]?.type === 'end' ? events[i + 1].t : pauseStart
      if (pauseEnd > pauseStart) {
        pauses.push({ start: pauseStart, end: pauseEnd, duration: pauseEnd - pauseStart })
      }
      speechStart = pauseEnd
      i += events[i + 1]?.type === 'end' ? 2 : 1
    } else {
      i++
    }
  }
  if (speechStart < total - 0.05) {
    speech.push({ start: speechStart, end: total, duration: total - speechStart })
  }

  return {
    total: roundTs(total),
    speech: speech.map(s => ({ ...s, start: roundTs(s.start), end: roundTs(s.end), duration: roundTs(s.duration) })),
    pauses: pauses.map(p => ({ ...p, start: roundTs(p.start), end: roundTs(p.end), duration: roundTs(p.duration) })),
  }
}

function roundTs(n) {
  return Math.round(n * 100) / 100
}

/**
 * Write voice-timeline.json for a single continuous MP3 (speech runs + pause gaps).
 * Useful after one-shot TTS with ... — shows where a future --split would cut.
 */
export function writeSingleVoiceTimeline(voiceFile, cwd = process.cwd()) {
  const analysis = analyzeSilences(voiceFile)
  const dir = join(cwd, '.framevox')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const payload = {
    mode: 'single',
    source: basename(voiceFile),
    total: analysis.total,
    segments: analysis.speech.map((s, i) => ({
      id: `part-${i + 1}`,
      start: s.start,
      duration: s.duration,
      end: s.end,
    })),
    pauses: analysis.pauses,
  }
  writeFileSync(join(dir, 'voice-timeline.json'), JSON.stringify(payload, null, 2))
  return payload
}

function roundDuration(seconds) {
  return Math.round(seconds * 10) / 10
}

/**
 * Set <audio data-duration> to probe(voiceFile) + margin in index.html.
 * Only touches tags whose src basename matches voiceFile.
 */
export function syncVoiceDurationInHtml(voiceFile, htmlFile, margin = AUDIO_DURATION_MARGIN) {
  if (!existsSync(voiceFile) || !existsSync(htmlFile)) return null

  const measured = probeAudioDuration(voiceFile)
  if (!measured) return null

  const target = roundDuration(measured + margin)
  const voiceBasename = basename(voiceFile)
  let html = readFileSync(htmlFile, 'utf8')
  let changed = false

  const patched = html.replace(/<audio\b[^>]*>/gi, (tag) => {
    const srcMatch = tag.match(/\bsrc=["']([^"']+)["']/i)
    if (!srcMatch || !/\bdata-duration=/i.test(tag)) return tag

    const base = srcMatch[1].split('/').pop()
    if (base !== voiceBasename) return tag

    const updated = tag.replace(
      /\bdata-duration=["'][\d.]+["']/i,
      `data-duration="${target}"`,
    )
    if (updated !== tag) changed = true
    return updated
  })

  if (changed) writeFileSync(htmlFile, patched, 'utf8')

  return { measured, dataDuration: target, margin, changed }
}
