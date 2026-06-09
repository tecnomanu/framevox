---
name: framevox
description: >
  Produce promotional videos with HyperFrames compositions and AI voiceover (Gemini, Piper, ElevenLabs).
  Use this skill whenever the user wants to create a promo video, marketing reel, product demo, or any
  short video with narration — for any app, product, or niche. Covers: scaffolding from a template,
  editing compositions (index.html), generating voice (TTS), rendering (MP4), and documenting (RECIPE.md).
  Triggers on: "make a promo video", "create a reel", "video de producto", "video promocional",
  "reel de marketing", "quiero un video para X", "framevox", "product demo video".
  Also triggers when the user is working inside a framevox project (has index.html + .framevox/config.json).
---

# Framevox — Video Production Skill

Framevox is **skill + CLI**: this file guides agents; `npx framevox` runs commands.
It wraps HyperFrames (HTML→MP4) and three TTS providers.

**First-time agent setup (run once per machine):**
```bash
npx framevox setup
```
Installs framevox skill + HyperFrames companion skills (`hyperframes`, `hyperframes-cli`).
HyperFrames CLI is already bundled via npm; skills teach composition authoring.

| Task | Use |
|------|-----|
| `init`, `voice`, `render`, templates | **framevox** skill + CLI |
| Edit `index.html`, GSAP, scenes, `data-*` | **hyperframes** skill |
| Direct `lint` / `inspect` / `preview` | **hyperframes-cli** skill (optional if using framevox render) |

**Builtin templates:** `templates/{minimal,promo,studio}/{mobile,desktop}/` + shared `style.css` per family
**Skill:** `skill/SKILL.md` (this file)

---

## Templates philosophy

Three layers — **never edit builtin templates in node_modules**:

| Layer | Path | Purpose |
|-------|------|---------|
| **Project** | `.framevox/templates/<name>/` | User's forked layouts — **edit here** |
| **User global** | `~/.framevox/templates/<name>/` | Installed packs — survive framevox updates |
| **Builtin** | `templates/<name>/` in framevox package | Generic defaults + `preview.mp4` demos |

**Resolution order:** project → user global → builtin.

- **Style packs** — `dark-indigo`, `dark-minimal` in `templates/styles/`; copied as `style.css` on add/init
- **Brand-specific layouts** — live in the **project** `.framevox/templates/` (e.g. Appsi CRM templates in `nicho-apps`)

### First run in a project without `.framevox/` (agent workflow)

**Stop and onboard** — do not `init` blindly.

1. **Check** — no `.framevox/` in project root?
2. **List templates with previews:**
   ```bash
   npx framevox templates --json
   ```
3. **Show the user** each builtin template — open or link `preview.mp4`:
   - `templates/mobile-promo/preview.mp4` — 1080×1920 · 30s · 5 scenes
   - `templates/desktop-promo/preview.mp4` — 1920×1080 · 30s · 5 scenes
   - `templates/mobile-minimal/preview.mp4` — 1080×1920 · 20s · 3 scenes
   - `templates/desktop-minimal/preview.mp4` — 1920×1080 · 20s · 3 scenes

   Previews live in the framevox package (`node_modules/framevox/templates/...` or local clone).
   **Ask which template(s) fit the product** — mobile vs desktop, promo vs minimal.

4. **Copy chosen templates into the project** (creates `.framevox/templates/`):
   ```bash
   cd /path/to/user-project
   npx framevox templates add mobile-promo
   npx framevox templates add desktop-promo   # if user wants both
   ```

5. **Customize in project copies** — edit `.framevox/templates/<name>/index.html`, `style.css`, `voice.json`, `DESIGN.md`. Never touch builtin.

6. **Scaffold a video** when ready:
   ```bash
   npx framevox init promos/feb-reel --template mobile-promo
   ```
   `init` copies from `.framevox/templates/` first.

**Optional — install globally** (all projects, no npm update overwrite):
```bash
npx framevox templates install mobile-promo
```

**Project template structure:**
```
.framevox/templates/my-brand/
├── template.json
├── index.html
├── voice.json
├── DESIGN.md
└── style.css
```

---

## Workflow (start here)

Every video follows the same 7-step loop. Don't skip steps — each builds on the previous.

```
1. init      → scaffold project from template
2. DESIGN.md → fill brand vars (colors, font, product info)
3. index.html → edit copy and data (<!-- BRAND: --> and <!-- COPY: --> comments)
4. voice.json → prompt + text or scenes
5. voice     → generate voice.mp3
6. lint+render → check and render to MP4
7. recipe    → document the process
```

