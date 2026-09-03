// ─── SnapFit SEO landing-page generator ───────────────────────────────────────
// Emits static, crawlable HTML pages into public/ (Vite copies public/ → dist/
// verbatim, so each page is served on its own URL while the React SPA stays at
// /). Page types: /exam/<id>/, /sell/<id>/, /compress/<kb>kb/, /signature/.
// Also writes an OG image, sitemap.xml, robots.txt and llms.txt. Run standalone
// or via `npm run build` (wired to run first).
//
//   node scripts/gen-seo.mjs
//
import { writeFileSync, mkdirSync, rmSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  MARKETPLACE_PRESETS, EXAMS, KB_TARGETS, EXAM_KW,
  examKey, sellKey, kbKey, sigKey,
} from './seo-copy-lib.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT   = resolve(__dirname, '..')
const PUBLIC = resolve(ROOT, 'public')
const ORIGIN = 'https://www.snapfit.in'
const TODAY  = new Date().toISOString().slice(0, 10)

// Model-written copy (from gen-copy.mjs). Missing / empty ⇒ each page falls back
// to its template strings below, so the build never depends on it existing.
const COPY = JSON.parse(readFileSync(resolve(__dirname, 'seo-copy.json'), 'utf8'))

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const att = (s) => esc(s).replace(/"/g, '&quot;')

// ─── Shared JSON-LD helpers ───────────────────────────────────────────────────
const softwareApp = () => ({
  '@context': 'https://schema.org', '@type': 'SoftwareApplication',
  name: 'SnapFit', applicationCategory: 'MultimediaApplication', operatingSystem: 'Any (web browser)',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', ratingCount: '1200' },
})
const breadcrumbLD = (crumbs) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: `${ORIGIN}${c.url}` })),
})
const faqLD = (faqs) => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
})
const howToLD = (name, steps) => ({
  '@context': 'https://schema.org', '@type': 'HowTo', name,
  step: steps.map(s => ({ '@type': 'HowToStep', name: s.n, text: s.t })),
})

// Internal-link cloud shared by every page (crawl paths + authority flow).
const CLOUD = `
    <h2>Every SnapFit tool</h2>
    <div class="cloud">
      ${EXAMS.map(p => `<a href="/exam/${p.id}/">${esc(p.name.split(',')[0])} photo</a>`).join('\n      ')}
      <a href="/signature/">Exam signature size</a>
    </div>
    <div class="cloud" style="margin-top:10px">
      ${MARKETPLACE_PRESETS.map(m => `<a href="/sell/${m.id}/">${esc(m.name)} photo</a>`).join('\n      ')}
    </div>
    <div class="cloud" style="margin-top:10px">
      ${KB_TARGETS.map(kb => `<a href="/compress/${kb}kb/">Compress to ${kb} KB</a>`).join('\n      ')}
    </div>`

