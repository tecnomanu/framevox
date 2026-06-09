import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { Command } from 'commander'
import { cmdInit }   from './commands/init.js'
import { cmdVoice }  from './commands/voice.js'
import { cmdRender } from './commands/render.js'
import { cmdRecipe } from './commands/recipe.js'
import { cmdAddKey } from './commands/add-key.js'
import { cmdKeys }   from './commands/keys.js'
import { cmdTemplatesList } from './commands/templates.js'
import { cmdTemplateAdd, cmdTemplateInstall } from './commands/template-manage.js'
import { cmdUpdate } from './commands/update.js'
import { cmdSetup } from './commands/setup.js'
import { spawnHF }   from './utils.js'
import { printVersionBanner, printInfoBanner } from './banner.js'

const VERSION = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json'), 'utf8')
).version

function handleGlobalFlags(argv) {
  if (argv.includes('--info')) {
    printInfoBanner(VERSION)
    process.exit(0)
  }
  if (argv.includes('--version') || argv.includes('-V') || argv.includes('-v')) {
    printVersionBanner(VERSION)
    process.exit(0)
  }
}

export function cli() {
  const argv = process.argv.slice(2)
  handleGlobalFlags(argv)

  const program = new Command()

  program
    .name('framevox')
    .description('Video production CLI — HyperFrames + Gemini, Piper, ElevenLabs TTS')
    .version(VERSION)
    .addHelpText('after', `
  Global flags:
    -v, --version    Show version with logo
    --info           Show version, runtime, and package info
    `)

  program
    .command('init [name]')
    .description('Scaffold a new video project from a template')
    .option('-t, --template <template>', 'Template name (e.g. minimal-mobile, promo-desktop)', 'minimal-mobile')
    .action(cmdInit)

  program
    .command('voice')
    .description('Generate voiceover from voice.json (or --text)')
    .option('-p, --provider <provider>', 'TTS provider: gemini | piper | elevenlabs')
    .option('--text <text>',             'Inline spoken text (overrides voice.json text)')
    .option('--voice <voice>',           'Voice name/ID for the selected provider')
    .option('--model <model>',           'Model override for the selected provider')
    .option('--lang <lang>',             'Language hint', 'es')
    .option('-o, --out <file>',          'Output MP3 file', 'voice.mp3')
    .option('--scene <id>',             'Regenerate one scene only (id or 1-based index) — requires multi-scene config')
    .action(cmdVoice)

  program
    .command('render')
    .description('Lint + render composition via HyperFrames')
    .option('-o, --out <file>',          'Output MP4 file', 'output.mp4')
    .option('--quality <quality>',       'draft | normal | high', 'normal')
    .option('--no-lint',                 'Skip HyperFrames lint before render')
    .action(cmdRender)

  program
    .command('lint')
    .description('Lint the HyperFrames composition')
    .action(() => spawnHF(['lint']))

  program
    .command('preview')
    .description('Open HyperFrames studio preview')
    .action(() => spawnHF(['preview']))

  program
    .command('recipe [title]')
    .description('Generate RECIPE.md with full production metadata')
    .action(cmdRecipe)

  program
    .command('add-key <name> <value>')
    .description('Store a provider key/setting globally (~/.framevox/.env)')
    .addHelpText('after', `
  Key names:
    gemini               GEMINI_API_KEY
    gemini-voice         GEMINI_VOICE         (default: Aoede)
    gemini-model         GEMINI_TTS_MODEL
    elevenlabs           ELEVENLABS_API_KEY
    elevenlabs-voice     ELEVENLABS_VOICE_ID
    elevenlabs-model     ELEVENLABS_MODEL
    piper-voice          PIPER_VOICE          (e.g. es_ES-mls-medium)
    piper-voices-dir     PIPER_VOICES_DIR
    piper-speed          PIPER_SPEED          (default: 1.0)
    `)
    .action(cmdAddKey)

  program
    .command('keys')
    .description('Show configured TTS providers and key status')
    .action(cmdKeys)

  const templates = program
    .command('templates')
    .description('List and manage video templates')

  templates
    .command('list', { isDefault: true })
    .description('List templates (project > user > builtin)')
    .option('--json', 'JSON output for agents')
    .action(cmdTemplatesList)

  templates
    .command('add <name>')
    .description('Copy template into .framevox/templates/ (project-owned)')
    .option('--from <source>', 'Source template name if different from <name>')
    .action(cmdTemplateAdd)

  templates
    .command('install <name>')
    .description('Install template into ~/.framevox/templates/ (global, survives updates)')
    .option('--from <source>', 'Source template name if different from <name>')
    .action(cmdTemplateInstall)

  program
    .command('update')
    .description('Update global framevox install from npm')
    .option('--check', 'Only check if a newer version is available')
    .option('--force', 'Reinstall latest even if already up to date')
    .action(cmdUpdate)

  program
    .command('setup')
    .description('Install agent skills (framevox + hyperframes) for Claude/Cursor')
    .option('--skip-hf-skills', 'Only sync framevox skill; skip hyperframes skills install')
    .action(cmdSetup)

  program.parse()
}
