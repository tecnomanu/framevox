import { cpSync, existsSync, mkdirSync } from 'fs'
import { homedir } from 'os'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'
import { ensureHyperFrames } from '../hyperframes.js'
import { log, warn, dim, bold } from '../utils.js'

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const SKILL_SRC = join(PKG_ROOT, 'skill')

const HF_SKILLS = [
  { pkg: 'heygen-com/hyperframes@hyperframes', name: 'hyperframes' },
  { pkg: 'heygen-com/hyperframes@hyperframes-cli', name: 'hyperframes-cli' },
]

const AGENT_SKILL_DIRS = [
  { agent: 'Claude', dir: join(homedir(), '.claude', 'skills') },
  { agent: 'Cursor', dir: join(homedir(), '.cursor', 'skills') },
  { agent: 'Codex', dir: join(homedir(), '.codex', 'skills') },
  { agent: 'Antigravity', dir: join(homedir(), '.agents', 'skills') },
]

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { stdio: 'inherit', ...opts })
}

function syncFramevoxSkill() {
  if (!existsSync(join(SKILL_SRC, 'SKILL.md'))) {
    warn('framevox skill/ not found in package — skip skill sync')
    return []
  }

  const installed = []
  for (const { agent, dir } of AGENT_SKILL_DIRS) {
    const dest = join(dir, 'framevox')
    mkdirSync(dir, { recursive: true })
    cpSync(SKILL_SRC, dest, { recursive: true })
    installed.push(`${agent}: ${dest}`)
  }
  return installed
}

function installHyperframesSkills({ skipHfSkills }) {
  if (skipHfSkills) return []

  const installed = []
  for (const { pkg, name } of HF_SKILLS) {
    log(`Installing skill ${bold(name)}…`)
    const r = run('npx', [
      'skills', 'add', pkg,
      '-g', '-y', '--copy',
      '--agent', '*',
    ])
    if (r.status !== 0) {
      warn(`skills add failed for ${name} — try manually: npx skills add ${pkg} -g`)
      continue
    }
    installed.push(name)
  }
  return installed
}

export function cmdSetup(opts) {
  log('Framevox setup — CLI deps + agent skills')
  console.log()

  ensureHyperFrames()
  log('HyperFrames CLI OK (npm dependency)')

  const framevoxPaths = syncFramevoxSkill()
  if (framevoxPaths.length) {
    log(`framevox skill → ${framevoxPaths.join(', ')}`)
  }

  const hfSkills = installHyperframesSkills({ skipHfSkills: opts.skipHfSkills })
  if (hfSkills.length) {
    log(`HyperFrames skills: ${hfSkills.join(', ')}`)
  }

  console.log()
  console.log(dim('Layer model:'))
  console.log(dim('  CLI  → framevox + hyperframes (npm, runs in terminal)'))
  console.log(dim('  Skill → agent instructions (SKILL.md, no executable)'))
  console.log(dim('  Edit index.html → hyperframes skill'))
  console.log(dim('  init / voice / render → framevox skill + CLI'))
  console.log()
  console.log(dim('Optional: npx skills add heygen-com/hyperframes@gsap -g'))
  console.log(dim('Verify: framevox keys && framevox templates --json'))
}