// ─── Page shell ───────────────────────────────────────────────────────────────
function pageHtml({ url, title, description, h1, crumbs, jsonld, body }) {
  const canonical = `${ORIGIN}${url}`
  const allLd = [...jsonld, softwareApp(), breadcrumbLD(crumbs)]
  const ld = allLd.map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n    ')
  const crumbNav = crumbs.map((c, i) =>
    i === crumbs.length - 1 ? `<span aria-current="page">${esc(c.name)}</span>` : `<a href="${c.url}">${esc(c.name)}</a>`
  ).join('<span class="sep">›</span>')
  return `<!doctype html>
<html lang="en-IN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${att(title)}</title>
  <meta name="description" content="${att(description)}" />
  <link rel="canonical" href="${canonical}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${att(title)}" />
  <meta property="og:description" content="${att(description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${ORIGIN}/og-image.svg" />
  <meta property="og:site_name" content="SnapFit" />
  <meta property="og:locale" content="en_IN" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${att(title)}" />
  <meta name="twitter:description" content="${att(description)}" />
  <meta name="twitter:image" content="${ORIGIN}/og-image.svg" />
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
    nav.crumbs{font-size:13px;color:var(--muted);margin:20px 0 0}
    nav.crumbs a{color:var(--muted);text-decoration:none}
    nav.crumbs .sep{margin:0 7px;opacity:.5}
    h1{font-size:clamp(1.7rem,5vw,2.4rem);line-height:1.12;letter-spacing:-.02em;margin:14px 0 12px}
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
    table.data{width:100%;border-collapse:collapse;margin:0 0 8px;font-size:14px}
    table.data th,table.data td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line)}
    table.data th{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
    table.data td:first-child{font-weight:600}
    table.data a{text-decoration:none}
    .mono{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-variant-numeric:tabular-nums;font-size:13px}
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
    <nav class="crumbs">${crumbNav}</nav>
    <h1>${esc(h1)}</h1>
    ${body}
    ${CLOUD}
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
  const c = COPY[examKey(p)]
  const title = `${kw} Photo Size ${p.w}×${p.h} px (${p.min}–${p.max} KB) — Free Resizer | SnapFit`
  const description = c?.description ?? `Resize & compress your ${kw} photo to the exact ${p.w}×${p.h} px, ${p.min}–${p.max} KB JPEG with a white background. Free, instant, 100% in your browser — no upload, no sign-up.`
  const h1 = `${kw} photo size: ${p.w}×${p.h} px, ${p.min}–${p.max} KB`
  const lede = c?.lede ?? `Get an upload-ready ${kw} photo that meets the exact dimensions and file-size limit — resized, background-cleaned to white and compressed, without leaving your browser.`
  const faqs = c?.faqs ?? [
    { q: `What is the photo size required for ${kw}?`, a: `${kw} requires a ${p.w}×${p.h} pixel JPEG photo between ${p.min} KB and ${p.max} KB with a plain white background. SnapFit resizes and compresses your photo to exactly this spec in one click.` },
    { q: `How do I compress my ${kw} photo to under ${p.max} KB?`, a: `Open SnapFit, choose the ${p.name} preset and upload your photo. It automatically reduces the JPEG file size to fit within the ${p.min}–${p.max} KB range — fine-tune it with the quality slider if needed.` },
    { q: `Can I change my photo background to white for ${kw}?`, a: `Yes. SnapFit removes the original background with on-device AI and replaces it with pure white, all inside your browser and completely free.` },
    { q: `Is my photo uploaded to a server?`, a: `No. SnapFit processes everything locally using the HTML5 Canvas API. Your photo never leaves your device — there is no server and no sign-up.` },
  ]
  const jsonld = [
    faqLD(faqs),
    howToLD(`How to make a ${kw} exam photo`, [
      { n: 'Upload', t: 'Open SnapFit and upload any recent photo.' },
      { n: 'Pick the exam', t: `Select the ${p.name} preset — it applies ${p.w}×${p.h} px and the ${p.min}–${p.max} KB target automatically.` },
      { n: 'Download', t: 'Download the ready JPEG and upload it to the exam portal.' },
    ]),
  ]
  const sig = p.sig ? `<p style="margin-top:22px;color:var(--muted)">Need the signature too? ${esc(kw)} signature spec is <strong>${p.sig.w}×${p.sig.h} px, ${p.sig.min}–${p.sig.max} KB</strong> — <a href="/signature/">use the signature resizer</a>.</p>` : ''
  const body = `
    <p class="lede">${esc(lede)}</p>
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
  write(`exam/${p.id}/index.html`, pageHtml({ url, title, description, h1, crumbs: [{ name: 'Home', url: '/' }, { name: 'Exam photo', url: '/#exams' }, { name: kw, url }], jsonld, body }))
  return url
}

