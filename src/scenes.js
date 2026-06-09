// Multi-scene voice generation with timeline mixing.
//
// Given a `scenes` array in config.json, generates one TTS segment per scene,
// then mixes them onto a single voice.mp3 the HTML audio element plays as-is.
//
// Two placement modes per scene:
//   - Explicit `start` (number): segment is placed at that absolute timestamp.
//     Overlaps are detected and auto-bumped using measured segment duration.
//   - No `start` (omitted): segments are concatenated back-to-back with a short
//     gap — no amix overlap possible.
//
// Why segments instead of one big call:
//   - gemini-2.5-flash-preview-tts caps audio output at ~17s (hidden limit, not maxOutputTokens)
//   - Splitting into short scenes (each well under the cap) sidesteps the limit entirely
import { spawnSync } from 'child_process'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { createHash } from 'crypto'
import { join } from 'path'
import { generateVoice } from './providers/index.js'
import { log, err } from './utils.js'
import { probeSegmentDuration } from './timing.js'

// Hash determines cache identity. If text/voice/model/seed/instruction match, reuse the cached MP3.
// Any change to the prompt or text invalidates the cache automatically.
function sceneHash({ text, voice, model, seed, temperature, instruction, provider }) {
  const h = createHash('sha256')
  h.update(JSON.stringify({ text, voice, model, seed, temperature, instruction, provider }))
  return h.digest('hex').slice(0, 16)
}

function buildConcatFilter(count, gap) {
  const chains = []
  for (let i = 0; i < count; i++) {
    let chain = `[${i}:a]aresample=24000,aformat=channel_layouts=mono,asetpts=PTS-STARTPTS`
    if (gap > 0 && i < count - 1) chain += `,apad=pad_dur=${gap}`
    chain += `[s${i}]`
    chains.push(chain)
  }
  const labels = Array.from({ length: count }, (_, i) => `[s${i}]`).join('')
  chains.push(`${labels}concat=n=${count}:v=0:a=1[voice]`)
  return chains.join('; ')
}

function buildTimedMixFilter(segments) {
  const inputArgs = segments.flatMap(s => ['-i', s.file])
  const delayFilters = segments
    .map((s, i) => `[${i}:a]adelay=${Math.round(s.start * 1000)}|${Math.round(s.start * 1000)}[d${i}]`)
    .join('; ')
  const mixInputs = segments.map((_, i) => `[d${i}]`).join('')
  const filterComplex = `${delayFilters}; ${mixInputs}amix=inputs=${segments.length}:duration=longest:normalize=0[voice]`
  return { inputArgs, filterComplex, finalLabel: '[voice]' }
}

function mixWithMusic({ segments, music, outFile, buildBaseFilter }) {
  const { inputArgs, filterComplex: baseFilter, finalLabel: baseLabel } = buildBaseFilter(segments)
  let filterComplex = baseFilter
  let finalLabel = baseLabel

  if (music && music.src && existsSync(music.src)) {
    inputArgs.push('-i', music.src)
    const musicInputIndex = segments.length
    const vol = music.volume ?? 0.15
    const start = music.start ?? 0
    const fadeIn = music.fadeIn ?? 0
    const fadeOut = music.fadeOut ?? 0
    const dur = music.duration ?? 30

    let musicChain = `[${musicInputIndex}:a]volume=${vol}`
    if (start > 0) musicChain += `,adelay=${Math.round(start * 1000)}|${Math.round(start * 1000)}`
    if (fadeIn > 0) musicChain += `,afade=t=in:st=${start}:d=${fadeIn}`
    if (fadeOut > 0) musicChain += `,afade=t=out:st=${dur - fadeOut}:d=${fadeOut}`
    musicChain += `,atrim=duration=${dur}[music]`

    filterComplex += `; ${musicChain}; [voice][music]amix=inputs=2:duration=longest:normalize=0[out]`
    finalLabel = '[out]'
    log(`  music: ${music.src} · volume=${vol} · fadeIn=${fadeIn}s · fadeOut=${fadeOut}s`)
  }

  const ff = spawnSync('ffmpeg', [
    '-y',
    ...inputArgs,
    '-filter_complex', filterComplex,
    '-map', finalLabel,
    '-codec:a', 'libmp3lame',
    '-b:a', '192k',
    outFile,
  ], { stdio: ['ignore', 'pipe', 'inherit'] })

  if (ff.status !== 0) {
    err('ffmpeg scene mix failed')
    process.exit(1)
  }
}

