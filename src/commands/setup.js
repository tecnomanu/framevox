import { ensureHyperFrames } from '../hyperframes.js'
import {
  detectAgents,
  installHyperframesSkills,
  markSetupComplete,
  pkgVersion,
  syncFramevoxSkill,
} from '../agent-skills.js'
import { printCommandHeader } from '../banner.js'
import { log, warn, dim, bold } from '../utils.js'

export function cmdSetup(opts) {
  printCommandHeader(pkgVersion())
  const agents = detectAgents()

  log('Setup — CLI deps + agent skills')

  if (!agents.length) {
    warn('No agent apps detected (Claude, Cursor, Codex, Antigravity, OpenCode)')
    console.log(dim('Install an agent IDE first, then re-run: framevox setup'))
    console.log(dim('Skills install to ~/.claude/skills, ~/.cursor/skills, etc.'))
    console.log()
  } else {
    log(`Detected: ${agents.map((a) => bold(a.label)).join(', ')}`)
  }

  ensureHyperFrames()
  log('HyperFrames CLI OK (npm dependency)')

  const framevox = syncFramevoxSkill(agents)
  if (framevox.skipped) {
    warn(framevox.reason || 'framevox skill sync skipped')
  } else if (framevox.synced.length) {
    for (const { label, dest } of framevox.synced) {
      log(`framevox skill → ${label}: ${dest}`)
    }
  }

  const hf = installHyperframesSkills({
    agents,
    skipHfSkills: opts.skipHfSkills,
  })

  if (!opts.skipHfSkills && hf.installed?.length) {
    const ok = hf.installed.filter((s) => s.ok).map((s) => s.name)
    const fail = hf.installed.filter((s) => !s.ok).map((s) => s.name)
    if (ok.length) log(`HyperFrames skills: ${ok.join(', ')}`)
    for (const name of fail) {
      warn(`skills add failed for ${name} — try: npx skills add heygen-com/hyperframes@${name} -g`)
    }
  }

  if (framevox.synced.length) {
    markSetupComplete({
      agents: framevox.synced,
      hyperframesSkills: !opts.skipHfSkills,
    })
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
