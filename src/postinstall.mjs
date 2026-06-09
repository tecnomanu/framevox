#!/usr/bin/env node
/**
 * npm postinstall — ensure HyperFrames + first-run / upgrade hints.
 * Lives in src/ so it ships in the published npm package (files: src).
 * Skipped in CI and when FRAMEVOX_SKIP_POSTINSTALL=1.
 */
import { spawnSync } from 'child_process'
import { existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function shouldRun() {
  if (process.env.CI) return false
  if (process.env.FRAMEVOX_SKIP_POSTINSTALL === '1') return false
  return true
}

function ensureHyperframes() {
  const bin = join(root, 'node_modules', '.bin', 'hyperframes')
  if (existsSync(bin)) {
    const probe = spawnSync(bin, ['--help'], { encoding: 'utf8', stdio: 'pipe' })
    if (probe.status === 0 && probe.stdout?.includes('hyperframes')) return
  }

  console.log('[framevox] Installing hyperframes…')
  const r = spawnSync('npm', ['install', 'hyperframes@latest', '--no-save'], {
    cwd: root,
    stdio: 'inherit',
  })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

async function runHints() {
  try {
    const { readSetupState, detectAgents, syncFramevoxSkill, markSetupComplete, pkgVersion } =
      await import('./agent-skills.js')

    const state = readSetupState()
    const agents = detectAgents()
    const agentList = agents.map((a) => a.label).join(', ') || 'none'
    const version = pkgVersion()

    if (!state?.completed) {
      console.log('')
      console.log('[framevox] First install detected.')
      console.log(`[framevox] Agents on this machine: ${agentList}`)
      console.log('[framevox] Run: framevox setup')
      console.log('[framevox]   → installs skills for detected agent apps')
      console.log('')
      return
    }

    if (state.version !== version) {
      const sync = syncFramevoxSkill(agents)
      if (sync.synced.length) {
        markSetupComplete({ agents: sync.synced })
        console.log('')
        console.log(`[framevox] Updated to v${version} — framevox skill synced`)
        console.log(`[framevox] → ${sync.synced.map((s) => s.label).join(', ')}`)
        console.log('[framevox] Full refresh: framevox setup')
        console.log('')
      } else {
        console.log('')
        console.log(`[framevox] Updated to v${version}`)
        console.log('[framevox] Run: framevox setup --skip-hf-skills')
        console.log('')
      }
      return
    }

    console.log('')
    console.log(`[framevox] v${version} ready · agents: ${agentList}`)
    console.log('[framevox] Check updates: framevox update --check')
    console.log('')
  } catch (e) {
    console.log('[framevox] postinstall hint skipped:', e.message)
  }
}

ensureHyperframes()
if (shouldRun()) await runHints()