export async function generateScenes({ scenes, provider, voice, model, instruction, seed, temperature, outFile, music, gap = 0.25, voiceOffset = 0, onlyScene = null }) {
  if (!Array.isArray(scenes) || scenes.length === 0) {
    err('scenes array is empty')
    process.exit(1)
  }

  const timed = scenes.some(s => typeof s.start === 'number')
  const regenLabel = onlyScene != null ? ` · regen scene ${onlyScene}` : ''
  log(`Multi-scene mode · ${scenes.length} segments · seed=${seed ?? 'unset'} · ${timed ? 'timed' : `concat (gap ${gap}s)`}${regenLabel}`)

  const cacheDir = join(process.cwd(), '.framevox', 'cache')
  mkdirSync(cacheDir, { recursive: true })

  const segments = []
  let apiCalls = 0
  let cursor = voiceOffset
  let prevEnd = voiceOffset

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i]
    if (!scene.text) {
      err(`Scene "${scene.id || '?'}" missing text`)
      process.exit(1)
    }
    const hash = sceneHash({ text: scene.text, voice, model, seed, temperature, instruction, provider })
    const cacheFile = join(cacheDir, `${scene.id || 'seg'}-${hash}.mp3`)
    const sceneKey = scene.id || String(i + 1)
    const isTarget = onlyScene == null
      || String(onlyScene) === String(i + 1)
      || String(onlyScene) === sceneKey

    if (onlyScene != null && !isTarget) {
      if (!existsSync(cacheFile)) {
        err(`Scene "${sceneKey}" not cached — run "framevox voice" without --scene first`)
        process.exit(1)
      }
      log(`  ○ "${sceneKey}" · skipped (using cache)`)
    } else if (existsSync(cacheFile) && !(onlyScene != null && isTarget)) {
      log(`  ✓ "${sceneKey}" · cached (${hash})`)
    } else {
      if (onlyScene != null && isTarget) log(`  ↻ "${sceneKey}" · regenerating`)
      else log(`  → "${sceneKey}" (${scene.text.length} chars · cache: .framevox/cache/${sceneKey}-*.mp3)`)
      if (apiCalls > 0) spawnSync('sleep', ['2'])
      await generateVoice({
        provider, voice, model,
        text: scene.text,
        instruction,
        seed, temperature,
        outFile: cacheFile,
      })
      apiCalls++
    }

    const dur = probeSegmentDuration(cacheFile)
    let start = (typeof scene.start === 'number') ? scene.start : cursor

    if (timed && start < prevEnd - 0.02) {
      const bumped = prevEnd + gap
      log(`  ⚠ overlap · "${scene.id}" @ ${start.toFixed(2)}s → ${bumped.toFixed(2)}s (prev ends ${prevEnd.toFixed(2)}s)`)
      start = bumped
    }

    log(`     placed @ ${start.toFixed(2)}s · ${dur.toFixed(2)}s long · ends ${(start + dur).toFixed(2)}s`)
    segments.push({ file: cacheFile, start, duration: dur, id: scene.id })

    prevEnd = start + dur
    if (typeof scene.start === 'number') {
      cursor = prevEnd
    } else {
      cursor = prevEnd + (i < scenes.length - 1 ? gap : 0)
    }
  }

  // Concat mode: recompute timeline from measured durations (starts are not used in the mix).
  if (!timed) {
    let t = voiceOffset
    for (let i = 0; i < segments.length; i++) {
      segments[i].start = t
      t += segments[i].duration + (i < segments.length - 1 ? gap : 0)
    }
  }

  if (timed) {
    mixWithMusic({
      segments,
      music,
      outFile,
      buildBaseFilter: buildTimedMixFilter,
    })
  } else {
    mixWithMusic({
      segments,
      music,
      outFile,
      buildBaseFilter: (segs) => ({
        inputArgs: segs.flatMap(s => ['-i', s.file]),
        filterComplex: buildConcatFilter(segs.length, gap),
        finalLabel: '[voice]',
      }),
    })
  }

  const timeline = segments.map(s => ({
    id: s.id,
    start: round(s.start),
    duration: round(s.duration),
    end: round(s.start + s.duration),
  }))
  writeFileSync(join(process.cwd(), '.framevox', 'voice-timeline.json'), JSON.stringify({ gap, mode: timed ? 'timed' : 'concat', segments: timeline }, null, 2))
  log(`Timeline → .framevox/voice-timeline.json (${timeline.map(t => `${t.id} ${t.start}-${t.end}s`).join(', ')})`)

  if (timed) {
    for (let i = 1; i < timeline.length; i++) {
      const prev = timeline[i - 1]
      const cur = timeline[i]
      if (cur.start < prev.end - 0.02) {
        log(`  ⚠ collision · "${cur.id}" starts @${cur.start}s before "${prev.id}" ends @${prev.end}s`)
      }
    }
  }

  log(`Mixed → ${outFile}`)
}

function round(n) {
  return Math.round(n * 100) / 100
}
