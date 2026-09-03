// ─── Shared SEO-copy contract ──────────────────────────────────────────────────
// Single source of truth for BOTH the model-copy generator (gen-copy.mjs, which
// WRITES seo-copy.json) and the page generator (gen-seo.mjs, which READS it).
// Every page's cache key is derived from a hash of the exact facts that its copy
// depends on — so if a spec in presets.js changes, the key changes and that one
// page's copy is regenerated, while untouched pages stay cached. Keeping the key
// + facts builders here (not duplicated in each script) guarantees the two sides
// always agree on the key.
import { PRESETS, MARKETPLACE_PRESETS } from '../src/presets.js'

export { MARKETPLACE_PRESETS }
export const EXAMS = PRESETS.filter(p => p.id !== 'custom')
// High-volume "compress photo to N KB" queries.
export const KB_TARGETS = [10, 15, 20, 30, 40, 50, 100, 150, 200]

// Human-readable exam labels used in copy + prompts (kept identical across both
// scripts by living here).
export const EXAM_KW = {
  neet: 'NEET, JEE Main & CUET', ugcnet: 'UGC NET', mpsc: 'MPSC & UPPSC',
  ssc: 'SSC, IBPS & CTET', gate: 'GATE', cat: 'CAT', upsc: 'UPSC CSE',
  bpsc: 'BPSC', tnpsc: 'TNPSC', rrb: 'RRB & NTPC', nda: 'NDA, CDS & AFCAT',
  pass: 'Passport', visa: 'US Visa',
}

// Small, stable, non-crypto hash (djb2) → base36. Deterministic across runs and
// machines, so committed keys stay reproducible.
export function hash(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0
  return h.toString(36)
}

// ── Per-page facts (the ONLY inputs the model is allowed to write prose about) ──
export const examFacts = (p) => ({
  kind: 'exam', label: EXAM_KW[p.id] || p.name, presetName: p.name,
  dims: `${p.w}×${p.h} px`, kb: `${p.min}–${p.max} KB`, fmt: 'JPEG', bg: 'white',
})
export const sellFacts = (m) => ({
  kind: 'sell', name: m.name,
  dims: `${m.w}×${m.h} px`, maxKb: m.max, note: m.note, bg: 'pure white',
})
export const kbUses = (kb) => EXAMS.filter(p => kb >= p.min && kb <= p.max).map(p => p.id)
export const kbFacts = (kb) => ({ kind: 'kb', kb, uses: kbUses(kb) })
export const sigFacts = () => ({
  kind: 'sig',
  exams: EXAMS.filter(p => p.sig).map(p => ({ id: p.id, w: p.sig.w, h: p.sig.h, min: p.sig.min, max: p.sig.max })),
})

// ── Cache keys (facts hash embedded → spec change ⇒ auto-regenerate that page) ──
export const examKey = (p)  => `exam:${p.id}:${hash(JSON.stringify(examFacts(p)))}`
export const sellKey = (m)  => `sell:${m.id}:${hash(JSON.stringify(sellFacts(m)))}`
export const kbKey   = (kb) => `kb:${kb}:${hash(JSON.stringify(kbFacts(kb)))}`
export const sigKey  = ()   => `sig:all:${hash(JSON.stringify(sigFacts()))}`

// Every page the cache should hold, as { key, type, facts }. gen-copy iterates
// this to fill the cache; gen-seo looks up individual keys with the *Key helpers.
export function allDescriptors() {
  const out = []
  for (const p of EXAMS)              out.push({ key: examKey(p),  type: 'exam', facts: examFacts(p) })
  for (const m of MARKETPLACE_PRESETS) out.push({ key: sellKey(m), type: 'sell', facts: sellFacts(m) })
  for (const kb of KB_TARGETS)         out.push({ key: kbKey(kb),  type: 'kb',   facts: kbFacts(kb) })
  out.push({ key: sigKey(), type: 'sig', facts: sigFacts() })
  return out
}

// Numbers the model is allowed to mention for a page (used to reject hallucinated
// specs). Any px / KB / MB / W×H token in the prose that isn't in this set → the
// answer is dropped and the page falls back to its template copy.
export function allowedNumbers(facts) {
  const nums = new Set()
  const add = (v) => { if (v != null) nums.add(String(v)) }
  if (facts.kind === 'exam') {
    const [w, h] = facts.dims.split('×'); add(parseInt(w)); add(parseInt(h))
    const [mn, mx] = facts.kb.replace(' KB', '').split('–'); add(parseInt(mn)); add(parseInt(mx))
  } else if (facts.kind === 'sell') {
    const [w, h] = facts.dims.split('×'); add(parseInt(w)); add(parseInt(h))
    add(facts.maxKb); add(Math.round(facts.maxKb / 1000))
  } else if (facts.kind === 'kb') {
    add(facts.kb)
  } else if (facts.kind === 'sig') {
    for (const e of facts.exams) { add(e.w); add(e.h); add(e.min); add(e.max) }
  }
  return nums
}
