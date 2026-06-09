import { compareVersions, fetchLatestVersion } from './version.js'
import { detectAgents, pkgVersion, readSetupState } from './agent-skills.js'
import { dim, bold, warn, log } from './utils.js'

export function getInstallStatus({ checkRegistry = false } = {}) {
  const version = pkgVersion()
  const state = readSetupState()
  const agents = detectAgents()
  const needsSetup = !state?.completed

  let updateAvailable = null
  let latest = null
  if (checkRegistry) {
    try {
      latest = fetchLatestVersion()
      updateAvailable = compareVersions(version, latest) < 0 ? latest : null
    } catch {
      /* offline or unpublished */
    }
  } else if (state?.version && state.version !== version) {
    // Local package bumped but skills may be stale
    updateAvailable = null
  }

  const skillsStale = Boolean(
    state?.completed && state.version && state.version !== version,
  )

  return {
    version,
    latest,
    state,
    agents,
    needsSetup,
    skillsStale,
    updateAvailable,
  }
}

export function printInstallHints({ context = 'cli' } = {}) {
  const status = getInstallStatus({ checkRegistry: context !== 'postinstall' })
  const agentNames = status.agents.map((a) => a.label).join(', ') || 'none detected'

  if (status.needsSetup) {
    warn('First-time setup required')
    console.log(dim(`  Detected agents: ${agentNames}`))
    console.log(dim('  Run: framevox setup'))
    console.log(dim('  Installs framevox + hyperframes skills into each detected app'))
    return
  }

  if (status.skillsStale) {
    warn(`Skills may be outdated · synced v${status.state.version} · package v${status.version}`)
    console.log(dim('  Run: framevox setup --skip-hf-skills'))
    console.log(dim('  Or:  framevox update  (npm + skill sync)'))
  }

  if (status.updateAvailable) {
    log(`Update available · ${bold(status.version)} → ${bold(status.updateAvailable)}`)
    console.log(dim('  Run: framevox update'))
  }
}

export function printStatus() {
  const status = getInstallStatus({ checkRegistry: true })
  const agentNames = status.agents.map((a) => a.label).join(', ') || dim('none')

  console.log('')
  log(`Framevox ${bold(`v${status.version}`)}`)
  console.log(dim(`Agents detected: ${agentNames}`))

  if (status.needsSetup) {
    console.log(dim('Setup: not completed'))
    printInstallHints()
  } else {
    const synced = status.state.agents?.join(', ') || '—'
    console.log(dim(`Setup: complete · skills v${status.state.version || '?'} · ${synced}`))
    if (status.skillsStale) printInstallHints()
    else if (status.updateAvailable) printInstallHints()
    else console.log(dim('Status: up to date'))
  }

  console.log('')
  console.log(dim('Commands: init · voice · render · setup · update'))
  console.log('')
}