---

## Step 1 — Scaffold

If `.framevox/templates/` is empty, run **templates add** first (see onboarding above).

```bash
# Inside the client's project directory, or anywhere:
npx framevox init my-video --template mobile-promo

# Templates:
#   mobile-promo    1080×1920 · 30s · 5 scenes · product promo with mockup cards
#   desktop-promo   1920×1080 · 30s · 5 scenes · split-screen product promo
#   mobile-minimal  1080×1920 · 20s · 3 scenes · hook + feature + CTA
#   desktop-minimal 1920×1080 · 20s · 3 scenes · hook + feature + CTA
```

This creates:
```
my-video/
├── index.html       ← composition (edit this)
├── voice.json       ← voice script template (edit this)
├── DESIGN.md        ← brand vars to fill before touching index.html
├── assets/          ← put logo.png and any images here
└── .framevox/
    └── config.json  ← provider, format, last render
```

**Assets rule:** all paths in `index.html` must be relative to the project folder
(`assets/logo.png`, `voice.mp3`) or absolute. Never hardcode paths outside the project.

---

## Step 2 — Fill DESIGN.md

Read `DESIGN.md` first. It defines:
- Product name, domain, language
- Accent color (hex) — ONE color per composition
- Font family
- Hook copy, voice, and "what NOT to do"

Update `DESIGN.md` before touching `index.html`. Every color decision traces back to it.

**Brand color → update in index.html CSS vars:**
```css
:root {
  --accent:  #YOUR_HEX;   /* primary brand color */
  --accent2: #LIGHTER;    /* gradient end — ~30% lighter than accent */
}
```
Also update the `.glow` rgba to match your accent RGB.

---

## Step 3 — Edit index.html

The composition has two types of comments — replace them all:

- `<!-- BRAND: ... -->` — product name, domain, logo path, tagline, eyebrow label
- `<!-- COPY: ... -->` — hook question, headline, sub, card titles, feature names, data

**Card data rules (mobile-promo / desktop-promo):**
- Stats: use real-looking numbers (not 100, 200 — use 23, 47, $182k)
- Row names: use plausible client/item names for the product's domain
- Kanban items: reflect real stages of the product's workflow
- Feature list: list actual features the product has — never invented ones

**Duration:** the default is 30s (promo) or 20s (minimal). If voice needs more time,
adjust `data-duration` on the root div AND extend the last scene's `data-duration`.

**audio element:** `framevox voice` and `framevox render` auto-set `data-duration` to `voice.mp3 length + 0.5s` margin (HyperFrames trims at this value). Manual override only if needed:
```html
<audio src="voice.mp3" data-start="1.0" data-duration="25.4" data-volume="1"></audio>
```

---

## Step 4 — Write voice.json

Single source for accent, tone, and spoken copy.

**Single audio** (promos ≤ ~20s):

```json
{
  "prompt": "Leé en español rioplatense, tono cálido y conversacional:",
  "text": "¿Seguís persiguiendo facturas por email... [eloquent]¡Ledgerly lo resuelve en un click![/eloquent] ... [sad]Sin más Excel a las tres de la mañana.[/sad]"
}
```

**Multi-scene** (long copy, per-scene regen):

```json
{
  "prompt": "Leé en español rioplatense, tono ágil:",
  "seed": 42,
  "temperature": 0,
  "gap": 0.25,
  "scenes": [
    { "id": "hook", "text": "Primera línea..." },
    { "id": "cta", "text": "Cierre. miapp punto com." }
  ]
}
```

**`prompt`** — style guide only (accent, locale, pace). Framevox auto-merges built-in **delivery rules** for Gemini — never write the `Rules:` block yourself.

**`text`** or **`scenes[].text`** — spoken content. Use one mode per project, not both.

### Built-in delivery rules (Gemini, automatic)

Merged from `src/providers/gemini/rules.js` on every call:

- Default **neutral** tone outside tags
- Paired tags: `[eloquent]...[/eloquent]`, `[sad]...[/sad]`, `[whisper]...[/whisper]`, `[excited]...[/excited]`
- Tag labels never spoken aloud
- `...` = long pause (~1s+) between phrases

### Voice script content rules

