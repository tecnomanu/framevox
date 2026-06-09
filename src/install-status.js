import { compareVersions, fetchLatestVersion } from './version.js'
import { detectAgents, pkgVersion, readSetupState } from './agent-skills.js'
import { printLogoBanner } from './banner.js'
import { confirm, isInteractiveTTY } from './prompt.js'
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

export function printInstallHints({ context = 'cli', interactive = false } = {}) {
  const status = getInstallStatus({ checkRegistry: context !== 'postinstall' })
  const agentNames = status.agents.map((a) => a.label).join(', ') || 'none detected'

  if (status.needsSetup) {
    warn('First-time setup required')
    console.log(dim(`  Detected agents: ${agentNames}`))
    console.log(dim('  Run: framevox setup'))
    console.log(dim('  Installs framevox + hyperframes skills into each detected app'))
    return false
  }

  if (status.skillsStale) {
    warn(`Skills may be outdated · synced v${status.state.version} · package v${status.version}`)
    console.log(dim('  Run: framevox setup --skip-hf-skills'))
    console.log(dim('  Or:  framevox update  (npm + skill sync)'))
  }

  if (status.updateAvailable) {
    log(`Update available · ${bold(status.version)} → ${bold(status.updateAvailable)}`)
    if (!interactive || !isInteractiveTTY()) {
      console.log(dim('  Run: framevox update'))
    }
    return true
  }

  return false
}

export async function printStatus({ interactive = true } = {}) {
  const status = getInstallStatus({ checkRegistry: true })
  const agentNames = status.agents.map((a) => a.label).join(', ') || dim('none')

  printLogoBanner(status.version)
  console.log(dim(`Agents detected: ${agentNames}`))

  if (status.needsSetup) {
    console.log(dim('Setup: not completed'))
    printInstallHints({ interactive })
  } else {
    const synced = status.state.agents?.join(', ') || '—'
    console.log(dim(`Setup: complete · skills v${status.state.version || '?'} · ${synced}`))
    if (status.skillsStale) {
      printInstallHints({ interactive })
    } else if (status.updateAvailable) {
      const hasUpdate = printInstallHints({ interactive })
      if (hasUpdate && interactive && isInteractiveTTY()) {
        console.log('')
        const yes = await confirm(
          `Update available (${status.version} → ${status.updateAvailable}). Update now? [y/N] `,
        )
        if (yes) return 'update'
      }
    } else {
      console.log(dim('Status: up to date'))
    }
  }

  console.log('')
  console.log(dim('Commands: init · voice · render · setup · update'))
  console.log('')
  return null
}
