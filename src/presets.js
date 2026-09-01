// ─── Preset data (single source of truth) ─────────────────────────────────────
// Imported by the React app (App.jsx) AND the build-time SEO landing-page
// generator (scripts/gen-seo.mjs), so exam/marketplace specs live in exactly
// one place. Pure data — no JSX, no React — so Node can import it directly.

// G = colour group: green | orange | blue | navy | purple
const G = {
  green:  { tint: '#eaf6ee', ink: '#15803d' },
  orange: { tint: '#fdeede', ink: '#c4730e' },
  blue:   { tint: '#e7eefb', ink: '#2f5fc4' },
  navy:   { tint: '#edf4ff', ink: '#1d5fa8' },
  purple: { tint: '#f3f0ff', ink: '#6d28d9' },
}

export const PRESETS = [
  // ── 200×230, 10–200 KB  (NEET / JEE / CUET share identical specs) ────
  { id: 'neet',   name: 'NEET, JEE, CUET',                    abbr: 'NEET+', w: 200, h: 230, bg: '#ffffff', min: 10,  max: 200, ...G.green,  sig: { w: 200, h: 100, min: 4,  max: 30  } },
  // ── 200×230, 10–100 KB ───────────────────────────────────────────────
  { id: 'ugcnet', name: 'UGC NET / SET',                       abbr: 'NET',   w: 200, h: 230, bg: '#ffffff', min: 10,  max: 100, ...G.green,  sig: { w: 200, h: 100, min: 4,  max: 30  } },
  // ── 200×230, 10–50 KB ────────────────────────────────────────────────
  { id: 'mpsc',   name: 'MPSC / UPPSC',                        abbr: 'PSC',   w: 200, h: 230, bg: '#ffffff', min: 10,  max: 50,  ...G.orange, sig: { w: 200, h: 100, min: 10, max: 50  } },
  // ── 200×230, 20–50 KB  (SSC / CTET / Banking share identical specs) ──
  { id: 'ssc',    name: 'SSC, CTET, IBPS, SBI, RBI, LIC',     abbr: 'SSC+',  w: 200, h: 230, bg: '#ffffff', min: 20,  max: 50,  ...G.orange, sig: { w: 200, h: 80,  min: 10, max: 20  } },
  // ── Others – unique dimensions ────────────────────────────────────────
  { id: 'gate',   name: 'GATE',                                abbr: 'GATE',  w: 240, h: 320, bg: '#ffffff', min: 5,   max: 200, ...G.green,  sig: { w: 200, h: 100, min: 4,  max: 200 } },
  { id: 'cat',    name: 'CAT (IIM)',                           abbr: 'CAT',   w: 100, h: 130, bg: '#ffffff', min: 10,  max: 50,  ...G.blue,   sig: { w: 150, h: 75,  min: 10, max: 50  } },
  { id: 'upsc',   name: 'UPSC CSE',                           abbr: 'UPSC',  w: 350, h: 350, bg: '#ffffff', min: 20,  max: 300, ...G.green,  sig: { w: 200, h: 100, min: 10, max: 100 } },
  { id: 'bpsc',   name: 'BPSC',                               abbr: 'BPSC',  w: 215, h: 265, bg: '#ffffff', min: 10,  max: 50,  ...G.orange, sig: { w: 200, h: 100, min: 10, max: 50  } },
  { id: 'tnpsc',  name: 'TNPSC',                              abbr: 'TN',    w: 150, h: 200, bg: '#ffffff', min: 10,  max: 40,  ...G.orange, sig: { w: 200, h: 80,  min: 10, max: 40  } },
  { id: 'rrb',    name: 'RRB / NTPC',                         abbr: 'RRB',   w: 130, h: 160, bg: '#ffffff', min: 15,  max: 40,  ...G.orange, sig: { w: 140, h: 60,  min: 10, max: 40  } },
  // ── 200×240, 10–50 KB  (NDA / CDS / AFCAT near-identical) ───────────
  { id: 'nda',    name: 'NDA, CDS, AFCAT',                    abbr: 'NDA+',  w: 200, h: 240, bg: '#ffffff', min: 10,  max: 50,  ...G.navy,   sig: { w: 200, h: 100, min: 10, max: 50  } },
  // ── ID Documents ─────────────────────────────────────────────────────
  { id: 'pass',   name: 'Passport 35×45',                     abbr: 'PP',    w: 413, h: 531, bg: '#ffffff', min: 20,  max: 100, ...G.orange, sig: { w: 200, h: 100, min: 10, max: 50  } },
  { id: 'visa',   name: 'US Visa 2×2"',                       abbr: 'VISA',  w: 600, h: 600, bg: '#ffffff', min: 100, max: 240, ...G.navy,   sig: { w: 200, h: 100, min: 10, max: 50  } },
  // ── Custom ────────────────────────────────────────────────────────────
  { id: 'custom', name: 'Custom',                              abbr: 'ANY',   w: 200, h: 230, bg: '#ffffff', min: 10,  max: 200, ...G.purple, sig: { w: 200, h: 100, min: 4,  max: 50  } },
]

export const CUSTOM_BASE = PRESETS.find(p => p.id === 'custom')

export const BG_OPTIONS = [
  { hex: '#ffffff', name: 'White' },
  { hex: '#eef3fb', name: 'Off-white' },
  { hex: '#cfe0fb', name: 'Lt blue' },
  { hex: '#2f6fdb', name: 'Blue' },
]

// ─── Marketplace presets (SnapFit Studio) ─────────────────────────────────────
// Product-listing specs for Indian marketplaces. `fit: 'contain'` pads the whole
// product onto the background instead of cover-cropping it like a face photo.
// KB `max` mirrors each platform's file-size cap; specs verified Sept 2026 and
// should always be re-checked against the marketplace's own seller docs.
export const MARKETPLACE_PRESETS = [
  { id: 'amazon', name: 'Amazon.in',            abbr: 'AMZ',  w: 1600, h: 1600, bg: '#ffffff', min: 100, max: 10000, fit: 'contain', ...G.orange, note: 'Pure white · product ≥85% · 1600px enables zoom' },
  { id: 'meesho', name: 'Meesho',               abbr: 'MSHO', w: 1000, h: 1000, bg: '#ffffff', min: 50,  max: 5000,  fit: 'contain', ...G.purple, note: '1:1 square · pure white · under 5 MB' },
  { id: 'flipkart', name: 'Flipkart',           abbr: 'FLIP', w: 1000, h: 1000, bg: '#ffffff', min: 50,  max: 2000,  fit: 'contain', ...G.blue,   note: '1:1 · white / light-grey · under 2 MB' },
  { id: 'myntra', name: 'Myntra',               abbr: 'MYN',  w: 1080, h: 1440, bg: '#ffffff', min: 80,  max: 5000,  fit: 'contain', ...G.orange, note: '3:4 portrait · pure white background' },
  { id: 'ondc',   name: 'ONDC',                 abbr: 'ONDC', w: 1000, h: 1000, bg: '#ffffff', min: 50,  max: 2000,  fit: 'contain', ...G.green,  note: '1:1 · white / neutral background' },
  { id: 'social', name: 'Instagram / WhatsApp', abbr: 'SOCL', w: 1080, h: 1080, bg: '#ffffff', min: 50,  max: 8000,  fit: 'contain', ...G.navy,   note: '1:1 square for shops & catalogs' },
]