- Open with 1–2 questions in voseo for es-AR promos
- Numbers as words: "treinta días", not "30 días"
- URLs as words: "myapp punto com"
- For promos ≤20s prefer **single audio** (fluid, same voice throughout)

### ElevenLabs

No style prefix API. `eleven_multilingual_v2` strips bracket tags (plain text only). Use `eleven_v3` model for native audio tags, or Gemini for `[tag]...[/tag]` acting cues.

---

## Step 5 — Generate voice

```bash
npx framevox voice                              # full script or all scenes
npx framevox voice --scene 2                    # regenerate scene 2 only (multi-scene)
npx framevox voice --scene hook                 # by scene id
npx framevox voice --provider gemini --voice Kore
npx framevox voice -o narration.mp3
```

Framevox validates MD5 after generation — same hash = API failed silently (`--scene` bypasses this).

After generating, `data-duration` syncs automatically (+0.5s margin).
Always check `.framevox/voice-timeline.json` — measured durations, pauses, collision warnings.

### Two ways to get multiple parts (NOT opposites)

Same goal — timed narration for video — two **cut strategies**:

| | **A — Multi-scene** | **B — Single + detect** |
|---|---|---|
| **When you cut** | Before TTS (you split text) | After TTS (silencedetect on `...`) |
| **API calls** | N (one per scene) | 1 |
| **Voice timbre** | Similar (`seed` helps, not perfect) | Identical (one generation) |
| **Regen one part** | `framevox voice --scene 2` | Re-run whole script (split not implemented yet) |
| **Config** | `voice.json` → `scenes[]` synced to `.framevox/config.json` | `voice.json` → `text` |
| **Timeline** | `mode: concat` or `timed` | `mode: single` + `pauses[]` |

**Use A** when script >17s, need per-line regen, or beats must land on fixed video times.
**Use B** when promo ≤20s, want fluid same voice, `...` marks breathing room — timeline shows where parts landed.

They solve different problems. A = author controls text boundaries. B = model controls pause boundaries.

### Post-TTS analysis (automatic)

**Single audio:** writes `voice-timeline.json` with `segments` (speech runs) and `pauses` (from `...`). Agent uses this to sync GSAP or decide if video is too long.

**Multi-scene:** writes per-scene `start/end/duration`. Timed mode logs `⚠ collision` if a scene starts before the previous ends (auto-bumped when possible).

### Script markers (Gemini)

Delivery rules in `src/providers/gemini/rules.js` — auto-merged, do not duplicate in script:

- `...` — long pause between phrases (also marks future split points in mode B)
- `[excited]...[/excited]`, `[sad]...[/sad]`, etc. — acting cues, neutral outside tags
- Tag labels never spoken

User paragraph 1 = accent/locale only: `Leé en español rioplatense, tono cálido:`

### Choose a production method

| Method | When | Setup |
|--------|------|-------|
| **Single audio** | ≤20s, fluid promo | `voice.json` with `"text"` |
| **Single + tags/ellipsis** | Mood shifts, pauses, one voice | Tags + `...` in `text` |
| **Multi-scene concat** | Long script, Gemini ~17s cap | `voice.json` with `"scenes"`, `seed`+`temperature:0` |
| **Multi-scene timed** | Hit visual beats | `start` per scene |
| **Regen one scene** | Fix line 2 without redoing 1 and 3 | `framevox voice --scene 2` |
| **Single → split** | Same voice, auto parts | *planned* `framevox voice --split` |

If audio shorter than video: extend script, add `...`, or shorten GSAP to match `voice-timeline.json`.

To inspect length: `ffprobe voice.mp3 2>&1 | grep Duration`

### Provider comparison

| Provider    | Quality  | Speed   | Cost      | Best for               |
|-------------|----------|---------|-----------|------------------------|
| gemini      | ★★★★★   | fast    | API quota | es-AR, natural, warm   |
| elevenlabs  | ★★★★★   | fast    | paid      | English, custom voices |
| piper       | ★★★☆☆   | local   | free      | offline, any language  |

**Gemini voices:** Aoede (default, warm female), Kore (neutral), Charon (deep male), Fenrir (young male), Puck (friendly neutral)

**Piper voice models** (must be downloaded first):
- `es_ES-mls-medium` — Spanish ES, female
- `es_ES-sharvard-medium` — Spanish ES, male
- `en_US-lessac-medium` — English US, female
- `pt_BR-faber-medium` — Portuguese BR, male

---

## Step 6 — Lint and render

