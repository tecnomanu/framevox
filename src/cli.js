import { Command } from 'commander'
import { cmdInit }   from './commands/init.js'
import { cmdVoice }  from './commands/voice.js'
import { cmdRender } from './commands/render.js'
import { cmdRecipe } from './commands/recipe.js'
import { cmdAddKey } from './commands/add-key.js'
import { cmdKeys }   from './commands/keys.js'
import { spawnHF }   from './utils.js'

export function cli() {
  const program = new Command()

  program
    .name('framevox')
    .description('Video production CLI — HyperFrames + Gemini, Piper, ElevenLabs TTS')
    .version('0.1.0')

  program
    .command('init [name]')
    .description('Scaffold a new video project from a template')
    .option('-t, --template <template>', 'Template: mobile-promo | desktop-promo | mobile-minimal | desktop-minimal', 'mobile-promo')
    .action(cmdInit)

  program
    .command('voice')
    .description('Generate voiceover from script.txt (or --text)')
    .option('-p, --provider <provider>', 'TTS provider: gemini | piper | elevenlabs')
    .option('--text <text>',             'Inline script text (overrides script.txt)')
    .option('--voice <voice>',           'Voice name/ID for the selected provider')
    .option('--model <model>',           'Model override for the selected provider')
    .option('--lang <lang>',             'Language hint', 'es')
    .option('-o, --out <file>',          'Output MP3 file', 'voice.mp3')
    .action(cmdVoice)

  program
    .command('render')
    .description('Render composition via HyperFrames')
    .option('-o, --out <file>',          'Output MP4 file', 'output.mp4')
    .option('--quality <quality>',       'draft | normal | high', 'normal')
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

  program.parse()
}
