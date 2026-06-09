#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const ROOT = join(import.meta.dirname, '..', 'templates')

const IMPORT_CSS = `@import url('../style.css');\n`

function logoSvg(letter, accent, accent2) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="none">
  <rect width="128" height="128" rx="28" fill="url(#g)"/>
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="128" y2="128">
      <stop stop-color="${accent}"/>
      <stop offset="1" stop-color="${accent2}"/>
    </linearGradient>
  </defs>
  <text x="64" y="88" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="72" font-weight="900" fill="#fff">${letter}</text>
</svg>`
}

function baseStyle({ bg, surface, surface2, divider, accent, accent2, glowRgb }) {
  return `/* Shared family styles — product UI mockups */

:root {
  --bg:        ${bg};
  --surface:   ${surface};
  --surface2:  ${surface2};
  --divider:   ${divider};
  --accent:    ${accent};
  --accent2:   ${accent2};
  --text:      #F8FAFC;
  --muted:     #94A3B8;
  --green:     #10B981;
  --amber:     #F59E0B;
  --font:      'Inter', system-ui, sans-serif;
}

html, body {
  margin: 0; padding: 0;
  background: var(--bg);
  font-family: var(--font);
  color: var(--text);
  overflow: hidden;
}

.glow {
  position: absolute; top: 50%; left: 50%;
  width: 1400px; height: 1400px;
  margin: -700px 0 0 -700px;
  background: radial-gradient(circle, rgba(${glowRgb},0.18) 0%, transparent 62%);
  filter: blur(60px);
  pointer-events: none;
}

.scene {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  box-sizing: border-box;
  opacity: 0;
}

.splash {
  position: absolute; inset: 0; z-index: 200;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 120px 64px;
  box-sizing: border-box;
  opacity: 1;
  pointer-events: none;
}