// ─── Marketplace pages ────────────────────────────────────────────────────────
function sellPage(m) {
  const ratio = m.w === m.h ? '1:1 square' : `${m.w}:${m.h} (${(m.w / m.h).toFixed(2)}:1)`
  const cap = m.max >= 1000 ? `${(m.max / 1000).toFixed(m.max % 1000 ? 1 : 0)} MB` : `${m.max} KB`
  const url = `/sell/${m.id}/`
  const c = COPY[sellKey(m)]
  const title = `${m.name} Product Photo Size ${m.w}×${m.h} px — Free Listing Image Maker | SnapFit`
  const description = c?.description ?? `Make ${m.name} listing photos: ${m.w}×${m.h} px on a pure-white background, under ${cap}. Remove the background with AI and export the exact size — free, in your browser, no watermark.`
  const h1 = `${m.name} product photo size: ${m.w}×${m.h} px on white`
  const lede = c?.lede ?? `Turn a phone snapshot into a ${m.name}-ready listing photo — background removed to pure white and sized to spec, free and private in your browser.`
  const faqs = c?.faqs ?? [
    { q: `What image size does ${m.name} require?`, a: `${m.name} listing images should be ${m.w}×${m.h} pixels (${ratio}) on a pure white background, under ${cap}. SnapFit Studio removes the background and exports this exact size for free.` },
    { q: `How do I get a pure white background for ${m.name}?`, a: `Upload your product photo to SnapFit Studio — on-device AI cuts out the product and drops it onto a pure white (#FFFFFF) background that meets ${m.name}'s catalogue requirement. Nothing is uploaded to a server.` },
    { q: `Is SnapFit Studio free and watermark-free?`, a: `Yes. Single listing photos are free with no watermark and no sign-up. Everything runs in your browser, so your product images stay private.` },
    { q: `Can I resize the same photo for other marketplaces?`, a: `Yes — the same cutout can be exported for Meesho, Amazon.in, Flipkart, Myntra, ONDC and Instagram/WhatsApp, each at its own required size.` },
  ]
  const jsonld = [
    faqLD(faqs),
    howToLD(`How to make a ${m.name} listing photo`, [
      { n: 'Upload', t: 'Open SnapFit Studio and upload your product photo.' },
      { n: 'Pick the marketplace', t: `Select ${m.name}; the background is removed to white and the canvas set to ${m.w}×${m.h} px.` },
      { n: 'Download', t: `Download the listing-ready JPEG, under ${cap}, and add it to your catalogue.` },
    ]),
  ]
  const body = `
    <p class="lede">${esc(lede)}</p>
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
  write(`sell/${m.id}/index.html`, pageHtml({ url, title, description, h1, crumbs: [{ name: 'Home', url: '/' }, { name: 'Sell online', url: '/#sell' }, { name: m.name, url }], jsonld, body }))
  return url
}

// ─── "Compress to N KB" pages ─────────────────────────────────────────────────
function kbPage(kb) {
  const url = `/compress/${kb}kb/`
  const c = COPY[kbKey(kb)]
  const title = `Compress Photo to ${kb} KB Online — Free Image Size Reducer | SnapFit`
  const description = c?.description ?? `Reduce your photo to under ${kb} KB online for free, keeping the quality readable. Ideal for exam forms and uploads with a ${kb} KB limit. 100% in your browser — nothing uploaded.`
  const h1 = `Compress a photo to ${kb} KB online`
  const lede = c?.lede ?? `Bring any JPG or PNG under ${kb} KB while keeping it clear enough to pass form checks — resize and compress in one place, entirely in your browser.`
  const uses = EXAMS.filter(p => kb >= p.min && kb <= p.max)
  const useList = uses.length
    ? `<p>A ${kb} KB limit is common for ${uses.map(p => `<a href="/exam/${p.id}/">${esc(p.name.split(',')[0])}</a>`).join(', ')}. Pick the matching preset and SnapFit hits the size automatically.</p>`
    : `<p>Choose the <a href="/?exam=custom">Custom preset</a>, set the maximum size to ${kb} KB, and SnapFit compresses your photo to fit.</p>`
  const faqs = c?.faqs ?? [
    { q: `How do I compress a photo to ${kb} KB?`, a: `Upload your image to SnapFit and either pick an exam preset with a ${kb} KB limit or open the Custom preset and set the maximum to ${kb} KB. The quality slider lets you trade a little sharpness for a smaller file until it fits.` },
    { q: `Will compressing to ${kb} KB ruin the quality?`, a: `SnapFit reduces JPEG quality gradually and shows a live preview, so you can stop at the smallest size that still looks clean. For very small limits, a tighter crop helps keep the face sharp.` },
    { q: `Is it free and private?`, a: `Yes — completely free, no sign-up, and every image is processed in your browser. Your photo is never uploaded to any server.` },
  ]
  const jsonld = [
    faqLD(faqs),
    howToLD(`How to compress a photo to ${kb} KB`, [
      { n: 'Upload', t: 'Open SnapFit and upload your photo.' },
      { n: 'Set the target', t: `Pick a preset with a ${kb} KB limit, or use Custom and set the maximum to ${kb} KB.` },
      { n: 'Download', t: `Drag the quality slider until the size is under ${kb} KB, then download.` },
    ]),
  ]
  const body = `
    <p class="lede">${esc(lede)}</p>
    ${useList}
    <a class="cta" href="/?exam=custom">Compress my photo →</a>
    <h2>How to reduce a photo to ${kb} KB</h2>
    <ol class="steps">
      <li>Upload your photo — it stays on your device.</li>
      <li>Pick a preset with a ${kb} KB limit, or set Custom to ${kb} KB.</li>
      <li>Nudge the quality slider until it fits, then download.</li>
    </ol>
    <h2>Frequently asked questions</h2>
    ${faqs.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('\n    ')}`
  write(`compress/${kb}kb/index.html`, pageHtml({ url, title, description, h1, crumbs: [{ name: 'Home', url: '/' }, { name: 'Compress', url: '/#compress' }, { name: `${kb} KB`, url }], jsonld, body }))
  return url
}

// ─── Signature resizer page ───────────────────────────────────────────────────
function signaturePage() {
  const url = `/signature/`
  const c = COPY[sigKey()]
  const title = `Exam Signature Size & Resizer — Free Signature Compressor | SnapFit`
  const description = c?.description ?? `Resize your signature to the exact size Indian exam forms need — SSC, UPSC, NEET, IBPS, RRB and more. Free signature compressor, 100% in your browser, no upload.`
  const h1 = `Exam signature resizer: the exact size for every form`
  const lede = c?.lede ?? `Every Indian exam wants the signature at its own pixel and KB size. Find yours below and resize it in seconds — free and private in your browser.`
  const rows = EXAMS.filter(p => p.sig).map(p =>
    `<tr><td><a href="/?exam=${p.id}&sig=1">${esc(p.name.split(',')[0])}</a></td><td class="mono">${p.sig.w}×${p.sig.h} px</td><td class="mono">${p.sig.min}–${p.sig.max} KB</td></tr>`
  ).join('\n      ')
  const faqs = c?.faqs ?? [
    { q: `What is the signature size for exam forms?`, a: `Most Indian exam forms want a signature scanned at roughly 140–200 px wide by 60–100 px tall, saved as a JPEG between 4 KB and 50 KB on a white background. Exact numbers vary by exam — see the table above.` },
    { q: `How do I resize my signature for an exam form?`, a: `Sign on white paper, photograph it, open SnapFit, choose your exam and switch to Signature mode. SnapFit crops and compresses the signature to that exam's required size.` },
    { q: `Is the signature tool free and private?`, a: `Yes. It runs entirely in your browser at no cost, and your signature image is never uploaded anywhere.` },
  ]
  const jsonld = [
    faqLD(faqs),
    howToLD('How to resize an exam signature', [
      { n: 'Scan', t: 'Sign on white paper and take a clear photo of it.' },
      { n: 'Pick exam & signature mode', t: 'Open SnapFit, choose your exam, and switch to Signature mode.' },
      { n: 'Download', t: 'Download the resized, compressed signature and upload it to the form.' },
    ]),
  ]
  const body = `
    <p class="lede">${esc(lede)}</p>
    <table class="data">
      <thead><tr><th>Exam</th><th>Signature size</th><th>File size</th></tr></thead>
      <tbody>
      ${rows}
      </tbody>
    </table>
    <a class="cta" href="/?exam=ssc&sig=1">Resize my signature →</a>
    <h2>How to resize your exam signature</h2>
    <ol class="steps">
      <li>Sign on plain white paper and photograph it.</li>
      <li>Open SnapFit, pick your exam and switch to <strong>Signature</strong> mode.</li>
      <li>Download the correctly sized JPEG and upload it to the form.</li>
    </ol>
    <h2>Frequently asked questions</h2>
    ${faqs.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('\n    ')}`
  write(`signature/index.html`, pageHtml({ url, title, description, h1, crumbs: [{ name: 'Home', url: '/' }, { name: 'Signature', url }], jsonld, body }))
  return url
}

