// ─── SnapFit SEO copy generator (model-powered, build-time, cached) ────────────
// Calls an OpenRouter chat model ONCE per page to write UNIQUE prose (lede, meta
// description, FAQ answers) and stores it in scripts/seo-copy.json — which IS
// committed to git. gen-seo.mjs only READS that cache, so the actual site build
// (`npm run build`) never needs a key, never hits the network, and is fully
// reproducible. Run this only when you add pages or change specs in presets.js.
//
//   npm run seo:copy                    # fill every missing page
//   npm run seo:copy -- --only=exam:neet   # just one page (test first!)
//   npm run seo:copy -- --limit=3          # cap model calls this run
//   npm run seo:copy -- --force            # regenerate even cached pages
//
// Needs OPENROUTER_API_KEY (put it in a gitignored .env; package.json passes
// --env-file). The model writes PROSE only — every hard number (px/KB) still
// comes from presets.js via gen-seo.mjs, and any prose that invents a spec number
// is rejected and that page falls back to its template copy.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { allDescriptors, allowedNumbers } from './seo-copy-lib.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CACHE = resolve(__dirname, 'seo-copy.json')

const API_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions'
const MODEL   = process.env.OPENROUTER_MODEL    || 'minimax/minimax-m3:free'
const KEY     = process.env.OPENROUTER_API_KEY

// ── args ──
const args = process.argv.slice(2)
const arg = (name) => { const a = args.find(x => x.startsWith(`--${name}=`)); return a ? a.split('=')[1] : undefined }
const has = (name) => args.includes(`--${name}`)
const ONLY  = arg('only')
const LIMIT = arg('limit') ? parseInt(arg('limit')) : Infinity
const FORCE = has('force')

if (!KEY) {
  console.error('✗ OPENROUTER_API_KEY is not set. Add it to a (gitignored) .env file:\n    OPENROUTER_API_KEY=sk-or-...\nThen run: npm run seo:copy')
  process.exit(1)
}

const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {}

// Write the cache with sorted top-level keys (stable diffs). NOTE: pass `null` as
// the replacer — an array replacer would whitelist keys and strip nested fields.
const saveCache = () => {
  const sorted = Object.fromEntries(Object.keys(cache).sort().map(k => [k, cache[k]]))
  writeFileSync(CACHE, JSON.stringify(sorted, null, 2) + '\n')
}

// ── prompt builders per page type ──
function promptFor({ type, facts }) {
  const rules =
    'Write in British/Indian English for an Indian audience. No emojis, no hype ' +
    '("blazing", "revolutionary"), no exclamation marks. Vary sentence structure ' +
    'and question wording so this page does not read like other pages. Do NOT ' +
    'state any pixel or file-size number other than the exact facts given — never ' +
    'round, invent, or add new dimensions. Photos are processed entirely in the ' +
    "browser (nothing is uploaded), it's free, and needs no sign-up. Return ONLY " +
    'a JSON object, no markdown fences.'

  const shape = 'Shape: {"lede": string (1 sentence, ≤180 chars), "description": ' +
    'string (meta description, ≤155 chars), "faqs": [{"q": string, "a": string}] ' +
    '(exactly 4 items; keep the first question focused on the core spec)}.'

  if (type === 'exam')
    return `${rules}\n${shape}\nTopic: the photo required for the ${facts.label} exam application form. Facts: ${facts.dims}, ${facts.kb}, ${facts.fmt} format, ${facts.bg} background.`
  if (type === 'sell')
    return `${rules}\n${shape}\nTopic: product listing photos for the ${facts.name} marketplace. Facts: ${facts.dims}, ${facts.bg} background, max file ${facts.maxKb} KB. Extra guidance: ${facts.note}. Audience: Indian online sellers.`
  if (type === 'kb') {
    const uses = facts.uses.length ? `A ${facts.kb} KB limit is common for these exams: ${facts.uses.join(', ')}.` : 'This is used via a custom size target.'
    return `${rules}\n${shape}\nTopic: compressing/reducing a photo to under ${facts.kb} KB online. ${uses} The tool trades JPEG quality gradually with a live preview.`
  }
  // sig
  const list = facts.exams.map(e => `${e.id} ${e.w}×${e.h}px ${e.min}-${e.max}KB`).join('; ')
  return `${rules}\n${shape}\nTopic: resizing a scanned SIGNATURE to the size Indian exam forms require. Per-exam signature specs: ${list}. Signatures are signed on white paper, photographed, then cropped and compressed.`
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// ── model call (retries on 429 with backoff — free tier is rate-limited) ──
async function askModel(prompt, attempt = 0) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://www.snapfit.in',
      'X-Title': 'SnapFit SEO copy',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  })
  if (res.status === 429) {
    if (attempt >= 4) throw new Error('rate limited (429) after retries')
    const wait = 15000 * (attempt + 1) // 15s, 30s, 45s, 60s
    process.stdout.write(`429, waiting ${wait / 1000}s… `)
    await sleep(wait)
    return askModel(prompt, attempt + 1)
  }
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) throw new Error('empty model response')
  // strip accidental ```json fences, then parse
  const clean = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
  return JSON.parse(clean)
}

