import { postUpdateSkillSync, detectAgents } from '../agent-skills.js'
import {
  compareVersions,
  currentPkgVersion,
  fetchLatestVersion,
  isDevCheckout,
} from '../version.js'
import { printCommandHeader } from '../banner.js'
import { run, runCapture, log, warn, err, bold, dim } from '../utils.js'

const PACKAGE = 'framevox'

export function cmdUpdate(opts) {
  const current = currentPkgVersion()
  const latest = fetchLatestVersion()
  const cmp = compareVersions(current, latest)

  if (!opts.check) {
    printCommandHeader(current)
  }

  if (opts.check) {
    if (cmp >= 0) {
      log(`Up to date · ${bold(current)}`)
    } else {
      log(`Update available · ${bold(current)} → ${bold(latest)}`)
      console.log(dim('Run: framevox update'))
    }
    return
  }

  if (cmp >= 0 && !opts.force) {
    log(`Already on latest · ${bold(current)}`)
    console.log(dim('Use --force to reinstall'))
    console.log(dim('Refresh skills only: framevox setup --skip-hf-skills'))
    return
  }

  if (isDevCheckout()) {
    warn('Running from source checkout — this installs the global npm package')
  }

  log(`Updating ${PACKAGE} · ${current} → ${latest}`)
  run('npm', ['install', '-g', `${PACKAGE}@latest`])

  const installed = runCapture('npm', ['list', '-g', PACKAGE, '--depth=0', '--json'])
  let newVersion = latest
  if (installed.status === 0) {
    try {
      const tree = JSON.parse(installed.stdout)
      newVersion = tree.dependencies?.[PACKAGE]?.version || latest
    } catch { /* use latest from registry */ }
  }

  log(`npm package · ${bold(newVersion)}`)

  const agents = detectAgents()
  if (agents.length) {
    log(`Syncing framevox skill → ${agents.map((a) => a.label).join(', ')}`)
    const sync = postUpdateSkillSync()
    if (sync.synced.length) {
      for (const { label, dest } of sync.synced) {
        log(`${label}: ${dest}`)
      }
    } else if (sync.skipped) {
      warn(sync.reason || 'Skill sync skipped')
    }
  } else {
    warn('No agent apps detected — skills not synced')
    console.log(dim('After installing Claude/Cursor/etc.: framevox setup --skip-hf-skills'))
  }

  console.log()
  log(`Done · ${bold(newVersion)}`)
  console.log(dim('Verify: framevox --version  (or: npx framevox@latest)'))
  console.log(dim('Full skill refresh: framevox setup'))
}