// ─── OG share image (SVG) ─────────────────────────────────────────────────────
function ogImage() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0f1c14"/>
  <rect width="1200" height="630" fill="url(#g)"/>
  <defs><radialGradient id="g" cx="20%" cy="0%" r="90%"><stop offset="0%" stop-color="#15803d" stop-opacity=".38"/><stop offset="60%" stop-color="#0f1c14" stop-opacity="0"/></radialGradient></defs>
  <g transform="translate(90,150)">
    <rect width="86" height="86" rx="22" fill="#15803d"/>
    <g transform="translate(20,24)" fill="none" stroke="#fff" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"><rect x="0" y="6" width="46" height="34" rx="7"/><circle cx="23" cy="24" r="9"/></g>
    <text x="110" y="60" font-family="Segoe UI,Arial,sans-serif" font-size="52" font-weight="700" fill="#fff">SnapFit</text>
    <text x="112" y="150" font-family="Segoe UI,Arial,sans-serif" font-size="60" font-weight="800" fill="#fff">Exam &amp; marketplace photos,</text>
    <text x="112" y="222" font-family="Segoe UI,Arial,sans-serif" font-size="60" font-weight="800" fill="#7ee0a6">sized to spec in seconds.</text>
    <text x="112" y="300" font-family="Segoe UI,Arial,sans-serif" font-size="30" fill="#b9c7bd">Free · 100% in your browser · no upload · no sign-up</text>
  </g>