// ── validation: shape + no invented spec numbers ──
function validate(copy, facts) {
  if (!copy || typeof copy.lede !== 'string' || typeof copy.description !== 'string' || !Array.isArray(copy.faqs) || copy.faqs.length < 3)
    return 'bad shape'
  for (const f of copy.faqs) if (typeof f?.q !== 'string' || typeof f?.a !== 'string') return 'bad faq item'
  const allowed = allowedNumbers(facts)
  const blob = [copy.lede, copy.description, ...copy.faqs.flatMap(f => [f.q, f.a])].join(' ')
  // spec-shaped tokens: "200×230", "200 px", "50KB", "5 MB", "1600x1600"
  const specTokens = blob.match(/\d+\s*(?:×|x)\s*\d+|\d+\s*(?:px|kb|mb)/gi) || []
  for (const tok of specTokens) {
    const nums = tok.match(/\d+/g) || []
    for (const n of nums) if (!allowed.has(n)) return `invented number "${n}" in "${tok.trim()}"`
  }
  return null
}

// ── run ──
let descriptors = allDescriptors()
if (ONLY) descriptors = descriptors.filter(d => d.key.includes(ONLY))
if (!descriptors.length) { console.error(`✗ no pages match --only=${ONLY}`); process.exit(1) }

let calls = 0, wrote = 0, skipped = 0, failed = 0
for (const d of descriptors) {
  if (!FORCE && cache[d.key]) { skipped++; continue }
  if (calls >= LIMIT) { console.log(`… stopped at --limit=${LIMIT}`); break }
  calls++
  process.stdout.write(`→ ${d.key} … `)
  try {
    const copy = await askModel(promptFor(d))
    const err = validate(copy, d.facts)
    if (err) { console.log(`REJECTED (${err}) — page will use template`); failed++; continue }
    cache[d.key] = { lede: copy.lede, description: copy.description, faqs: copy.faqs.slice(0, 4) }
    wrote++
    console.log('ok')
    saveCache() // save after every success so a mid-run rate-limit never loses work
  } catch (e) {
    console.log(`FAILED (${e.message}) — page will use template`); failed++
  }
  await sleep(3000) // gentle pacing to stay under the free-tier per-minute cap
}

// prune orphaned keys (specs changed / pages removed) to keep the cache clean
const valid = new Set(allDescriptors().map(d => d.key))
let pruned = 0
for (const k of Object.keys(cache)) if (!valid.has(k)) { delete cache[k]; pruned++ }

saveCache()
console.log(`\n✓ seo-copy.json: +${wrote} new, ${skipped} cached, ${failed} fell back, ${pruned} pruned — ${Object.keys(cache).length} total`)
