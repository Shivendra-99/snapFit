// ─── SnapFit SEO landing-page generator ───────────────────────────────────────
// Emits one static, crawlable HTML page per exam preset and per marketplace into
// public/ (Vite copies public/ → dist/ verbatim, so each page is served on its
// own URL while the React SPA stays at /). Also writes sitemap.xml, robots.txt
// and llms.txt. Run standalone or via `npm run build` (wired to run first).
//
//   node scripts/gen-seo.mjs
//
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PRESETS, MARKETPLACE_PRESETS } from '../src/presets.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT   = resolve(__dirname, '..')
const PUBLIC = resolve(ROOT, 'public')
const ORIGIN = 'https://www.snapfit.in'
const TODAY  = new Date().toISOString().slice(0, 10)

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const att = (s) => esc(s).replace(/"/g, '&quot;')

// Friendlier keyword labels for exam page titles/H1s.
const EXAM_KW = {
  neet: 'NEET, JEE Main & CUET', ugcnet: 'UGC NET', mpsc: 'MPSC & UPPSC',
  ssc: 'SSC, IBPS & CTET', gate: 'GATE', cat: 'CAT', upsc: 'UPSC CSE',
  bpsc: 'BPSC', tnpsc: 'TNPSC', rrb: 'RRB & NTPC', nda: 'NDA, CDS & AFCAT',
  pass: 'Passport', visa: 'US Visa',
}

// ─── Shared page shell ────────────────────────────────────────────────────────
function page({ url, title, description, h1, jsonld, body }) {
  const canonical = `${ORIGIN}${url}`
  const ld = jsonld.map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n    ')
  return `<!doctype html>
<html lang="en-IN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${att(title)}</title>
  <meta name="description" content="${att(description)}" />
  <link rel="canonical" href="${canonical}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${att(title)}" />
  <meta property="og:description" content="${att(description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:site_name" content="SnapFit" />
  <meta property="og:locale" content="en_IN" />
  <meta name="theme-color" content="#15803d" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  ${ld}
  <style>
    :root{--bg:#f6f8f4;--surface:#fff;--ink:#16211b;--muted:#535e56;--line:#e0e6dd;--green:#15803d;--tint:#e4f2e8}
    @media(prefers-color-scheme:dark){:root{--bg:#10140f;--surface:#171d15;--ink:#edf2e9;--muted:#a4aea1;--line:#2a3326;--green:#3cc17c;--tint:rgba(60,193,124,.12)}}
    *{box-sizing:border-box}
    body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
    a{color:var(--green)}
    .wrap{max-width:760px;margin:0 auto;padding:0 20px}
    header{padding:18px 0;border-bottom:1px solid var(--line)}
    .brand{display:inline-flex;align-items:center;gap:9px;text-decoration:none;color:var(--ink);font-weight:700}
    .brand .logo{width:30px;height:30px;border-radius:8px;background:var(--green);display:grid;place-items:center;color:#fff;font-size:16px}
    h1{font-size:clamp(1.7rem,5vw,2.4rem);line-height:1.12;letter-spacing:-.02em;margin:34px 0 12px}
    .lede{font-size:1.1rem;color:var(--muted);margin:0 0 24px}
    .spec{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:14px;overflow:hidden;margin:0 0 26px}
    .spec div{background:var(--surface);padding:14px 16px}
    .spec .k{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);font-weight:600}
    .spec .v{font-size:1.15rem;font-weight:700;margin-top:4px;font-variant-numeric:tabular-nums}
    .cta{display:inline-flex;align-items:center;gap:9px;background:var(--green);color:#fff;text-decoration:none;font-weight:700;font-size:1.05rem;padding:15px 26px;border-radius:13px;box-shadow:0 10px 24px -8px rgba(21,128,61,.5)}
    h2{font-size:1.35rem;margin:38px 0 14px}
    ol.steps{padding-left:0;list-style:none;counter-reset:s;display:grid;gap:12px}
    ol.steps li{counter-increment:s;padding-left:44px;position:relative}
    ol.steps li::before{content:counter(s);position:absolute;left:0;top:-2px;width:30px;height:30px;border-radius:9px;background:var(--tint);color:var(--green);font-weight:800;display:grid;place-items:center}
    details{border:1px solid var(--line);border-radius:12px;padding:2px 16px;margin-bottom:10px;background:var(--surface)}
    summary{font-weight:600;padding:14px 0;cursor:pointer}
    details p{margin:0 0 14px;color:var(--muted)}
    .cloud{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 0}
    .cloud a{font-size:13px;text-decoration:none;background:var(--surface);border:1px solid var(--line);border-radius:99px;padding:6px 13px;color:var(--muted)}
    footer{border-top:1px solid var(--line);margin-top:44px;padding:24px 0 60px;font-size:12.5px;color:var(--muted)}
  </style>
</head>
<body>
  <header><div class="wrap"><a class="brand" href="/"><span class="logo">◈</span> SnapFit</a></div></header>
  <main class="wrap">
    <h1>${esc(h1)}</h1>
    ${body}
    <h2>Related tools</h2>
    <div class="cloud">
      ${PRESETS.filter(p => p.id !== 'custom').map(p => `<a href="/exam/${p.id}/">${esc(p.name.split(',')[0])} photo</a>`).join('\n      ')}
    </div>
    <div class="cloud" style="margin-top:10px">
      ${MARKETPLACE_PRESETS.map(m => `<a href="/sell/${m.id}/">${esc(m.name)} photo</a>`).join('\n      ')}
    </div>
  </main>
  <footer class="wrap">
    Photos are processed entirely in your browser — nothing is uploaded. Specifications are illustrative and can change; always confirm the exact requirement in the official notification before you submit. Not affiliated with any examination body or marketplace.
    · <a href="/">SnapFit home</a>
  </footer>
</body>
</html>`
}

const write = (rel, html) => {
  const file = resolve(PUBLIC, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, html)
}

// ─── Exam pages ───────────────────────────────────────────────────────────────
function examPage(p) {
  const kw = EXAM_KW[p.id] || p.name
  const url = `/exam/${p.id}/`
  const title = `${kw} Photo Size ${p.w}×${p.h} px (${p.min}–${p.max} KB) — Free Resizer | SnapFit`
  const description = `Resize & compress your ${kw} photo to the exact ${p.w}×${p.h} px, ${p.min}–${p.max} KB JPEG with a white background. Free, instant, 100% in your browser — no upload, no sign-up.`
  const h1 = `${kw} photo size: ${p.w}×${p.h} px, ${p.min}–${p.max} KB`
  const faqs = [
    { q: `What is the photo size required for ${kw}?`, a: `${kw} requires a ${p.w}×${p.h} pixel JPEG photo between ${p.min} KB and ${p.max} KB with a plain white background. SnapFit resizes and compresses your photo to exactly this spec in one click.` },
    { q: `How do I compress my ${kw} photo to under ${p.max} KB?`, a: `Open SnapFit, choose the ${p.name} preset and upload your photo. It automatically reduces the JPEG file size to fit within the ${p.min}–${p.max} KB range — you can fine-tune it with the quality slider if needed.` },
    { q: `Can I change my photo background to white for ${kw}?`, a: `Yes. SnapFit removes the original background with on-device AI and replaces it with pure white, all inside your browser and completely free.` },
    { q: `Is my photo uploaded to a server?`, a: `No. SnapFit processes everything locally using the HTML5 Canvas API. Your photo never leaves your device — there is no server and no sign-up.` },
  ]
  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    { '@context': 'https://schema.org', '@type': 'HowTo', name: `How to make a ${kw} exam photo`, step: [
      { '@type': 'HowToStep', name: 'Upload', text: 'Open SnapFit and upload any recent photo.' },
      { '@type': 'HowToStep', name: 'Pick the exam', text: `Select the ${p.name} preset — it applies ${p.w}×${p.h} px and the ${p.min}–${p.max} KB target automatically.` },
      { '@type': 'HowToStep', name: 'Download', text: 'Download the ready JPEG and upload it to the exam portal.' },
    ] },
  ]
  const sig = p.sig ? `<p style="margin-top:22px;color:var(--muted)">Signature spec for ${esc(kw)}: <strong>${p.sig.w}×${p.sig.h} px, ${p.sig.min}–${p.sig.max} KB</strong>.</p>` : ''
  const body = `
    <p class="lede">Get an upload-ready ${esc(kw)} photo that meets the exact dimensions and file-size limit — resized, background-cleaned to white and compressed, without leaving your browser.</p>
    <div class="spec">
      <div><div class="k">Dimensions</div><div class="v">${p.w}×${p.h} px</div></div>
      <div><div class="k">File size</div><div class="v">${p.min}–${p.max} KB</div></div>
      <div><div class="k">Format</div><div class="v">JPEG</div></div>
      <div><div class="k">Background</div><div class="v">White</div></div>
    </div>
    <a class="cta" href="/?exam=${p.id}">Make my ${esc(kw.split(',')[0])} photo →</a>
    ${sig}
    <h2>How to resize your ${esc(kw)} photo</h2>
    <ol class="steps">
      <li>Upload any recent photo — it stays on your device.</li>
      <li>Pick the <strong>${esc(p.name)}</strong> preset; SnapFit crops to ${p.w}×${p.h} px and targets ${p.min}–${p.max} KB.</li>
      <li>Download the exam-ready JPEG and submit it.</li>
    </ol>
    <h2>Frequently asked questions</h2>
    ${faqs.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('\n    ')}`
  write(`exam/${p.id}/index.html`, page({ url, title, description, h1, jsonld, body }))
  return url
}

