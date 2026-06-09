#!/usr/bin/env node
/** Patch splash 2s → 0.5s and shift timelines in all template index.html files */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates')

const PROMO_GSAP = `const tl = gsap.timeline({ paused: true })
tl.to('#splash', { opacity: 0, duration: 0.25, ease: 'power2.inOut' }, 0.5)
tl.to('#s1', { opacity: 1, duration: 0 }, 0.5)
tl.from('#s1 .hook-eyebrow',  { y: -24, opacity: 0, duration: 0.3, ease: 'power2.out' }, 0.55)
tl.from('#s1 .hook-question', { y: 40,  opacity: 0, duration: 0.4, ease: 'power3.out' }, 0.65)
tl.from('#s1 .hook-sub',      { y: 24,  opacity: 0, duration: 0.35,ease: 'power2.out' }, 0.85)
tl.from('#s1 .sticker',       { scale: 0.5, opacity: 0, stagger: 0.12, duration: 0.35, ease: 'back.out(2)' }, 1.0)
tl.to('#s1', { opacity: 0, duration: 0.35, ease: 'power2.inOut' }, 2.15)
tl.to('#s2', { opacity: 1, duration: 0 }, 2.5)
tl.from('#s2 .card-label', { y: -30, opacity: 0, duration: 0.35, ease: 'power2.out' }, 2.55)
tl.from('#s2 .card',       { y: 60,  opacity: 0, duration: 0.5,  ease: 'power3.out' }, 2.65)
tl.from('#s2 .stat',       { y: 20,  opacity: 0, stagger: 0.08, duration: 0.3, ease: 'power2.out' }, 3.0)
tl.from('#s2 .row',        { x: -20, opacity: 0, stagger: 0.1,  duration: 0.3, ease: 'power2.out' }, 3.3)
tl.to('#s2', { opacity: 0, duration: 0.35, ease: 'power2.inOut' }, 8.85)
tl.to('#s3', { opacity: 1, duration: 0 }, 9.2)
tl.from('#s3 .card-label',   { y: -30, opacity: 0, duration: 0.35, ease: 'power2.out' }, 9.25)
tl.from('#s3 .card',         { y: 60,  opacity: 0, duration: 0.5,  ease: 'power3.out' }, 9.35)
tl.from('#s3 .kanban-col',   { y: 30,  opacity: 0, stagger: 0.12, duration: 0.35, ease: 'power2.out' }, 9.7)
tl.from('#s3 .kanban-item',  { x: -16, opacity: 0, stagger: 0.08, duration: 0.28, ease: 'power2.out' }, 9.95)
tl.to('#s3', { opacity: 0, duration: 0.35, ease: 'power2.inOut' }, 14.85)
tl.to('#s4', { opacity: 1, duration: 0 }, 15.2)
tl.from('#s4 .card-label',   { y: -30, opacity: 0, duration: 0.35, ease: 'power2.out' }, 15.25)
tl.from('#s4 .card',         { y: 60,  opacity: 0, duration: 0.5,  ease: 'power3.out' }, 15.35)
tl.from('#s4 .feature-row',  { x: -24, opacity: 0, stagger: 0.1,  duration: 0.32, ease: 'power2.out' }, 15.7)
tl.to('#s4', { opacity: 0, duration: 0.35, ease: 'power2.inOut' }, 20.75)
tl.to('#s5', { opacity: 1, duration: 0 }, 21.1)
tl.from('#s5 .cta-logo',   { scale: 0.6, opacity: 0, duration: 0.45, ease: 'back.out(1.5)' }, 21.15)
tl.from('#s5 .cta-offer',  { y: 40,  opacity: 0, duration: 0.5,  ease: 'power3.out' }, 21.45)
tl.from('#s5 .cta-pill',   { scale: 0.85, opacity: 0, duration: 0.4, ease: 'back.out(1.4)' }, 21.85)`

