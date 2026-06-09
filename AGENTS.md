# AGENTS.md — Framevox

> Portable project contract for AI agents (Cursor, Claude, Codex, APX).
> Runtime state lives in `~/.apx/projects/ec17e2f475bb/` — never commit sessions or secrets.

## Overview

**Framevox** is a Node.js CLI (npm: `framevox`) that wraps **HyperFrames** (HTML → MP4) and **TTS** (Gemini, Piper, ElevenLabs) for promo / reel production.

| Layer | Path | Role |
|-------|------|------|
| CLI | `bin/framevox.js`, `src/commands/` | `init`, `voice`, `render`, `templates`, `setup` |
| Agent skill | `skill/SKILL.md` | Workflow for building promo videos |
| HyperFrames | dependency `hyperframes` | Lint, render, preview |
| Templates | `templates/{minimal,promo,studio,immersive}/` | Family → mobile/desktop variants |
| User projects | created via `framevox init` | `index.html`, `voice.json`, `voice.mp3`, `.framevox/` |

**Stack:** Node ≥ 22, pnpm, ffmpeg, headless Chrome (via HyperFrames).

```bash
pnpm install
node bin/framevox.js --help
pnpm previews          # regenerate template preview.mp4 (dev)
```

**Publish:** push to `main` → GitHub Actions runs `semantic-release` → npm + GitHub release. Requires `NPM_TOKEN` secret.

## Conventions

- **ESM** throughout (`"type": "module"`).
- **Commander** for CLI (`src/cli.js`).
- Providers live in `src/providers/<name>/` (not single files).
- Voice config: single `voice.json` — no `script.txt` / `voice-scenes.json` (v0.2.0+).
- Templates: **families** (`templates/promo/mobile`, `templates/promo/desktop`, shared `style.css`).
- Never edit builtin templates in `node_modules` — copy with `framevox templates add <family>`.
- Comments in code: English. User-facing CLI logs: English with `[framevox]` prefix.
- Keep diffs minimal; match existing style in touched files.

## Project layout (repo)

```
framevox/
├── AGENTS.md              ← this file
├── .apc/project.json      ← APC metadata (committed)
├── skill/SKILL.md         ← agent workflow (shipped in npm package)
├── src/
│   ├── voice-json.js      ← parse/validate voice.json
│   ├── voice-config.js    ← merge prompt + delivery rules
│   ├── scenes.js          ← multi-scene concat + API gap
│   ├── timing.js          ← audio duration sync, voice-timeline
│   ├── providers/gemini/  ← TTS + prompt frame (English "Read aloud…")
│   └── commands/          ← init, voice, render, templates, setup…
├── templates/             ← builtin families (mobile + desktop each)
├── scripts/               ← postinstall, preview generation
└── tmp/                   ← local demos (gitignored)
```

## Voice production rules

**Preferred:** single `voice.json` → `"text"` with `...` pauses (one Gemini call, ~≤50s).

**Multi-scene:** `"scenes": [{ "id", "text" }]` when you need `framevox voice --scene hook` regen. API gap 2s between calls (`src/scenes.js`).

**Gemini gotchas (confirmed):**
- Do **not** set `seed` or `temperature: 0` — causes `finishReason: OTHER`, no audio.
- Style goes in `prompt`; spoken copy in `text` / `scenes[].text`.
- Emotion tags: `[excited]…[/excited]`, `[sad]…[/sad]` — paired, never spoken.
- Keys in `~/.framevox/.env` — inline `#` comments stripped (`src/config.js`).

After `framevox voice`, read `.framevox/voice-timeline.json` for measured segment times.

## HyperFrames composition

Agents editing `index.html` must load the **hyperframes** skill (installed via `framevox setup`).

- `<audio src="voice.mp3" data-start="0.5" data-duration="…">` — duration = probe + 0.5s margin.
- Scene clips: `data-start`, `data-duration` on `.clip` elements.
- GSAP timeline keys must align with voice-timeline segments.
- `framevox render` runs lint then HyperFrames render.

## Commands (dev)

```bash
framevox init <dir> --template studio-mobile
framevox voice --provider gemini
framevox voice --scene hook          # regen one multi-scene segment
framevox render --out output.mp4 --quality draft
framevox templates --json
framevox setup                       # sync skills to Claude/Cursor
framevox add-key gemini <KEY>
```

## Testing / demos

- Scratch work: `./tmp/` (gitignored). Example: `tmp/framevox-ai-news/` (GPT-5.4 reel).
- Do not commit `*.mp3`, `*.mp4`, `.framevox/`, API keys, or `skills-lock.json`.
- Banner assets for README: `public/banner.{jpg,webp}`.

## Rules

**Always**
- Run `framevox setup` once per machine before agent-driven video work.
- Use `voice.json` as the single voice source of truth.
- Lint before render (default in `framevox render`).
- Store API keys via `framevox add-key`, never in repo files.
- Use conventional commits (`feat:`, `fix:`, `chore:`) — semantic-release depends on them.

**Never**
- Commit secrets (`.env`, `GEMINI_API_KEY`, `NPM_TOKEN`).
- Commit generated media (`voice.mp3`, `output.mp4`) or user project `.framevox/`.
- Add `seed: 42` to Gemini voice configs in templates or docs.
- Force-push `main`.
- Store APC runtime state (sessions, transcripts) under `.apc/`.

## APX

```bash
apx project add /Volumes/SSDT7Shield/proyectos_varios/framevox
apx agent add framevox-dev --role "Framevox CLI maintainer" --description "…"
```

Project id: `ec17e2f475bb` (see `.apc/project.json`). APX is optional — skill install uses `src/agent-skills.js` to detect Claude/Cursor/Codex/etc. and copy `skill/` into each app's global skills dir.

## Install / update flow

| Event | Behavior |
|-------|----------|
| `npm install -g framevox` (first) | postinstall → hint `framevox setup` |
| `npm install -g framevox` (upgrade) | postinstall → auto-sync framevox skill if setup completed |
| `framevox setup` | detect agents → sync skill + optional HF skills via `npx skills` |
| `framevox update` | `npm install -g` latest + skill sync |
| `framevox status` | detected agents, setup state, update hints |

State file: `~/.framevox/setup.json` (never commit).

## Related skills

| Skill | When |
|-------|------|
| `skill/SKILL.md` (framevox) | Promo workflow, templates, TTS |
| hyperframes | Composition HTML, GSAP, captions |
| hyperframes-cli | Direct lint/preview/render debugging |
