import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'
import { ensureGlobalDir } from './config.js'

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SKILL_SRC = join(PKG_ROOT, 'skill')
const SETUP_STATE_FILE = join(homedir(), '.framevox', 'setup.json')

const HF_SKILLS = [
  { pkg: 'heygen-com/hyperframes@hyperframes', name: 'hyperframes' },
  { pkg: 'heygen-com/hyperframes@hyperframes-cli', name: 'hyperframes-cli' },
]

/** Known agent apps and where their global skills live. */
export const AGENT_TARGETS = [
  {
    id: 'claude',
    label: 'Claude Code',
    skillsDir: join(homedir(), '.claude', 'skills'),
    detect: () => existsSync(join(homedir(), '.claude')) || which('claude'),
    skillsAgent: 'claude',
  },
  {
    id: 'cursor',
    label: 'Cursor',
    skillsDir: join(homedir(), '.cursor', 'skills'),
    detect: () => existsSync(join(homedir(), '.cursor')),
    skillsAgent: 'cursor',
  },
  {
    id: 'codex',
    label: 'Codex',
    skillsDir: join(homedir(), '.codex', 'skills'),
    detect: () => existsSync(join(homedir(), '.codex')) || which('codex'),
    skillsAgent: 'codex',
  },
  {
    id: 'antigravity',
    label: 'Antigravity',
    skillsDir: join(homedir(), '.agents', 'skills'),
    detect: () => existsSync(join(homedir(), '.agents')),
    skillsAgent: 'antigravity',
  },
  {
    id: 'opencode',
    label: 'OpenCode',
    skillsDir: join(homedir(), '.config', 'opencode', 'skills'),
    detect: () => existsSync(join(homedir(), '.config', 'opencode')) || which('opencode'),
    skillsAgent: 'opencode',
  },
]

function which(cmd) {
  const r = spawnSync('which', [cmd], { encoding: 'utf8', stdio: 'pipe' })
  return r.status === 0 ? r.stdout.trim() : null
}

export function pkgVersion() {
  return JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf8')).version
}

export function readSetupState() {
  if (!existsSync(SETUP_STATE_FILE)) return null
  try {
    return JSON.parse(readFileSync(SETUP_STATE_FILE, 'utf8'))
  } catch {
    return null
  }
}

export function writeSetupState(data) {
  ensureGlobalDir()
  writeFileSync(SETUP_STATE_FILE, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

export function markSetupComplete({ agents = [], hyperframesSkills = false } = {}) {
  const prev = readSetupState() || {}
  writeSetupState({
    ...prev,
    completed: true,
    version: pkgVersion(),
    skillsSyncedAt: new Date().toISOString(),
    agents: agents.map((a) => (typeof a === 'string' ? a : a.id)),
    hyperframesSkills: hyperframesSkills || prev.hyperframesSkills || false,
  })
}

/** Return agent targets detected on this machine. */
export function detectAgents() {
  return AGENT_TARGETS.filter((a) => a.detect())
}

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { stdio: 'inherit', ...opts })
}

/**
 * Copy framevox skill/ into each detected agent's skills directory.
 * Returns [{ id, label, dest }] for agents that received the skill.
 */
export function syncFramevoxSkill(agents = detectAgents()) {
  if (!existsSync(join(SKILL_SRC, 'SKILL.md'))) {
    return { synced: [], skipped: true, reason: 'skill/SKILL.md missing in package' }
  }

  if (!agents.length) {
    return { synced: [], skipped: true, reason: 'no agent apps detected' }
  }

  const synced = []
  for (const agent of agents) {
    const dest = join(agent.skillsDir, 'framevox')
    mkdirSync(agent.skillsDir, { recursive: true })
    cpSync(SKILL_SRC, dest, { recursive: true })
    synced.push({ id: agent.id, label: agent.label, dest })
  }

  return { synced, skipped: false }
}

/** Install HyperFrames companion skills via skills.sh — only to detected agents. */
export function installHyperframesSkills({ agents = detectAgents(), skipHfSkills = false } = {}) {
  if (skipHfSkills) return { installed: [], skipped: true }

  const agentIds = agents.map((a) => a.skillsAgent).filter(Boolean)
  const agentFlag = agentIds.length ? agentIds.join(',') : '*'

  const installed = []
  for (const { pkg, name } of HF_SKILLS) {
    const r = run('npx', [
      'skills', 'add', pkg,
      '-g', '-y', '--copy',
      '--agent', agentFlag,
    ], { stdio: 'inherit' })

    if (r.status !== 0) {
      installed.push({ name, ok: false })
      continue
    }
    installed.push({ name, ok: true })
  }

  return { installed, agents: agentIds }
}

/** Sync framevox skill after an npm update (skills only, no HF reinstall). */
export function postUpdateSkillSync() {
  const agents = detectAgents()
  const result = syncFramevoxSkill(agents)
  if (result.synced.length) {
    markSetupComplete({ agents: result.synced })
  }
  return result
}
