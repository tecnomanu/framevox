import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const bin = join(root, 'node_modules', '.bin', 'hyperframes')

if (!existsSync(bin)) {
  console.log('[framevox] Installing hyperframes…')
  const r = spawnSync('npm', ['install', 'hyperframes@latest', '--no-save'], {
    cwd: root,
    stdio: 'inherit',
  })
  process.exit(r.status ?? 1)
}

const probe = spawnSync(bin, ['--help'], { encoding: 'utf8', stdio: 'pipe' })
if (probe.status !== 0 || !probe.stdout?.includes('hyperframes')) {
  console.error('[framevox] hyperframes probe failed')
  process.exit(1)
}
