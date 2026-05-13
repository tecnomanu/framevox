import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, resolve, basename } from 'path'
import { readProjectConfig } from '../config.js'
import { md5File, log } from '../utils.js'

export function cmdRecipe(title, opts) {
  const cwd    = process.cwd()
  const config = readProjectConfig()
  const name   = title || basename(cwd)

  const voiceMd5 = existsSync(join(cwd, 'voice.mp3'))
    ? md5File(join(cwd, 'voice.mp3'))
    : '(none)'

  const outputMp4 = config.lastRender?.file || join(cwd, 'output.mp4')
  const hasOutput = existsSync(outputMp4)

  // Try to read composition id from index.html
  let compositionId = '(unknown)'
  const indexPath = join(cwd, 'index.html')
  if (existsSync(indexPath)) {
    const html = readFileSync(indexPath, 'utf8')
    const match = html.match(/data-composition-id="([^"]+)"/)
    if (match) compositionId = match[1]
  }

  const now = new Date()
  const date = now.toISOString().slice(0, 10)

  const lines = [
    `# ${name} · Recipe`,
    '',
    `## Produced`,
    '',
    `- **Date:** ${date}`,
    `- **Composition:** \`${compositionId}\``,
    `- **Provider:** ${config.provider || 'gemini'}`,
    `- **Voice MD5:** \`${voiceMd5}\``,
    `- **Render quality:** ${config.lastRender?.quality || '—'}`,
    `- **Output:** ${hasOutput ? resolve(outputMp4) : '(not yet rendered)'}`,
    '',
    '## Voice script',
    '',
    '```',
    existsSync(join(cwd, 'script.txt'))
      ? readFileSync(join(cwd, 'script.txt'), 'utf8').trim()
      : '(no script.txt)',
    '```',
    '',
    '## Commands to reproduce',
    '',
    '```bash',
    `framevox voice --provider ${config.provider || 'gemini'}`,
    `framevox render --quality ${config.lastRender?.quality || 'normal'} --out output.mp4`,
    '```',
    '',
    '## Notes',
    '',
    '<!-- Add production notes here -->',
    '',
  ]

  const recipePath = join(cwd, 'RECIPE.md')
  writeFileSync(recipePath, lines.join('\n'), 'utf8')
  log(`RECIPE.md written → ${recipePath}`)
}
