import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { runCapture } from './utils.js'
import { resolveHyperframesBin } from './hyperframes.js'

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

const GRADIENT = [
  [0, 212, 255],   // cyan — V
  [139, 92, 246],  // purple — o
  [236, 72, 153],  // pink — x
]

const VOX_ART = [
  '██╗   ██╗ ██████╗ ██╗  ██╗',
  '██║   ██║██╔═══██╗╚██╗██╔╝',
  '██║   ██║██║   ██║ ╚███╔╝ ',
  '╚██╗ ██╔╝██║   ██║ ██╔██╗ ',
  ' ╚████╔╝ ╚██████╔╝██╔╝ ██╗',
  '  ╚═══╝   ╚═════╝ ╚═╝  ╚═╝',
]

const TAGLINE = 'Video production CLI — HyperFrames + TTS'

function supportsColor() {
  if (process.env.FORCE_COLOR !== undefined && process.env.FORCE_COLOR !== '0') return true
  if (process.env.NO_COLOR !== undefined) return false
  return Boolean(process.stdout.isTTY)
}

function rgb([r, g, b]) {
  return `\x1b[38;2;${r};${g};${b}m`
}

function reset() {
  return '\x1b[0m'
}

function dim(str) {
  return supportsColor() ? `\x1b[2m${str}\x1b[0m` : str
}

function bold(str) {
  return supportsColor() ? `\x1b[1m${str}\x1b[0m` : str
}

function white(str) {
  return supportsColor() ? `\x1b[1m\x1b[38;2;255;255;255m${str}\x1b[0m` : str
}

function lerp(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t))
}

function gradientColor(t) {
  if (t <= 0.5) return lerp(GRADIENT[0], GRADIENT[1], t * 2)
  return lerp(GRADIENT[1], GRADIENT[2], (t - 0.5) * 2)
}

function colorizeLine(line) {
  const chars = [...line]
  const last = Math.max(chars.length - 1, 1)
  return chars
    .map((ch, i) => {
      if (ch === ' ') return ch
      return rgb(gradientColor(i / last)) + ch
    })
    .join('') + reset()
}

function plainWordmark() {
  return 'FrameVox'
}

function colorWordmark() {
  const frame = white('Frame')
  const V = rgb(GRADIENT[0]) + 'V' + reset()
  const o = rgb(GRADIENT[1]) + 'o' + reset()
  const x = rgb(GRADIENT[2]) + 'x' + reset()
  return `${frame}${V}${o}${x}`
}

function renderLogo() {
  if (!supportsColor()) {
    return [plainWordmark(), '']
  }

  const artWidth = Math.max(...VOX_ART.map((l) => l.length))
  const frameLabel = white('Frame')
  const pad = Math.max(0, artWidth - 5)
  const lines = [
    frameLabel + ' '.repeat(pad),
    ...VOX_ART.map(colorizeLine),
  ]
  return lines
}

function hyperframesVersion() {
  const bin = resolveHyperframesBin()
  if (!bin) return null
  const r = runCapture(bin, ['--version'])
  return r.stdout?.trim() || r.stderr?.trim() || null
}

function pkgMeta() {
  return JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf8'))
}

/** Full ASCII logo + wordmark — status, --version */
export function printLogoBanner(version) {
  const lines = renderLogo()
  console.log('')
  for (const line of lines) console.log(line)
  console.log('')
  console.log(supportsColor() ? colorWordmark() + dim(`  v${version}`) : `FrameVox v${version}`)
  console.log(dim(TAGLINE))
  console.log('')
}

/** Compact wordmark — setup, update, init, voice, render */
export function printCommandHeader(version) {
  console.log('')
  if (supportsColor()) {
    console.log(colorWordmark() + dim(`  v${version}`))
    console.log(dim(TAGLINE))
  } else {
    console.log(`FrameVox v${version}`)
    console.log(TAGLINE)
  }
  console.log('')
}

export function printVersionBanner(version) {
  printLogoBanner(version)
}

export function printInfoBanner(version) {
  const meta = pkgMeta()
  printLogoBanner(version)
  const hf = hyperframesVersion()

  const rows = [
    ['Node', process.version],
    ['Platform', `${process.platform} ${process.arch}`],
    ['HyperFrames', hf || dim('not installed')],
    ['Package', meta.name],
    ['License', meta.license],
  ]

  if (meta.repository?.url) {
    rows.push(['Repository', meta.repository.url.replace(/^git\+/, '').replace(/\.git$/, '')])
  }

  const labelWidth = Math.max(...rows.map(([k]) => k.length))

  for (const [label, value] of rows) {
    const plain = String(value).replace(/\x1b\[[0-9;]*m/g, '')
    console.log(`${dim(label.padEnd(labelWidth))}  ${plain}`)
  }

  console.log('')
  console.log(dim('Providers: gemini · piper · elevenlabs'))
  console.log(dim('Docs: framevox --help'))
  console.log('')
}