.brand-logo {
  width: 160px; height: 160px;
  object-fit: contain;
  border-radius: 32px;
}
.brand-name {
  font-size: 80px; font-weight: 900;
  margin-top: 32px;
  background: linear-gradient(to right, var(--accent), var(--accent2));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.brand-tagline {
  font-size: 40px; font-weight: 600;
  color: var(--muted); margin-top: 16px;
}

.eyebrow {
  font-size: 30px; font-weight: 800;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--accent2);
  margin-bottom: 32px;
}
.headline {
  font-size: 88px; font-weight: 900;
  line-height: 1.1; text-align: center;
}
.headline .grad {
  background: linear-gradient(to right, var(--accent), var(--accent2));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.sub {
  font-size: 44px; font-weight: 600;
  color: var(--muted); text-align: center;
  margin-top: 28px; line-height: 1.4;
}

.hook-eyebrow {
  font-size: 30px; font-weight: 800;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--accent2);
  margin-bottom: 32px;
}
.hook-question {
  font-size: 72px; font-weight: 900;
  line-height: 1.12; text-align: center;
}
.hook-question .grad {
  background: linear-gradient(to right, var(--accent), var(--accent2));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.hook-sub {
  font-size: 44px; font-weight: 600;
  color: var(--muted); text-align: center;
  margin-top: 24px; line-height: 1.4;
}

.sticker {
  position: absolute;
  padding: 16px 28px; border-radius: 18px; border: 3px solid;
  font-size: 30px; font-weight: 800;
  letter-spacing: 0.08em; text-transform: uppercase;
  backdrop-filter: blur(2px);
}
.sticker.accent { border-color: var(--accent); color: var(--accent); background: rgba(${glowRgb},0.12); }
.sticker.green  { border-color: var(--green);  color: var(--green);  background: rgba(16,185,129,0.12); }
.sticker.amber  { border-color: var(--amber);  color: var(--amber);  background: rgba(245,158,11,0.12); }

.card {
  background: linear-gradient(180deg, var(--surface) 0%, var(--surface2) 100%);
  border: 1px solid rgba(148,163,184,0.12);
  border-radius: 32px;
  box-shadow: 0 30px 80px rgba(0,0,0,0.5), 0 0 60px rgba(${glowRgb},0.1);
  overflow: hidden;
}
.card-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 28px 36px 20px;
  border-bottom: 1px solid var(--divider);
}
.mac-dots { display: flex; gap: 10px; }
.mac-dot  { width: 18px; height: 18px; border-radius: 50%; }
.mac-dot.r { background: #FF5F57; }
.mac-dot.y { background: #FEBC2E; }
.mac-dot.g { background: #28C840; }
.card-title { font-size: 32px; font-weight: 700; }
.card-tag {
  font-size: 24px; font-weight: 700;
  color: var(--accent2);
  background: rgba(${glowRgb},0.15);
  border-radius: 8px; padding: 6px 16px;
}
.card-body { padding: 28px 36px; }

.stats { display: flex; gap: 20px; margin-bottom: 28px; }
.stat {
  flex: 1; background: rgba(255,255,255,0.04);
  border-radius: 16px; padding: 20px;
  text-align: center;
}
.stat-num {
  font-size: 60px; font-weight: 900;
  background: linear-gradient(to right, var(--text), var(--accent2));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  font-variant-numeric: tabular-nums;
}
.stat-label { font-size: 22px; font-weight: 600; color: var(--muted); margin-top: 8px; }

.row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 0;
  border-bottom: 1px solid var(--divider);
  font-size: 28px;
}
.row:last-child { border-bottom: none; }
.row-name { font-weight: 600; }
.row-meta { color: var(--muted); font-size: 24px; }
.badge {
  font-size: 22px; font-weight: 700; padding: 6px 16px;
  border-radius: 20px; display: flex; align-items: center; gap: 8px;
}
.badge-dot { width: 10px; height: 10px; border-radius: 50%; }
.badge.done    { background: rgba(16,185,129,0.15); color: var(--green); }
.badge.active  { background: rgba(${glowRgb},0.15); color: var(--accent2); }
.badge.pending { background: rgba(245,158,11,0.15); color: var(--amber); }
.badge.done .badge-dot    { background: var(--green); }
.badge.active .badge-dot  { background: var(--accent2); }
.badge.pending .badge-dot { background: var(--amber); }

.kanban { display: flex; gap: 16px; }
.kanban-col { flex: 1; }
.kanban-label {
  font-size: 22px; font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.1em; color: var(--muted);
  margin-bottom: 16px;
}
.kanban-item {
  border-radius: 12px; padding: 16px 18px;
  margin-bottom: 12px; font-size: 24px; font-weight: 600;
  border-left: 3px solid;
  background: rgba(255,255,255,0.03);
}
.kanban-item.pending { border-color: var(--amber); }
.kanban-item.active  { border-color: var(--accent2); }
.kanban-item.done    { border-color: var(--green); }
.kanban-sub { font-size: 20px; color: var(--muted); margin-top: 6px; }

.feature-list { display: flex; flex-direction: column; gap: 0; }
.feature-row {
  display: flex; align-items: center; gap: 24px;
  padding: 22px 0; border-bottom: 1px solid var(--divider);
  font-size: 28px; font-weight: 600;
}
.feature-row:last-child { border-bottom: none; }
.feature-icon {
  width: 56px; height: 56px; border-radius: 14px;
  background: rgba(${glowRgb},0.12);
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; flex-shrink: 0;
}
.feature-val {
  margin-left: auto; font-size: 40px; font-weight: 900;
  background: linear-gradient(to right, var(--accent), var(--accent2));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}

.offer {
  font-size: 64px; font-weight: 900; text-align: center;
  line-height: 1.2;
}
.pill {
  margin-top: 48px;
  background: rgba(${glowRgb},0.2);
  border: 2px solid var(--accent);
  border-radius: 60px; padding: 24px 64px;
  font-size: 48px; font-weight: 800;
  color: var(--accent2);
  letter-spacing: 0.02em;
}

.cta-logo { width: 140px; height: 140px; object-fit: contain; border-radius: 28px; }
.cta-offer {
  font-size: 56px; font-weight: 900; text-align: center;
  margin-top: 36px; line-height: 1.2;
}
.cta-pill {
  margin-top: 40px;
  background: rgba(${glowRgb},0.2);
  border: 2px solid var(--accent);
  border-radius: 60px; padding: 24px 64px;
  font-size: 48px; font-weight: 800;
  color: var(--accent2);
  letter-spacing: 0.02em;
}
.card-label {
  font-size: 52px; font-weight: 900;
  text-align: center; margin-bottom: 32px;
  width: 100%;
}

.layout-split { gap: 80px; padding: 60px 100px; flex-direction: row; align-items: center; justify-content: center; }
.hook-copy { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.cta-copy { flex: 1; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; }
.brand-col { display: flex; flex-direction: column; align-items: center; }
.scene-headline { font-size: 52px; font-weight: 900; line-height: 1.15; }
.scene-headline .grad {
  background: linear-gradient(to right, var(--accent), var(--accent2));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.scene-body { font-size: 32px; color: var(--muted); line-height: 1.4; }
`
}

const FAMILIES = {
  minimal: {
    label: 'Minimal · clean hook + single feature card + CTA',
    product: 'Ledgerly',
    domain: 'ledgerly.app',
    category: 'INVOICING',
    tagline: 'Invoices that close faster',
    letter: 'L',
    colors: { bg: '#0F172A', surface: '#1E293B', surface2: '#334155', divider: '#475569', accent: '#10B981', accent2: '#34D399', glowRgb: '16,185,129' },
    duration: 21,
    scenes: 3,
    compId: 'ledgerly-minimal',
    script: `Read the following script in a natural, warm, confident English tone. Medium energy, conversational pace — not salesy:

Still chasing invoice payments by email?
Ledgerly puts every bill, reminder, and payment in one clean dashboard.
Send polished invoices in seconds and see who paid at a glance.
Try Ledgerly free for thirty days. No credit card. ledgerly dot app.`,
    design: {
      hook: 'Still chasing payments by email?',
      headline: 'Invoices that close faster.',
      sub: 'Send, track, and get paid — without the spreadsheet chaos.',
      cta: '30 days free · No card required',
    },
  },
  promo: {
    label: 'Promo · 5-scene product walkthrough with rich UI cards',
    product: 'Crewdesk',
    domain: 'crewdesk.io',
    category: 'TEAM SCHEDULING',
    tagline: 'Shifts without the chaos',
    letter: 'C',
    colors: { bg: '#0A0F1E', surface: '#111A33', surface2: '#182241', divider: '#1F2A44', accent: '#6366F1', accent2: '#A78BFA', glowRgb: '99,102,241' },
    duration: 31,
    scenes: 5,
    compId: 'crewdesk-promo',
    script: `Read the following script in a natural, warm, confident English tone. Medium-high energy, agile pace. Use rising intonation on the opening questions:

Who's on shift tomorrow? Who called out?
Crewdesk gives you live coverage, shift swaps, and payroll-ready hours in one place.
Managers see gaps before they become emergencies. Teams swap shifts without endless group texts.
Try Crewdesk free for thirty days. No credit card. crewdesk dot io.`,
    design: {
      hook: "Who's on shift tomorrow?",
      sub: 'Live coverage, swaps, and payroll-ready hours — one dashboard.',
      cta: '30 days free · No card required',
    },
  },
  studio: {
    label: 'Studio · bold fitness promo with gradient headlines',
    product: 'Pulsefit',
    domain: 'pulsefit.co',
    category: 'FITNESS STUDIO',
    tagline: 'Fill every class',
    letter: 'P',
    colors: { bg: '#1A0F0A', surface: '#2A1810', surface2: '#3D2418', divider: '#4A2E1F', accent: '#F97316', accent2: '#FB923C', glowRgb: '249,115,22' },
    duration: 31,
    scenes: 5,
    compId: 'pulsefit-studio',
    script: `Read the following script in a natural, warm, confident English tone. Bold and energetic but still conversational:

Empty spots in your six AM class again?
Pulsefit tracks members, waitlists, and bookings so every mat gets filled.
See who's checked in, who's on the waitlist, and which instructors drive the most signups.
Try Pulsefit free for thirty days. No credit card. pulsefit dot co.`,
    design: {
      hook: 'Empty spots in your six AM class?',
      sub: 'Members, waitlists, and bookings — tuned for studio owners.',
      cta: '30 days free · No card required',
    },
  },
}

function write(path, content) {
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, content)
}

function minimalMobile(f) {
  const id = f.compId
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${f.product} · Minimal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="style.css" />
  <style>
    [data-composition-id="${id}"] {
      position: relative; width: 1080px; height: 1920px;
      background: var(--bg); overflow: hidden;
    }
    .scene { padding: 120px 64px; }
    .card { width: 920px; }
  </style>
</head>
<body>

<div id="stage" data-composition-id="${id}" data-width="1080" data-height="1920" data-fps="30" data-duration="${f.duration}" data-start="0">
  <div class="glow"></div>
  <audio id="voice" src="voice.mp3" data-start="2.0" data-duration="16.5" data-volume="1" data-track-index="9"></audio>

  <div id="splash" class="splash clip" data-start="0" data-duration="2" data-track-index="10">
    <img class="brand-logo" src="assets/logo.svg" alt="${f.product}" />
    <div class="brand-name">${f.product}</div>
    <div class="brand-tagline">${f.tagline}</div>
  </div>

  <div class="scene clip" id="s1" data-start="2" data-duration="6" data-track-index="0">
    <div class="eyebrow">${f.product} · ${f.category}</div>
    <div class="headline">${f.design.hook}<br><span class="grad">${f.design.headline}</span></div>
    <div class="sub">${f.design.sub}</div>
  </div>

  <div class="scene clip" id="s2" data-start="8.15" data-duration="6" data-track-index="1">
    <div class="card-label">Open invoices</div>
    <div class="card">
      <div class="card-header">
        <div class="mac-dots"><div class="mac-dot r"></div><div class="mac-dot y"></div><div class="mac-dot g"></div></div>
        <div class="card-title">March billing</div>
        <div class="card-tag">$24.8k due</div>
      </div>
      <div class="card-body">
        <div class="stats">
          <div class="stat"><div class="stat-num">18</div><div class="stat-label">Open</div></div>
          <div class="stat"><div class="stat-num">$24.8k</div><div class="stat-label">Outstanding</div></div>
          <div class="stat"><div class="stat-num">4.2d</div><div class="stat-label">Avg. pay</div></div>
        </div>
        <div class="row"><span class="row-name">Northwind Studio</span><span class="row-meta">#INV-2041 · $3,200</span><span class="badge active"><span class="badge-dot"></span>Sent</span></div>
        <div class="row"><span class="row-name">Brightline Co.</span><span class="row-meta">#INV-2038 · $1,450</span><span class="badge pending"><span class="badge-dot"></span>Due Fri</span></div>
        <div class="row"><span class="row-name">Harbor Labs</span><span class="row-meta">#INV-2035 · $890</span><span class="badge done"><span class="badge-dot"></span>Paid</span></div>
        <div class="row"><span class="row-name">Summit Agency</span><span class="row-meta">#INV-2032 · $2,100</span><span class="badge active"><span class="badge-dot"></span>Viewed</span></div>
      </div>
    </div>
  </div>

  <div class="scene clip" id="s3" data-start="14.15" data-duration="6.85" data-track-index="2">
    <img class="cta-logo" src="assets/logo.svg" alt="${f.product}" />
    <div class="offer">${f.design.cta}</div>
    <div class="pill">${f.domain}</div>
  </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script>
const tl = gsap.timeline({ paused: true })
const T = 1.15
tl.to('#splash', { opacity: 0, duration: 0.4, ease: 'power2.inOut' }, 2.0)
tl.to('#s1', { opacity: 1, duration: 0 }, 2.0)
tl.from('#s1 .eyebrow',  { y: -24, opacity: 0, duration: 0.35, ease: 'power2.out' }, 2.1)
tl.from('#s1 .headline', { y: 48,  opacity: 0, duration: 0.5,  ease: 'power3.out' }, 2.25)
tl.from('#s1 .sub',      { y: 28,  opacity: 0, duration: 0.4,  ease: 'power2.out' }, 2.55)
tl.to('#s1', { opacity: 0, duration: 0.4, ease: 'power2.inOut' }, 7.6 + T)
tl.to('#s2', { opacity: 1, duration: 0 }, 8 + T)
tl.from('#s2 .card-label', { y: -30, opacity: 0, duration: 0.35, ease: 'power2.out' }, 8.1 + T)
tl.from('#s2 .card',       { y: 60,  opacity: 0, duration: 0.5,  ease: 'power3.out' }, 8.2 + T)
tl.from('#s2 .stat',       { y: 20,  opacity: 0, stagger: 0.08, duration: 0.3, ease: 'power2.out' }, 8.55 + T)
tl.from('#s2 .row',        { x: -20, opacity: 0, stagger: 0.1,  duration: 0.3, ease: 'power2.out' }, 8.85 + T)
tl.to('#s2', { opacity: 0, duration: 0.4, ease: 'power2.inOut' }, 13.6 + T)
tl.to('#s3', { opacity: 1, duration: 0 }, 14 + T)
tl.from('#s3 .cta-logo', { scale: 0.6, opacity: 0, duration: 0.45, ease: 'back.out(1.5)' }, 14.1 + T)
tl.from('#s3 .offer',    { y: 36,  opacity: 0, duration: 0.5,  ease: 'power3.out' }, 14.45 + T)
tl.from('#s3 .pill',     { scale: 0.85, opacity: 0, duration: 0.4, ease: 'back.out(1.4)' }, 14.85 + T)
window.__timelines = window.__timelines || {}
window.__timelines['${id}'] = tl
</script>
</body>
</html>`
}

function minimalDesktop(f) {
  const id = `${f.compId}-desktop`
  const assets = '../mobile/assets/logo.svg'
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${f.product} · Minimal Desktop</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="style.css" />
  <style>
    [data-composition-id="${id}"] {
      position: relative; width: 1920px; height: 1080px;
      background: var(--bg); overflow: hidden;
    }
    .glow { width: 1200px; height: 1200px; margin: -600px 0 0 -600px; }
    .scene { padding: 80px 120px; }
    .brand-logo { width: 120px; height: 120px; border-radius: 24px; }
    .brand-name { font-size: 64px; margin-top: 20px; }
    .brand-tagline { font-size: 28px; margin-top: 10px; }
    .eyebrow { font-size: 22px; margin-bottom: 20px; }
    .headline { font-size: 72px; text-align: left; }
    .sub { font-size: 32px; text-align: left; margin-top: 20px; }
    .card { max-width: 780px; border-radius: 24px; }
    .card-header { padding: 20px 28px 14px; }
    .mac-dot { width: 14px; height: 14px; }
    .card-title { font-size: 24px; }
    .card-tag { font-size: 18px; }
    .card-body { padding: 20px 28px; }
    .stat-num { font-size: 44px; }
    .stat-label { font-size: 16px; }
    .row { font-size: 20px; padding: 12px 0; }
    .row-meta { font-size: 16px; }
    .badge { font-size: 15px; }
    .card-label { font-size: 40px; margin-bottom: 24px; text-align: left; width: auto; }
    .offer { font-size: 56px; text-align: left; }
    .pill { font-size: 36px; padding: 18px 48px; margin-top: 32px; }
    .cta-logo { width: 100px; height: 100px; }
    .layout-split { gap: 80px; padding: 60px 100px; flex-direction: row; }
    .hook-copy { flex: 1; }
    .cta-copy { flex: 1; align-items: flex-start; }
  </style>
</head>
<body>

<div id="stage" data-composition-id="${id}" data-width="1920" data-height="1080" data-fps="30" data-duration="${f.duration}" data-start="0">
  <div class="glow"></div>
  <audio id="voice" src="voice.mp3" data-start="2.0" data-duration="16.5" data-volume="1" data-track-index="9"></audio>

  <div id="splash" class="splash clip" data-start="0" data-duration="2" data-track-index="10">
    <img class="brand-logo" src="${assets}" alt="${f.product}" />
    <div class="brand-name">${f.product}</div>
    <div class="brand-tagline">${f.tagline}</div>
  </div>

  <div class="scene clip layout-split" id="s1" data-start="2" data-duration="6" data-track-index="0">
    <div class="hook-copy">
      <div class="eyebrow">${f.product} · ${f.category}</div>
      <div class="headline">${f.design.hook}<br><span class="grad">${f.design.headline}</span></div>
      <div class="sub">${f.design.sub}</div>
    </div>
  </div>

  <div class="scene clip layout-split" id="s2" data-start="8.15" data-duration="6" data-track-index="1">
    <div class="hook-copy">
      <div class="card-label">Open invoices</div>
    </div>
    <div class="card" style="flex:1.2;">
      <div class="card-header">
        <div class="mac-dots"><div class="mac-dot r"></div><div class="mac-dot y"></div><div class="mac-dot g"></div></div>
        <div class="card-title">March billing</div>
        <div class="card-tag">$24.8k due</div>
      </div>
      <div class="card-body">
        <div class="stats">
          <div class="stat"><div class="stat-num">18</div><div class="stat-label">Open</div></div>
          <div class="stat"><div class="stat-num">$24.8k</div><div class="stat-label">Outstanding</div></div>
          <div class="stat"><div class="stat-num">4.2d</div><div class="stat-label">Avg. pay</div></div>
        </div>
        <div class="row"><span class="row-name">Northwind Studio</span><span class="row-meta">#INV-2041 · $3,200</span><span class="badge active"><span class="badge-dot"></span>Sent</span></div>
        <div class="row"><span class="row-name">Brightline Co.</span><span class="row-meta">#INV-2038 · $1,450</span><span class="badge pending"><span class="badge-dot"></span>Due Fri</span></div>
        <div class="row"><span class="row-name">Harbor Labs</span><span class="row-meta">#INV-2035 · $890</span><span class="badge done"><span class="badge-dot"></span>Paid</span></div>
        <div class="row"><span class="row-name">Summit Agency</span><span class="row-meta">#INV-2032 · $2,100</span><span class="badge active"><span class="badge-dot"></span>Viewed</span></div>
      </div>
    </div>
  </div>

  <div class="scene clip layout-split" id="s3" data-start="14.15" data-duration="6.85" data-track-index="2">
    <div class="cta-copy">
      <img class="cta-logo" src="${assets}" alt="${f.product}" />
      <div class="offer">${f.design.cta}</div>
      <div class="pill">${f.domain}</div>
    </div>
  </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script>
const tl = gsap.timeline({ paused: true })
const T = 1.15
tl.to('#splash', { opacity: 0, duration: 0.4, ease: 'power2.inOut' }, 2.0)
tl.to('#s1', { opacity: 1, duration: 0 }, 2.0)
tl.from('#s1 .eyebrow',  { y: -24, opacity: 0, duration: 0.35, ease: 'power2.out' }, 2.1)
tl.from('#s1 .headline', { y: 48,  opacity: 0, duration: 0.5,  ease: 'power3.out' }, 2.25)
tl.from('#s1 .sub',      { y: 28,  opacity: 0, duration: 0.4,  ease: 'power2.out' }, 2.55)
tl.to('#s1', { opacity: 0, duration: 0.4, ease: 'power2.inOut' }, 7.6 + T)
tl.to('#s2', { opacity: 1, duration: 0 }, 8 + T)
tl.from('#s2 .card-label', { y: -30, opacity: 0, duration: 0.35, ease: 'power2.out' }, 8.1 + T)
tl.from('#s2 .card',       { x: 50,  opacity: 0, duration: 0.5,  ease: 'power3.out' }, 8.2 + T)
tl.from('#s2 .stat',       { y: 20,  opacity: 0, stagger: 0.08, duration: 0.3, ease: 'power2.out' }, 8.55 + T)
tl.from('#s2 .row',        { x: -20, opacity: 0, stagger: 0.1,  duration: 0.3, ease: 'power2.out' }, 8.85 + T)
tl.to('#s2', { opacity: 0, duration: 0.4, ease: 'power2.inOut' }, 13.6 + T)
tl.to('#s3', { opacity: 1, duration: 0 }, 14 + T)
tl.from('#s3 .cta-logo', { scale: 0.6, opacity: 0, duration: 0.45, ease: 'back.out(1.5)' }, 14.1 + T)
tl.from('#s3 .offer',    { y: 36,  opacity: 0, duration: 0.5,  ease: 'power3.out' }, 14.45 + T)
tl.from('#s3 .pill',     { scale: 0.85, opacity: 0, duration: 0.4, ease: 'back.out(1.4)' }, 14.85 + T)
window.__timelines = window.__timelines || {}
window.__timelines['${id}'] = tl
</script>
</body>
</html>`
}

function promoMobile(f, data) {
  const id = f.compId
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${f.product} · Promo</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="style.css" />
  <style>
    [data-composition-id="${id}"] {
      position: relative; width: 1080px; height: 1920px;
      background: var(--bg); overflow: hidden;
    }
    .scene { padding: 120px 64px; }
    .card { width: 920px; }
    .sticker.s1a { top: 280px; right: 72px; transform: rotate(6deg); }
    .sticker.s1b { bottom: 320px; left: 64px; transform: rotate(-5deg); }
  </style>
</head>
<body>

<div id="stage" data-composition-id="${id}" data-width="1080" data-height="1920" data-fps="30" data-duration="${f.duration}" data-start="0">
  <div class="glow"></div>
  <audio id="voice" src="voice.mp3" data-start="2.0" data-duration="25.0" data-volume="1" data-track-index="9"></audio>

  <div id="splash" class="splash clip" data-start="0" data-duration="2" data-track-index="10">
    <img class="brand-logo" src="assets/logo.svg" alt="${f.product}" />
    <div class="brand-name">${f.product}</div>
    <div class="brand-tagline">${f.tagline}</div>
  </div>

  <div class="scene clip" id="s1" data-start="0.85" data-duration="2.15" data-track-index="0" style="display:none" aria-hidden="true"></div>

  <div class="scene clip" id="s1" data-start="0.85" data-duration="2.15" data-track-index="1">
    <div class="hook-eyebrow">${f.product} · ${f.category}</div>
    <div class="hook-question">${data.hookQ}<br><span class="grad">${data.hookQ2}</span></div>
    <div class="hook-sub">${f.design.sub}</div>
    <div class="sticker accent s1a">${data.sticker1}</div>
    <div class="sticker green s1b">${data.sticker2}</div>
  </div>

  <div class="scene clip" id="s2" data-start="3.0" data-duration="6.7" data-track-index="2">
    <div class="card-label">${data.s2label}</div>
    <div class="card">
      <div class="card-header">
        <div class="mac-dots"><div class="mac-dot r"></div><div class="mac-dot y"></div><div class="mac-dot g"></div></div>
        <div class="card-title">${data.s2title}</div>
        <div class="card-tag">${data.s2tag}</div>
      </div>
      <div class="card-body">
        <div class="stats">
          <div class="stat"><div class="stat-num">${data.stat1n}</div><div class="stat-label">${data.stat1l}</div></div>
          <div class="stat"><div class="stat-num">${data.stat2n}</div><div class="stat-label">${data.stat2l}</div></div>
          <div class="stat"><div class="stat-num">${data.stat3n}</div><div class="stat-label">${data.stat3l}</div></div>
        </div>
        ${data.rows.map(r => `<div class="row"><span class="row-name">${r.name}</span><span class="row-meta">${r.meta}</span><span class="badge ${r.badge}"><span class="badge-dot"></span>${r.status}</span></div>`).join('\n        ')}
      </div>
    </div>
  </div>

  <div class="scene clip" id="s3" data-start="9.7" data-duration="6.0" data-track-index="3">
    <div class="card-label">${data.s3label}</div>
    <div class="card">
      <div class="card-header">
        <div class="mac-dots"><div class="mac-dot r"></div><div class="mac-dot y"></div><div class="mac-dot g"></div></div>
        <div class="card-title">${data.s3title}</div>
        <div class="card-tag">${data.s3tag}</div>
      </div>
      <div class="card-body">
        <div class="kanban">
          ${data.kanban.map(col => `<div class="kanban-col">
            <div class="kanban-label">${col.label}</div>
            ${col.items.map(it => `<div class="kanban-item ${it.state}">${it.title}<div class="kanban-sub">${it.sub}</div></div>`).join('\n            ')}
          </div>`).join('\n          ')}
        </div>
      </div>
    </div>
  </div>

  <div class="scene clip" id="s4" data-start="15.7" data-duration="5.9" data-track-index="4">
    <div class="card-label">${data.s4label}</div>
    <div class="card">
      <div class="card-header">
        <div class="mac-dots"><div class="mac-dot r"></div><div class="mac-dot y"></div><div class="mac-dot g"></div></div>
        <div class="card-title">${data.s4title}</div>
        <div class="card-tag">${data.s4tag}</div>
      </div>
      <div class="card-body">
        <div class="feature-list">
          ${data.features.map(fe => `<div class="feature-row"><div class="feature-icon">${fe.icon}</div><span>${fe.name}</span><span class="feature-val">${fe.val}</span></div>`).join('\n          ')}
        </div>
      </div>
    </div>
  </div>

  <div class="scene clip" id="s5" data-start="21.6" data-duration="8.4" data-track-index="5">
    <img class="cta-logo" src="assets/logo.svg" alt="${f.product}" />
    <div class="cta-offer">${f.design.cta}</div>
    <div class="cta-pill">${f.domain}</div>
  </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script>
const tl = gsap.timeline({ paused: true })
const T = 1.15
tl.to('#splash', { opacity: 0, duration: 0.4, ease: 'power2.inOut' }, 2.0)
tl.to('#s1', { opacity: 1, duration: 0 }, 2.0)
tl.from('#s1 .hook-eyebrow',  { y: -24, opacity: 0, duration: 0.3, ease: 'power2.out' }, 2.05)
tl.from('#s1 .hook-question', { y: 40,  opacity: 0, duration: 0.4, ease: 'power3.out' }, 2.0 + 0.15)
tl.from('#s1 .hook-sub',      { y: 24,  opacity: 0, duration: 0.35,ease: 'power2.out' }, 2.0 + 0.35)
tl.from('#s1 .sticker',       { scale: 0.5, opacity: 0, stagger: 0.12, duration: 0.35, ease: 'back.out(2)' }, 2.0 + 0.5)
tl.to('#s1', { opacity: 0, duration: 0.35, ease: 'power2.inOut' }, 2.65 + T)
tl.to('#s2', { opacity: 1, duration: 0 }, 3.0 + T)
tl.from('#s2 .card-label', { y: -30, opacity: 0, duration: 0.35, ease: 'power2.out' }, 3.05 + T)
tl.from('#s2 .card',       { y: 60,  opacity: 0, duration: 0.5,  ease: 'power3.out' }, 3.15 + T)
tl.from('#s2 .stat',       { y: 20,  opacity: 0, stagger: 0.08, duration: 0.3, ease: 'power2.out' }, 3.5 + T)
tl.from('#s2 .row',        { x: -20, opacity: 0, stagger: 0.1,  duration: 0.3, ease: 'power2.out' }, 3.8 + T)
tl.to('#s2', { opacity: 0, duration: 0.35, ease: 'power2.inOut' }, 9.35 + T)
tl.to('#s3', { opacity: 1, duration: 0 }, 9.7 + T)
tl.from('#s3 .card-label',   { y: -30, opacity: 0, duration: 0.35, ease: 'power2.out' }, 9.75 + T)
tl.from('#s3 .card',         { y: 60,  opacity: 0, duration: 0.5,  ease: 'power3.out' }, 9.85 + T)
tl.from('#s3 .kanban-col',   { y: 30,  opacity: 0, stagger: 0.12, duration: 0.35, ease: 'power2.out' }, 10.2 + T)
tl.from('#s3 .kanban-item',  { x: -16, opacity: 0, stagger: 0.08, duration: 0.28, ease: 'power2.out' }, 10.45 + T)
tl.to('#s3', { opacity: 0, duration: 0.35, ease: 'power2.inOut' }, 15.35 + T)
tl.to('#s4', { opacity: 1, duration: 0 }, 15.7 + T)
tl.from('#s4 .card-label',   { y: -30, opacity: 0, duration: 0.35, ease: 'power2.out' }, 15.75 + T)
tl.from('#s4 .card',         { y: 60,  opacity: 0, duration: 0.5,  ease: 'power3.out' }, 15.85 + T)
tl.from('#s4 .feature-row',  { x: -24, opacity: 0, stagger: 0.1,  duration: 0.32, ease: 'power2.out' }, 16.2 + T)
tl.to('#s4', { opacity: 0, duration: 0.35, ease: 'power2.inOut' }, 21.25 + T)
tl.to('#s5', { opacity: 1, duration: 0 }, 21.6 + T)
tl.from('#s5 .cta-logo',   { scale: 0.6, opacity: 0, duration: 0.45, ease: 'back.out(1.5)' }, 21.65 + T)
tl.from('#s5 .cta-offer',  { y: 40,  opacity: 0, duration: 0.5,  ease: 'power3.out' }, 21.95 + T)
tl.from('#s5 .cta-pill',   { scale: 0.85, opacity: 0, duration: 0.4, ease: 'back.out(1.4)' }, 22.35 + T)
window.__timelines = window.__timelines || {}
window.__timelines['${id}'] = tl
</script>
</body>
</html>`
}

// Fix duplicate s1 id in promo mobile - remove the hidden placeholder
function promoMobileFixed(f, data) {
  let html = promoMobile(f, data)
  html = html.replace(`  <div class="scene clip" id="s1" data-start="0.85" data-duration="2.15" data-track-index="0" style="display:none" aria-hidden="true"></div>\n\n`, '')
  return html
}

function promoDesktop(f, data) {
  const id = `${f.compId}-desktop`
  const assets = '../mobile/assets/logo.svg'
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${f.product} · Promo Desktop</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="style.css" />
  <style>
    [data-composition-id="${id}"] {
      position: relative; width: 1920px; height: 1080px;
      background: var(--bg); overflow: hidden;
    }
    .glow { width: 1200px; height: 1200px; margin: -600px 0 0 -600px; }
    .brand-logo { width: 120px; height: 120px; border-radius: 24px; }
    .brand-name { font-size: 72px; margin-top: 24px; }
    .brand-tagline { font-size: 32px; margin-top: 12px; }
    .hook-eyebrow { font-size: 22px; margin-bottom: 24px; }
    .hook-question { font-size: 64px; text-align: left; }
    .hook-sub { font-size: 32px; margin-top: 20px; text-align: left; }
    .card { border-radius: 24px; max-width: 860px; }
    .card-header { padding: 20px 28px 14px; }
    .mac-dot { width: 14px; height: 14px; }
    .card-title { font-size: 24px; }
    .card-tag { font-size: 18px; padding: 4px 12px; }
    .card-body { padding: 20px 28px; }
    .stat-num { font-size: 44px; }
    .stat-label { font-size: 16px; }
    .row { font-size: 20px; padding: 12px 0; }
    .row-meta { font-size: 16px; }
    .badge { font-size: 15px; }
    .kanban-label { font-size: 16px; }
    .kanban-item { font-size: 17px; padding: 10px 12px; }
    .feature-row { font-size: 20px; padding: 14px 0; }
    .feature-val { font-size: 28px; }
    .cta-offer { font-size: 72px; text-align: left; }
    .cta-pill { font-size: 40px; padding: 18px 52px; border-radius: 50px; margin-top: 36px; }
    .sticker { position: relative; padding: 12px 22px; font-size: 22px; border-width: 2px; border-radius: 14px; }
    .scene-headline { font-size: 44px; font-weight: 900; }
    .scene-body { font-size: 28px; color: var(--muted); line-height: 1.4; }
    .card-label { font-size: 40px; text-align: left; margin-bottom: 0; }
  </style>
</head>
<body>

<div id="stage" data-composition-id="${id}" data-width="1920" data-height="1080" data-fps="30" data-duration="${f.duration}" data-start="0">
  <div class="glow"></div>
  <audio id="voice" src="voice.mp3" data-start="2.0" data-duration="25.0" data-volume="1" data-track-index="9"></audio>

  <div id="splash" class="splash clip" data-start="0" data-duration="2" data-track-index="10">
    <img class="brand-logo" src="${assets}" alt="${f.product}" />
    <div class="brand-name">${f.product}</div>
    <div class="brand-tagline">${f.tagline}</div>
  </div>

  <div class="scene clip layout-split" id="s1" data-start="0.85" data-duration="2.15" data-track-index="1">
    <div class="hook-copy">
      <div class="hook-eyebrow">${f.product} · ${f.category}</div>
      <div class="hook-question">${data.hookQ}<br><span class="grad">${data.hookQ2}</span></div>
      <div class="hook-sub">${f.design.sub}</div>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;">
      <div class="sticker accent" style="transform:rotate(4deg)">${data.sticker1}</div>
      <div class="sticker green" style="transform:rotate(-5deg)">${data.sticker2}</div>
    </div>
  </div>

  <div class="scene clip layout-split" id="s2" data-start="3.0" data-duration="6.7" data-track-index="2">
    <div style="flex:0.85;display:flex;flex-direction:column;justify-content:center;gap:12px;">
      <div class="scene-headline">${data.s2label}</div>
      <div class="scene-body">${data.s2body}</div>
    </div>
    <div class="card" style="flex:1.4;">
      <div class="card-header">
        <div class="mac-dots"><div class="mac-dot r"></div><div class="mac-dot y"></div><div class="mac-dot g"></div></div>
        <div class="card-title">${data.s2title}</div>
        <div class="card-tag">${data.s2tag}</div>
      </div>
      <div class="card-body">
        <div class="stats">
          <div class="stat"><div class="stat-num">${data.stat1n}</div><div class="stat-label">${data.stat1l}</div></div>
          <div class="stat"><div class="stat-num">${data.stat2n}</div><div class="stat-label">${data.stat2l}</div></div>
          <div class="stat"><div class="stat-num">${data.stat3n}</div><div class="stat-label">${data.stat3l}</div></div>
        </div>
        ${data.rows.map(r => `<div class="row"><span class="row-name">${r.name}</span><span class="row-meta">${r.meta}</span><span class="badge ${r.badge}"><span class="badge-dot"></span>${r.status}</span></div>`).join('\n        ')}
      </div>
    </div>
  </div>

  <div class="scene clip layout-split" id="s3" data-start="9.7" data-duration="6.0" data-track-index="3">
    <div class="card" style="flex:1.4;">
      <div class="card-header">
        <div class="mac-dots"><div class="mac-dot r"></div><div class="mac-dot y"></div><div class="mac-dot g"></div></div>
        <div class="card-title">${data.s3title}</div>
        <div class="card-tag">${data.s3tag}</div>
      </div>
      <div class="card-body">
        <div class="kanban">
          ${data.kanban.map(col => `<div class="kanban-col"><div class="kanban-label">${col.label}</div>${col.items.map(it => `<div class="kanban-item ${it.state}">${it.title}<div class="kanban-sub">${it.sub}</div></div>`).join('')}</div>`).join('\n          ')}
        </div>
      </div>
    </div>
    <div style="flex:0.85;display:flex;flex-direction:column;justify-content:center;gap:12px;">
      <div class="scene-headline">${data.s3label}</div>
      <div class="scene-body">${data.s3body}</div>
    </div>
  </div>

  <div class="scene clip layout-split" id="s4" data-start="15.7" data-duration="5.9" data-track-index="4">
    <div style="flex:0.85;display:flex;flex-direction:column;justify-content:center;gap:12px;">
      <div class="scene-headline">${data.s4label}</div>
      <div class="scene-body">${data.s4body}</div>
    </div>
    <div class="card" style="flex:1.4;">
      <div class="card-header">
        <div class="mac-dots"><div class="mac-dot r"></div><div class="mac-dot y"></div><div class="mac-dot g"></div></div>
        <div class="card-title">${data.s4title}</div>
        <div class="card-tag">${data.s4tag}</div>
      </div>
      <div class="card-body">
        <div class="feature-list">
          ${data.features.map(fe => `<div class="feature-row"><div class="feature-icon">${fe.icon}</div><span>${fe.name}</span><span class="feature-val">${fe.val}</span></div>`).join('\n          ')}
        </div>
      </div>
    </div>
  </div>

  <div class="scene clip layout-split" id="s5" data-start="21.6" data-duration="8.4" data-track-index="5">
    <div class="cta-copy">
      <img class="cta-logo" src="${assets}" alt="${f.product}" style="width:100px;height:100px;margin-bottom:28px;" />
      <div class="cta-offer">${f.design.cta}</div>
      <div class="cta-pill">${f.domain}</div>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;">
      <div class="sticker accent" style="transform:rotate(4deg)">${data.sticker1}</div>
      <div class="sticker green" style="transform:rotate(-5deg)">${data.sticker2}</div>
    </div>
  </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script>
const tl = gsap.timeline({ paused: true })
const T = 1.15
tl.to('#splash', { opacity: 0, duration: 0.4, ease: 'power2.inOut' }, 2.0)
tl.to('#s1', { opacity: 1, duration: 0 }, 2.0)
tl.from('#s1 .hook-eyebrow', { y: -20, opacity: 0, duration: 0.3, ease: 'power2.out' }, 2.05)
tl.from('#s1 .hook-question', { y: 36, opacity: 0, duration: 0.4, ease: 'power3.out' }, 2.15)
tl.from('#s1 .hook-sub', { y: 20, opacity: 0, duration: 0.35, ease: 'power2.out' }, 2.35)
tl.from('#s1 .sticker', { scale: 0.5, opacity: 0, stagger: 0.12, duration: 0.35, ease: 'back.out(2)' }, 2.5)
tl.to('#s1', { opacity: 0, duration: 0.35, ease: 'power2.inOut' }, 2.65 + T)
tl.to('#s2', { opacity: 1, duration: 0 }, 3.0 + T)
tl.from('#s2 > div:first-child > *', { x: -30, opacity: 0, stagger: 0.12, duration: 0.35, ease: 'power2.out' }, 3.1 + T)
tl.from('#s2 .card', { x: 50, opacity: 0, duration: 0.5, ease: 'power3.out' }, 3.15 + T)
tl.from('#s2 .stat', { y: 16, opacity: 0, stagger: 0.08, duration: 0.3, ease: 'power2.out' }, 3.55 + T)
tl.from('#s2 .row', { x: -16, opacity: 0, stagger: 0.1, duration: 0.3, ease: 'power2.out' }, 3.8 + T)
tl.to('#s2', { opacity: 0, duration: 0.35, ease: 'power2.inOut' }, 9.35 + T)
tl.to('#s3', { opacity: 1, duration: 0 }, 9.7 + T)
tl.from('#s3 .card', { x: -50, opacity: 0, duration: 0.5, ease: 'power3.out' }, 9.8 + T)
tl.from('#s3 > div:last-child > *', { x: 30, opacity: 0, stagger: 0.12, duration: 0.35, ease: 'power2.out' }, 9.85 + T)
tl.from('#s3 .kanban-col', { y: 24, opacity: 0, stagger: 0.1, duration: 0.3, ease: 'power2.out' }, 10.2 + T)
tl.to('#s3', { opacity: 0, duration: 0.35, ease: 'power2.inOut' }, 15.35 + T)
tl.to('#s4', { opacity: 1, duration: 0 }, 15.7 + T)
tl.from('#s4 > div:first-child > *', { x: -30, opacity: 0, stagger: 0.12, duration: 0.35, ease: 'power2.out' }, 15.8 + T)
tl.from('#s4 .card', { x: 50, opacity: 0, duration: 0.5, ease: 'power3.out' }, 15.85 + T)
tl.from('#s4 .feature-row', { x: -20, opacity: 0, stagger: 0.1, duration: 0.3, ease: 'power2.out' }, 16.2 + T)
tl.to('#s4', { opacity: 0, duration: 0.35, ease: 'power2.inOut' }, 21.25 + T)
tl.to('#s5', { opacity: 1, duration: 0 }, 21.6 + T)
tl.from('#s5 .cta-logo', { scale: 0.6, opacity: 0, duration: 0.45, ease: 'back.out(1.5)' }, 21.65 + T)
tl.from('#s5 .cta-offer', { y: 32, opacity: 0, duration: 0.5, ease: 'power3.out' }, 21.95 + T)
tl.from('#s5 .cta-pill', { scale: 0.85, opacity: 0, duration: 0.4, ease: 'back.out(1.4)' }, 22.35 + T)
tl.from('#s5 .sticker', { scale: 0.4, opacity: 0, stagger: 0.15, duration: 0.35, ease: 'back.out(2)' }, 22.6 + T)
window.__timelines = window.__timelines || {}
window.__timelines['${id}'] = tl
</script>
</body>
</html>`
}

const PROMO_DATA = {
  promo: {
    hookQ: "Who's on shift",
    hookQ2: 'tomorrow?',
    sticker1: 'Live coverage',
    sticker2: 'No callouts',
    s2label: 'Coverage at a glance',
    s2body: 'See open shifts, late arrivals, and overtime before the day starts.',
    s2title: 'Week of Mar 10',
    s2tag: '3 gaps',
    stat1n: '47', stat1l: 'Scheduled',
    stat2n: '3', stat2l: 'Open shifts',
    stat3n: '98%', stat3l: 'Filled',
    rows: [
      { name: 'Morning · Front desk', meta: 'Mon 6a–2p', badge: 'active', status: '2 open' },
      { name: 'Evening · Kitchen', meta: 'Wed 4p–12a', badge: 'pending', status: 'Swap pending' },
      { name: 'Weekend · Events', meta: 'Sat 10a–6p', badge: 'done', status: 'Covered' },
    ],
    s3label: 'Shift board',
    s3body: 'Drag swaps, approve time-off, and keep every role staffed.',
    s3title: 'Shift requests',
    s3tag: '6 pending',
    kanban: [
      { label: 'Requested', items: [
        { state: 'pending', title: 'Alex · Fri night', sub: 'Swap with Jordan' },
        { state: 'pending', title: 'Sam · Sun AM', sub: 'Time-off request' },
      ]},
      { label: 'Approved', items: [
        { state: 'active', title: 'Morgan · Tue PM', sub: 'Covering bar' },
        { state: 'active', title: 'Riley · Thu AM', sub: 'Training shift' },
      ]},
      { label: 'Published', items: [
        { state: 'done', title: 'Week 12 roster', sub: 'Sent to team' },
        { state: 'done', title: 'Payroll export', sub: 'Ready for ADP' },
      ]},
    ],
    s4label: 'Payroll-ready hours',
    s4body: 'Approved hours flow straight into your payroll run.',
    s4title: 'Hours summary',
    s4tag: 'Mar 1–15',
    features: [
      { icon: '⏱', name: 'Regular hours', val: '1,284h' },
      { icon: '✦', name: 'Overtime', val: '47h' },
      { icon: '↻', name: 'Swaps approved', val: '23' },
      { icon: '✓', name: 'Export status', val: 'Ready' },
    ],
  },
  studio: {
    hookQ: 'Empty spots in your',
    hookQ2: 'six AM class?',
    sticker1: 'Fill every mat',
    sticker2: 'Waitlist auto',
    s2label: 'Class capacity',
    s2body: 'Track signups, no-shows, and waitlist conversions in real time.',
    s2title: 'This week',
    s2tag: '92% full',
    stat1n: '186', stat1l: 'Bookings',
    stat2n: '14', stat2l: 'Waitlisted',
    stat3n: '4.8', stat3l: 'Avg rating',
    rows: [
      { name: 'Power Yoga · 6a', meta: 'Tue · Studio A', badge: 'active', status: '2 spots' },
      { name: 'HIIT Burn · 7:30a', meta: 'Wed · Studio B', badge: 'done', status: 'Full' },
      { name: 'Pilates Core · 5p', meta: 'Thu · Studio A', badge: 'pending', status: '3 waitlist' },
    ],
    s3label: 'Member board',
    s3body: 'See check-ins, renewals, and class packs at a glance.',
    s3title: 'Active members',
    s3tag: '248 total',
    kanban: [
      { label: 'Checked in', items: [
        { state: 'done', title: 'Jordan Lee', sub: '6a Power Yoga' },
        { state: 'done', title: 'Casey Kim', sub: '6a Power Yoga' },
      ]},
      { label: 'Up next', items: [
        { state: 'active', title: 'Morgan Diaz', sub: '7:30a HIIT' },
        { state: 'active', title: 'Alex Rivera', sub: '7:30a HIIT' },
      ]},
      { label: 'Waitlist', items: [
        { state: 'pending', title: 'Sam Ortiz', sub: 'Pilates · Thu 5p' },
        { state: 'pending', title: 'Riley Park', sub: 'Pilates · Thu 5p' },
      ]},
    ],
    s4label: 'Revenue snapshot',
    s4body: 'Memberships, class packs, and drop-ins in one view.',
    s4title: 'March revenue',
    s4tag: '+12% MoM',
    features: [
      { icon: '◆', name: 'Memberships', val: '$18.4k' },
      { icon: '◇', name: 'Class packs', val: '$6.2k' },
      { icon: '◎', name: 'Drop-ins', val: '$2.1k' },
      { icon: '↑', name: 'Retention', val: '94%' },
    ],
  },
}

function designMd(f, family) {
  return `# DESIGN.md · ${family}-${f.product}

Fill this before editing index.html. Every color must trace back here.

## Product
- **Name:** ${f.product}
- **Category:** ${f.category.toLowerCase()}
- **Domain:** ${f.domain}
- **Language:** en

## Style
- **Family:** ${family}
- **Mood:** ${family === 'minimal' ? 'clean, professional' : family === 'promo' ? 'professional, confident' : 'bold, energetic'}
- **Canvas:** dark slate
- **Accent (primary):** ${f.colors.accent}
- **Accent gradient end:** ${f.colors.accent2}
- **Font:** Inter

## Copy
- **Hook:** ${f.design.hook || f.design.hookQ || ''}
- **Sub:** ${f.design.sub}
- **CTA offer:** ${f.design.cta}
- **Voice (Gemini):** Aoede | Kore | Charon

## What NOT to do
- Don't use light backgrounds on dark cards
- Don't use more than one accent color per composition
- Don't invent features the product doesn't have
- Don't reference framevox in copy
`
}

function templateJson(f, family, format) {
  const w = format === 'mobile' ? 1080 : 1920
  const h = format === 'mobile' ? 1920 : 1080
  const label = format === 'mobile'
    ? `Mobile · ${w}×${h} · ${f.product}`
    : `Desktop · ${w}×${h} · ${f.product}`
  return JSON.stringify({
    label,
    width: w,
    height: h,
    duration: f.duration,
    scenes: f.scenes,
    family,
    format,
  }, null, 2) + '\n'
}

const created = []

for (const [familyName, f] of Object.entries(FAMILIES)) {
  const dir = join(ROOT, familyName)
  write(join(dir, 'family.json'), JSON.stringify({ label: f.label, product: f.product }, null, 2) + '\n')
  write(join(dir, 'style.css'), baseStyle(f.colors))
  created.push(`${familyName}/family.json`, `${familyName}/style.css`)

  const mobileDir = join(dir, 'mobile')
  write(join(mobileDir, 'style.css'), IMPORT_CSS)
  write(join(mobileDir, 'assets', 'logo.svg'), logoSvg(f.letter, f.colors.accent, f.colors.accent2))
  write(join(mobileDir, 'voice.json'), JSON.stringify({
    prompt: 'Read the following in natural, warm, confident American English. Medium energy, conversational pace:',
    text: f.script,
  }, null, 2) + '\n')
  write(join(mobileDir, 'DESIGN.md'), designMd(f, familyName))
  write(join(mobileDir, 'template.json'), templateJson(f, familyName, 'mobile'))
  created.push(`${familyName}/mobile/style.css`, `${familyName}/mobile/assets/logo.svg`, `${familyName}/mobile/voice.json`, `${familyName}/mobile/DESIGN.md`, `${familyName}/mobile/template.json`)

  const desktopDir = join(dir, 'desktop')
  write(join(desktopDir, 'style.css'), IMPORT_CSS)
  write(join(desktopDir, 'voice.json'), JSON.stringify({
    prompt: 'Read the following in natural, warm, confident American English. Medium energy, conversational pace:',
    text: f.script,
  }, null, 2) + '\n')
  write(join(desktopDir, 'DESIGN.md'), designMd(f, familyName))
  write(join(desktopDir, 'template.json'), templateJson(f, familyName, 'desktop'))
  created.push(`${familyName}/desktop/style.css`, `${familyName}/desktop/voice.json`, `${familyName}/desktop/DESIGN.md`, `${familyName}/desktop/template.json`)

  if (familyName === 'minimal') {
    write(join(mobileDir, 'index.html'), minimalMobile(f))
    write(join(desktopDir, 'index.html'), minimalDesktop(f))
    created.push(`${familyName}/mobile/index.html`, `${familyName}/desktop/index.html`)
  } else {
    const data = PROMO_DATA[familyName]
    write(join(mobileDir, 'index.html'), promoMobileFixed(f, data))
    write(join(desktopDir, 'index.html'), promoDesktop(f, data))
    created.push(`${familyName}/mobile/index.html`, `${familyName}/desktop/index.html`)
  }
}

console.log('Created', created.length, 'files')
console.log(created.join('\n'))
console.log('\nComposition IDs:')
console.log('  ledgerly-minimal / ledgerly-minimal-desktop')
console.log('  crewdesk-promo / crewdesk-promo-desktop')
console.log('  pulsefit-studio / pulsefit-studio-desktop')