// ─── Marketplace pages ────────────────────────────────────────────────────────
function sellPage(m) {
  const ratio = m.w === m.h ? '1:1 square' : `${m.w}:${m.h} (${(m.w / m.h).toFixed(2)}:1)`
  const cap = m.max >= 1000 ? `${(m.max / 1000).toFixed(m.max % 1000 ? 1 : 0)} MB` : `${m.max} KB`
  const url = `/sell/${m.id}/`
  const title = `${m.name} Product Photo Size ${m.w}×${m.h} px — Free Listing Image Maker | SnapFit`
  const description = `Make ${m.name} listing photos: ${m.w}×${m.h} px on a pure-white background, under ${cap}. Remove the background with AI and export the exact size — free, in your browser, no watermark.`
  const h1 = `${m.name} product photo size: ${m.w}×${m.h} px on white`
  const faqs = [
    { q: `What image size does ${m.name} require?`, a: `${m.name} listing images should be ${m.w}×${m.h} pixels (${ratio}) on a pure white background, under ${cap}. SnapFit Studio removes the background and exports this exact size for free.` },
    { q: `How do I get a pure white background for ${m.name}?`, a: `Upload your product photo to SnapFit Studio — on-device AI cuts out the product and drops it onto a pure white (#FFFFFF) background that meets ${m.name}'s catalogue requirement. Nothing is uploaded to a server.` },
    { q: `Is SnapFit Studio free and watermark-free?`, a: `Yes. Single listing photos are free with no watermark and no sign-up. Everything runs in your browser, so your product images stay private.` },
    { q: `Can I resize the same photo for other marketplaces?`, a: `Yes — the same cutout can be exported for Meesho, Amazon.in, Flipkart, Myntra, ONDC and Instagram/WhatsApp, each at its own required size.` },
  ]
  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    { '@context': 'https://schema.org', '@type': 'HowTo', name: `How to make a ${m.name} listing photo`, step: [
      { '@type': 'HowToStep', name: 'Upload', text: 'Open SnapFit Studio and upload your product photo.' },
      { '@type': 'HowToStep', name: 'Pick the marketplace', text: `Select ${m.name}; the background is removed to white and the canvas set to ${m.w}×${m.h} px.` },
      { '@type': 'HowToStep', name: 'Download', text: `Download the listing-ready JPEG, under ${cap}, and add it to your catalogue.` },
    ] },
  ]
  const body = `
    <p class="lede">Turn a phone snapshot into a ${esc(m.name)}-ready listing photo — background removed to pure white and sized to spec, free and private in your browser.</p>
    <div class="spec">
      <div><div class="k">Dimensions</div><div class="v">${m.w}×${m.h} px</div></div>
      <div><div class="k">Ratio</div><div class="v">${esc(ratio)}</div></div>
      <div><div class="k">Background</div><div class="v">Pure white</div></div>
      <div><div class="k">Max file</div><div class="v">${esc(cap)}</div></div>
    </div>
    <a class="cta" href="/?studio=${m.id}">Make my ${esc(m.name)} photo →</a>
    <h2>How to make a ${esc(m.name)} listing photo</h2>
    <ol class="steps">
      <li>Upload your product photo — it never leaves your device.</li>
      <li>Pick <strong>${esc(m.name)}</strong>; the background is cut to pure white and the canvas set to ${m.w}×${m.h} px.</li>
      <li>Download the listing-ready JPEG under ${esc(cap)} and upload it to your catalogue.</li>
    </ol>
    <h2>Frequently asked questions</h2>
    ${faqs.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('\n    ')}`
  write(`sell/${m.id}/index.html`, page({ url, title, description, h1, jsonld, body }))
  return url
}