const MINIMAL_GSAP = `const tl = gsap.timeline({ paused: true })
tl.to('#splash', { opacity: 0, duration: 0.25, ease: 'power2.inOut' }, 0.5)
tl.to('#s1', { opacity: 1, duration: 0 }, 0.5)
tl.from('#s1 .eyebrow',  { y: -24, opacity: 0, duration: 0.35, ease: 'power2.out' }, 0.55)
tl.from('#s1 .headline', { y: 48,  opacity: 0, duration: 0.5,  ease: 'power3.out' }, 0.65)
tl.from('#s1 .sub',      { y: 28,  opacity: 0, duration: 0.4,  ease: 'power2.out' }, 0.95)
tl.to('#s1', { opacity: 0, duration: 0.4, ease: 'power2.inOut' }, 7.25)
tl.to('#s2', { opacity: 1, duration: 0 }, 7.65)
tl.from('#s2 .card-label', { y: -30, opacity: 0, duration: 0.35, ease: 'power2.out' }, 7.75)
tl.from('#s2 .card',       { y: 60,  opacity: 0, duration: 0.5,  ease: 'power3.out' }, 7.85)
tl.from('#s2 .stat',       { y: 20,  opacity: 0, stagger: 0.08, duration: 0.3, ease: 'power2.out' }, 8.2)
tl.from('#s2 .row',        { x: -20, opacity: 0, stagger: 0.1,  duration: 0.3, ease: 'power2.out' }, 8.5)
tl.to('#s2', { opacity: 0, duration: 0.4, ease: 'power2.inOut' }, 13.25)
tl.to('#s3', { opacity: 1, duration: 0 }, 13.65)
tl.from('#s3 .cta-logo', { scale: 0.6, opacity: 0, duration: 0.45, ease: 'back.out(1.5)' }, 13.75)
tl.from('#s3 .offer',    { y: 36,  opacity: 0, duration: 0.5,  ease: 'power3.out' }, 14.1)
tl.from('#s3 .pill',     { scale: 0.85, opacity: 0, duration: 0.4, ease: 'back.out(1.4)' }, 14.5)`

function replaceGsap(html, body) {
  const id = html.match(/window\.__timelines\['([^']+)'\]/)?.[1]
  if (!id) throw new Error('composition id not found')
  return html.replace(
    /<script>\nconst tl = gsap[\s\S]*?window\.__timelines\['[^']+'\] = tl\n<\/script>/,
    `<script>\n${body}\nwindow.__timelines = window.__timelines || {}\nwindow.__timelines['${id}'] = tl\n</script>`,
  )
}

function patchPromoStudio(html) {
  return replaceGsap(
    html
      .replace(/data-start="2\.0" data-duration="25\.0"/g, 'data-start="0.5" data-duration="26.5"')
      .replace(/data-duration="2" data-track-index="10"/g, 'data-duration="0.5" data-track-index="10"')
      .replace(/id="s1" data-start="0\.85"/g, 'id="s1" data-start="0.5"')
      .replace(/id="s2" data-start="3\.0"/g, 'id="s2" data-start="2.5"')
      .replace(/id="s3" data-start="9\.7"/g, 'id="s3" data-start="9.2"')
      .replace(/id="s4" data-start="15\.7"/g, 'id="s4" data-start="15.2"')
      .replace(/id="s5" data-start="21\.6"/g, 'id="s5" data-start="21.1"'),
    PROMO_GSAP,
  )
}

function patchMinimal(html) {
  return replaceGsap(
    html
      .replace(/data-start="2\.0" data-duration="16\.5"/g, 'data-start="0.5" data-duration="18.0"')
      .replace(/data-duration="2" data-track-index="10"/g, 'data-duration="0.5" data-track-index="10"')
      .replace(/id="s1" data-start="2"/g, 'id="s1" data-start="0.5"')
      .replace(/id="s2" data-start="8\.15"/g, 'id="s2" data-start="6.65"')
      .replace(/id="s3" data-start="14\.15"/g, 'id="s3" data-start="12.65"'),
    MINIMAL_GSAP,
  )
}

function walk(dir, fn) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, fn)
    else if (name === 'index.html') fn(p)
  }
}

for (const family of ['minimal', 'promo', 'studio']) {
  walk(join(ROOT, family), (file) => {
    let html = readFileSync(file, 'utf8')
    html = family === 'minimal' ? patchMinimal(html) : patchPromoStudio(html)
    writeFileSync(file, html)
    console.log('patched', file)
  })
}
