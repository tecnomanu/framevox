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

Framevox is a CLI that wraps HyperFrames (HTML→MP4) and three TTS providers.
It installs as `npx framevox` — no global install needed on the client machine.

**Project root:** `/Volumes/SSDT7Shield/proyectos_varios/framevox/`
**Templates:** `templates/{mobile-promo,desktop-promo,mobile-minimal,desktop-minimal}/`
**Skill:** `skill/SKILL.md` (this file)

---

## Workflow (start here)

Every video follows the same 7-step loop. Don't skip steps — each builds on the previous.

```
1. init      → scaffold project from template
2. DESIGN.md → fill brand vars (colors, font, product info)
3. index.html → edit copy and data (<!-- BRAND: --> and <!-- COPY: --> comments)
4. script.txt → write the voice script
5. voice     → generate voice.mp3
6. lint+render → check and render to MP4
7. recipe    → document the process
```

---

## Step 1 — Scaffold

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
├── script.txt       ← voice script template (edit this)
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

**audio element:** update `data-duration` to match the actual voice.mp3 length after generation:
```html
<audio src="voice.mp3" data-start="1.0" data-duration="25.4" data-volume="1"></audio>
```

---

## Step 4 — Write script.txt

The file `script.txt` contains the full prompt sent to the TTS provider.
For Gemini, the file has two parts: style instruction + script text (already structured in the template).

**Voice script rules (es-AR / Gemini Aoede):**
- Open with 1–2 questions in voseo ("¿Tu equipo pierde seguimientos?")
- ~70–80 words → ~25–26s in Aoede. Leave 4s at the end for the CTA pill to breathe.
- Numbers as words: "treinta días", not "30 días"
- URLs as words: "airocrm punto com", not "https://airocrm.com"
- No exclamation marks — tone is confident, not euphoric
- End with: "Probalo treinta días gratis. Sin tarjeta. [dominio punto xxx]."

**English / neutral script:** remove the rioplatense instruction at the top of script.txt
and adjust accordingly. For ElevenLabs, just write the plain script without style instruction.

---

## Step 5 — Generate voice

```bash
# Default provider (from .framevox/config.json, initially gemini):
npx framevox voice

# Explicit provider:
npx framevox voice --provider gemini
npx framevox voice --provider piper
npx framevox voice --provider elevenlabs

# Override voice within provider:
npx framevox voice --provider gemini --voice Kore
npx framevox voice --provider elevenlabs --voice TxGEqnHWrfWFTfGW9XjX

# One-off text without script.txt:
npx framevox voice --text "Your text here"

# Output to custom file:
npx framevox voice -o narration.mp3
```

Framevox validates the MD5 after generation — if it matches the previous file, it aborts.
This catches cases where the API returned no audio (quota, bad key) silently.

After generating, check the length: `ffprobe voice.mp3 2>&1 | grep Duration`
Then update `data-duration` in the audio element to match.

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
# Always lint before rendering:
npx framevox lint

# Render (standard):
npx framevox render

# Render with options:
npx framevox render --out promo-v2.mp4 --quality high

# Preview in browser (hot reload):
npx framevox preview

# Open result:
open output.mp4
```

**Render time:** 15–30s for a 30s composition. Normal quality is fine for review and social.

**Common issues:**
- *Voice cuts off:* increase `data-duration` on the `<audio>` element by +0.3s
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
| s0    | 0 – 0.85s   | Brand stamp — logo + name + tagline  |
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
| `script.txt`                | Voice script — versioned with project     |
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

- Never render before linting — lint catches timing errors invisible in preview
- Never invent product features in card content — only show what the product actually does
- Never use more than one accent color per composition
- Never put `assets/` outside the project folder — paths must stay relative
- Never commit `~/.framevox/.env` — keys are global, not project-specific
- Never skip the MD5 check — if it passes silently with the same hash, the API failed