// ─── Run ──────────────────────────────────────────────────────────────────────
rmSync(resolve(PUBLIC, 'exam'), { recursive: true, force: true })
rmSync(resolve(PUBLIC, 'sell'), { recursive: true, force: true })

const urls = ['/']
for (const p of PRESETS) if (p.id !== 'custom') urls.push(examPage(p))
for (const m of MARKETPLACE_PRESETS) urls.push(sellPage(m))

// sitemap.xml
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${ORIGIN}${u}</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>${u === '/' ? '1.0' : '0.8'}</priority></url>`).join('\n')}
</urlset>
`
writeFileSync(resolve(PUBLIC, 'sitemap.xml'), sitemap)

// robots.txt
writeFileSync(resolve(PUBLIC, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`)

// llms.txt — helps AI search engines cite the right pages
const llms = `# SnapFit
> Free, in-browser tools to resize & compress photos to the exact spec required by Indian competitive exams and e-commerce marketplaces. Nothing is uploaded — all processing is on-device.

## Exam photo tools
${PRESETS.filter(p => p.id !== 'custom').map(p => `- [${EXAM_KW[p.id] || p.name} photo — ${p.w}×${p.h}px, ${p.min}-${p.max}KB](${ORIGIN}/exam/${p.id}/)`).join('\n')}

## Marketplace listing-photo tools (SnapFit Studio)
${MARKETPLACE_PRESETS.map(m => `- [${m.name} product photo — ${m.w}×${m.h}px, white background](${ORIGIN}/sell/${m.id}/)`).join('\n')}
`
writeFileSync(resolve(PUBLIC, 'llms.txt'), llms)

console.log(`✓ SEO generated: ${urls.length - 1} landing pages + sitemap.xml + robots.txt + llms.txt`)
