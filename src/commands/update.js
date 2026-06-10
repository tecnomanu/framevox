import { tmpdir } from 'os'
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
    warn('Running from source checkout — installing global npm package (not this folder)')
  }

  log(`Updating ${PACKAGE} · ${current} → ${latest}`)
  // Neutral cwd: npm install -g framevox inside the repo can shadow the registry package.
  run('npm', ['install', '-g', `${PACKAGE}@${latest}`], { cwd: tmpdir() })

  const installed = runCapture('npm', ['list', '-g', PACKAGE, '--depth=0', '--json'])
  let newVersion = latest
  if (installed.status === 0) {
    try {
      const tree = JSON.parse(installed.stdout)
      newVersion = tree.dependencies?.[PACKAGE]?.version || latest
    } catch { /* use latest from registry */ }
  }

  log(`npm package · ${bold(newVersion)}`)
  if (compareVersions(newVersion, latest) < 0) {
    warn(`Global install is still ${bold(newVersion)} (expected ${bold(latest)})`)
    console.log(dim('Try: cd /tmp && npm install -g framevox@latest'))
  }

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