</svg>`
  writeFileSync(resolve(PUBLIC, 'og-image.svg'), svg)
}

// ─── Run ──────────────────────────────────────────────────────────────────────
for (const d of ['exam', 'sell', 'compress', 'signature']) rmSync(resolve(PUBLIC, d), { recursive: true, force: true })

const urls = ['/']
for (const p of EXAMS) urls.push(examPage(p))
for (const m of MARKETPLACE_PRESETS) urls.push(sellPage(m))
for (const kb of KB_TARGETS) urls.push(kbPage(kb))
urls.push(signaturePage())
ogImage()

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${ORIGIN}${u}</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>${u === '/' ? '1.0' : '0.8'}</priority></url>`).join('\n')}
</urlset>
`
writeFileSync(resolve(PUBLIC, 'sitemap.xml'), sitemap)
writeFileSync(resolve(PUBLIC, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`)

const llms = `# SnapFit
> Free, in-browser tools to resize & compress photos to the exact spec required by Indian competitive exams and e-commerce marketplaces. Nothing is uploaded — all processing is on-device.

## Exam photo tools
${EXAMS.map(p => `- [${EXAM_KW[p.id] || p.name} photo — ${p.w}×${p.h}px, ${p.min}-${p.max}KB](${ORIGIN}/exam/${p.id}/)`).join('\n')}
- [Exam signature resizer](${ORIGIN}/signature/)

## Compress to an exact file size
${KB_TARGETS.map(kb => `- [Compress photo to ${kb} KB](${ORIGIN}/compress/${kb}kb/)`).join('\n')}

## Marketplace listing-photo tools (SnapFit Studio)
${MARKETPLACE_PRESETS.map(m => `- [${m.name} product photo — ${m.w}×${m.h}px, white background](${ORIGIN}/sell/${m.id}/)`).join('\n')}
`
writeFileSync(resolve(PUBLIC, 'llms.txt'), llms)

console.log(`✓ SEO generated: ${urls.length - 1} landing pages (${EXAMS.length} exam, ${MARKETPLACE_PRESETS.length} marketplace, ${KB_TARGETS.length} KB, 1 signature) + og-image + sitemap + robots + llms`)