```bash
# Render (lint runs first by default):
npx framevox render

# Skip lint (not recommended):
npx framevox render --no-lint

# Lint only:
npx framevox lint

# Render with options:
npx framevox render --out promo-v2.mp4 --quality high

# Preview in browser (hot reload):
npx framevox preview

# Open result:
open output.mp4
```

**Render time:** 15–30s for a 30s composition. Normal quality is fine for review and social.

**Common issues:**
- *Voice cuts off:* re-run `framevox voice` or `framevox render` (auto +0.5s margin); or bump `data-duration` manually
- *Scene stays black:* confirm `data-start` and `data-duration` are correct floats, not strings
- *Lint error on overlapping tracks:* check that no two scenes share a `data-track-index`
- *Logo not showing:* confirm `assets/logo.png` exists — the `onerror` hides it silently
- *Render fails with HyperFrames not found:* `npx hyperframes` downloads automatically on first run

---

## Step 7 — Document with RECIPE.md

```bash
npx framevox recipe "My Video Title"
```

Generates `RECIPE.md` with: date, composition ID, provider, voice MD5, render quality,
output path, full voice script, and the exact commands to reproduce.

Also write production notes manually at the bottom of RECIPE.md:
- What angle/hook was chosen and why
- Any data adjustments made to card content
- Validation: which features shown in the video actually exist in the product

---

## Key management

```bash
# Add keys (stored in ~/.framevox/.env):
npx framevox add-key gemini YOUR_API_KEY
npx framevox add-key gemini-voice Aoede
npx framevox add-key elevenlabs YOUR_API_KEY
npx framevox add-key elevenlabs-voice VOICE_ID
npx framevox add-key piper-voice es_ES-mls-medium
npx framevox add-key piper-voices-dir /path/to/piper/voices

# Check status:
npx framevox keys
```

**Key lookup order (each provider):**
1. Shell environment variable (e.g., `GEMINI_API_KEY`)
2. `~/.framevox/.env`
3. `~/.claude/skills/video-docs-builder/.env` (Gemini only — backward compat)

So if Gemini is already configured in video-docs-builder, framevox works out of the box.

---

## Template anatomy

### mobile-promo / desktop-promo (30s, 5 scenes)

| Scene | Time        | Content                              |
|-------|-------------|--------------------------------------|
| splash | 0 – 2s     | Static poster (CSS `opacity:1`) — logo + name; fades before hook |
| s0    | (hidden)   | Legacy brand scene — use `#splash` instead |
| s1    | 0.85 – 3s   | Hook — eyebrow + question + sub      |
| s2    | 3 – 9.7s    | Card A — overview panel (stats + rows)|
| s3    | 9.7 – 15.7s | Card B — active flow (kanban)         |
| s4    | 15.7 – 21.6s| Card C — summary / features           |
| s5    | 21.6 – 30s  | CTA — offer + domain pill + stickers  |

### mobile-minimal / desktop-minimal (20s, 3 scenes)

| Scene | Time      | Content                |
|-------|-----------|------------------------|
| s0    | 0 – 8s    | Hook — eyebrow + headline + sub |
| s1    | 8 – 14s   | Feature / benefit scene |
| s2    | 14 – 20s  | CTA — offer + domain   |

---

## State files

| File                        | Purpose                                   |
|-----------------------------|-------------------------------------------|
| `index.html`                | Composition source — keep as "backup"     |
| `voice.json`                | Voice script — prompt + text or scenes    |
| `voice.mp3`                 | Generated audio — regenerate anytime      |
| `DESIGN.md`                 | Brand decisions — source of truth for colors |
| `RECIPE.md`                 | Production record — written after render  |
| `assets/`                   | Logo, images, fonts — relative to project |
| `.framevox/config.json`     | Provider, last render, format metadata    |
| `~/.framevox/.env`          | Global API keys — never commit this       |

The `.framevox/` folder is gitignored by convention (add it to `.gitignore`).
The `output.mp4` is also gitignored — move it to a public folder or CDN after review.

---

## Anti-patterns

- `framevox render` lints by default — use `--no-lint` only when you know the composition is clean
- Never invent product features in card content — only show what the product actually does
- Never use more than one accent color per composition
- Never put `assets/` outside the project folder — paths must stay relative
- Never commit `~/.framevox/.env` — keys are global, not project-specific
- Never skip the MD5 check — if it passes silently with the same hash, the API failed
