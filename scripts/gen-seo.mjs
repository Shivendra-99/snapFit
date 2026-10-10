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
import { AD_CLIENT, AD_SLOTS } from '../src/adConfig.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT   = resolve(__dirname, '..')
const PUBLIC = resolve(ROOT, 'public')
const ORIGIN = 'https://www.snapfit.in'
const TODAY  = new Date().toISOString().slice(0, 10)

// Model-written copy (from gen-copy.mjs). Missing / empty ⇒ each page falls back
// to its template strings below, so the build never depends on it existing.
const COPY = JSON.parse(readFileSync(resolve(__dirname, 'seo-copy.json'), 'utf8'))

// "Photo resizer to N MB" targets (KB_TARGETS comes from the shared lib).
const MB_TARGETS = [1, 2]

// ID-photo presets carry a placeholder sig spec for the editor, but passport and
// visa forms have no signature upload — keep them out of published signature data.
const NO_SIG = new Set(['pass', 'visa'])

// Published on /about/ and /contact/ (AdSense reviewers expect a real, reachable owner).
const OWNER = 'Shivendra Kumar Sonkar'
const CONTACT_EMAIL = 'shivendrasonkar001@gmail.com'

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const att = (s) => esc(s).replace(/"/g, '&quot;')

// A responsive AdSense display unit — renders nothing until a slot is configured
// in src/adConfig.js (so pages stay clean before AdSense approval).
const adUnit = (slot) => !slot ? '' : `
    <ins class="adsbygoogle" style="display:block;margin:26px 0" data-ad-client="${AD_CLIENT}" data-ad-slot="${slot}" data-ad-format="auto" data-full-width-responsive="true"></ins>
    <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`

// ─── Shared JSON-LD helpers ───────────────────────────────────────────────────
const softwareApp = () => ({
  '@context': 'https://schema.org', '@type': 'SoftwareApplication',
  name: 'SnapFit', applicationCategory: 'MultimediaApplication', operatingSystem: 'Any (web browser)',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
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
      <a href="/photo-resizer/">Photo resizer</a>
      <a href="/photo-resizer-in-pixels/">Resize in pixels &amp; cm</a>
      <a href="/pan-card-photo-resizer/">PAN card photo</a>
      <a href="/signature/">Signature resizer</a>
    </div>
    <div class="cloud" style="margin-top:10px">
      ${EXAMS.map(p => `<a href="/exam/${p.id}/">${esc(p.name.split(',')[0])} photo</a>`).join('\n      ')}
    </div>
    <div class="cloud" style="margin-top:10px">
      ${MARKETPLACE_PRESETS.map(m => `<a href="/sell/${m.id}/">${esc(m.name)} photo</a>`).join('\n      ')}
    </div>
    <div class="cloud" style="margin-top:10px">
      ${KB_TARGETS.map(kb => `<a href="/compress/${kb}kb/">Resize to ${kb} KB</a>`).join('\n      ')}
      ${MB_TARGETS.map(mb => `<a href="/compress/${mb}mb/">Resize to ${mb} MB</a>`).join('\n      ')}
    </div>`

// ─── Page shell ───────────────────────────────────────────────────────────────
// plain = info/legal page: no tool schema, ad unit or tool link cloud.
function pageHtml({ url, title, description, h1, crumbs, jsonld, body, plain = false }) {
  const canonical = `${ORIGIN}${url}`
  const allLd = [...jsonld, ...(plain ? [] : [softwareApp()]), breadcrumbLD(crumbs)]
  const ld = allLd.map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n    ')
  const crumbNav = crumbs.map((c, i) =>
    i === crumbs.length - 1 ? `<span aria-current="page">${esc(c.name)}</span>` : `<a href="${c.url}">${esc(c.name)}</a>`
  ).join('<span class="sep">›</span>')
  return `<!doctype html>
<html lang="en-IN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3576532225137751" crossorigin="anonymous"></script>
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
    main ul{padding-left:20px}
    main ul li{margin:7px 0}
    .foot{display:flex;flex-wrap:wrap;gap:6px 16px;margin-bottom:12px}
    .foot a{color:var(--muted)}
    footer{border-top:1px solid var(--line);margin-top:44px;padding:24px 0 60px;font-size:12.5px;color:var(--muted)}
  </style>
</head>
<body>
  <header><div class="wrap"><a class="brand" href="/"><span class="logo"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="2.5"/><circle cx="12" cy="13" r="3.4"/><path d="M8 6l1.4-2.4h5.2L16 6"/></svg></span> SnapFit</a></div></header>
  <main class="wrap">
    <nav class="crumbs">${crumbNav}</nav>
    <h1>${esc(h1)}</h1>
    ${body}
    ${plain ? '' : adUnit(AD_SLOTS.landing)}
    ${plain ? '' : CLOUD}
  </main>
  <footer class="wrap">
    <nav class="foot">
      <a href="/">Home</a>
      <a href="/exam-photo-size-chart/">Exam photo size chart</a>
      <a href="/about/">About</a>
      <a href="/contact/">Contact</a>
      <a href="/privacy/">Privacy policy</a>
      <a href="/terms/">Terms</a>
    </nav>
    Photos are processed entirely in your browser — nothing is uploaded. Specifications are illustrative and can change; always confirm the exact requirement in the official notification before you submit. Not affiliated with any examination body or marketplace.
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
  const title = `Photo Resizer to ${kb} KB — Free Online Image Size Reducer | SnapFit`
  const description = c?.description ?? `Free online photo resizer to ${kb} KB: reduce any JPG or PNG to under ${kb} KB while keeping it readable. Ideal for exam forms with a ${kb} KB limit. 100% in your browser — nothing uploaded.`
  const h1 = `Photo resizer to ${kb} KB online`
  const lede = c?.lede ?? `Resize and compress any JPG or PNG to under ${kb} KB while keeping it clear enough to pass form checks — a free online photo resizer that runs entirely in your browser.`
  const uses = EXAMS.filter(p => kb >= p.min && kb <= p.max)
  const useList = uses.length
    ? `<p>A ${kb} KB photo falls inside the allowed range for these exams — pick the matching preset and SnapFit hits the size automatically:</p>
    <table class="data">
      <thead><tr><th>Exam</th><th>Photo size</th><th>Allowed file size</th></tr></thead>
      <tbody>
      ${uses.map(p => `<tr><td><a href="/exam/${p.id}/">${esc(EXAM_KW[p.id] || p.name)}</a></td><td class="mono">${p.w}×${p.h} px</td><td class="mono">${p.min}–${p.max} KB</td></tr>`).join('\n      ')}
      </tbody>
    </table>`
    : `<p>Choose the <a href="/?exam=custom">Custom preset</a>, set the maximum size to ${kb} KB, and SnapFit compresses your photo to fit.</p>`
  // Size-specific advice — what actually goes wrong differs a lot between a 10 KB and a 200 KB limit.
  const tip = kb <= 20
    ? `${kb} KB is a tight limit, so every byte counts. Keep the pixel size small — resizing a phone photo down to the form's dimensions does most of the work before any quality is lost. Crop close to the face, and use a plain, evenly lit background: flat areas compress far better in JPEG than a patterned wall or shadows, so a clean white backdrop alone can save several KB.`
    : kb <= 50
    ? `${kb} KB is comfortable for a standard exam photo of around 200×230 px at good quality. If your file is still too big, the original is almost certainly a full-size phone photo — once it is resized to the required pixels, only a light quality reduction is usually needed. Check the minimum as well: many forms that cap the size at ${kb} KB also reject files below 10–20 KB.`
    : `Limits this large usually come with bigger dimensions (UPSC asks for 350×350 px, a passport photo 413×531 px) or are simply an upper bound. Don't upscale a small or blurry photo to fill the space — it gets bigger in KB without getting sharper. Start from the clearest original you have and let SnapFit resize it down to the exact pixels.`
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
    <a class="cta" href="/?exam=custom">Resize my photo to ${kb} KB →</a>
    <h2>How to resize a photo to ${kb} KB</h2>
    <ol class="steps">
      <li>Upload your photo — it stays on your device.</li>
      <li>Pick a preset with a ${kb} KB limit, or set Custom to ${kb} KB.</li>
      <li>Nudge the quality slider until it fits, then download.</li>
    </ol>
    <h2>Getting a clear photo under ${kb} KB</h2>
    <p>${esc(tip)}</p>
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
  const rows = EXAMS.filter(p => p.sig && !NO_SIG.has(p.id)).map(p =>
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

// ─── "Photo resizer to N MB" pages ─────────────────────────────────────────────
function mbPage(mb) {
  const url = `/compress/${mb}mb/`
  const kb = mb * 1024
  const title = `Photo Resizer to ${mb} MB — Reduce Photo Size in MB Online Free | SnapFit`
  const description = `Free online photo resizer to ${mb} MB: reduce a large JPG or PNG to under ${mb} MB (${kb} KB) in your browser. No upload, no sign-up, no watermark.`
  const h1 = `Photo resizer to ${mb} MB online`
  const lede = `Got a photo that's too large? Bring it under ${mb} MB in seconds with a free photo resizer that works entirely in your browser — nothing is uploaded.`
  const faqs = [
    { q: `How do I resize a photo to ${mb} MB?`, a: `Open SnapFit, choose the Custom preset and upload your photo. Set the maximum size to ${kb} KB (${mb} MB) and drag the quality slider until the file fits. The preview updates live so you can stop at the best quality.` },
    { q: `What is ${mb} MB in KB?`, a: `${mb} MB is ${kb} KB (1 MB = 1024 KB). Many upload forms show the limit in MB but check the file in KB, so SnapFit lets you target either.` },
    { q: `Is the photo resizer free and private?`, a: `Yes — it is completely free, needs no account, and processes every image in your browser. Your photo never leaves your device.` },
  ]
  const jsonld = [faqLD(faqs), howToLD(`How to resize a photo to ${mb} MB`, [
    { n: 'Upload', t: 'Open SnapFit and upload your photo.' },
    { n: 'Set the target', t: `Use the Custom preset and set the maximum size to ${kb} KB (${mb} MB).` },
    { n: 'Download', t: `Adjust the quality slider until the size is under ${mb} MB, then download.` },
  ])]
  const body = `
    <p class="lede">${esc(lede)}</p>
    <p>Choose the <a href="/?exam=custom">Custom preset</a>, set the maximum to ${kb} KB, and SnapFit shrinks your photo to fit under ${mb} MB.</p>
    <a class="cta" href="/?exam=custom">Resize my photo to ${mb} MB →</a>
    <h2>How to resize a photo to ${mb} MB</h2>
    <ol class="steps">
      <li>Upload your photo — it stays on your device.</li>
      <li>Open Custom and set the maximum to ${kb} KB (${mb} MB).</li>
      <li>Nudge the quality slider until it fits, then download.</li>
    </ol>
    <h2>Frequently asked questions</h2>
    ${faqs.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('\n    ')}`
  write(`compress/${mb}mb/index.html`, pageHtml({ url, title, description, h1, crumbs: [{ name: 'Home', url: '/' }, { name: 'Photo resizer', url: '/photo-resizer/' }, { name: `${mb} MB`, url }], jsonld, body }))
  return url
}

// ─── Photo-resizer pillar page (head term hub) ─────────────────────────────────
function photoResizerPillarPage() {
  const url = `/photo-resizer/`
  const title = `Free Online Photo Resizer — Resize Photo in KB, MB, Pixels & CM | SnapFit`
  const description = `Free online photo resizer: resize and compress any JPG or PNG to an exact KB, MB, pixel or cm size. No upload, no watermark, no sign-up — 100% in your browser.`
  const h1 = `Free online photo resizer`
  const lede = `Resize any photo to the exact size you need — in KB, MB, pixels or centimetres — for exam forms, ID documents and marketplace listings. Free, private and instant, entirely in your browser.`
  const kbLinks = KB_TARGETS.map(kb => `<a href="/compress/${kb}kb/">Resize to ${kb} KB</a>`).join('\n      ')
  const mbLinks = MB_TARGETS.map(mb => `<a href="/compress/${mb}mb/">Resize to ${mb} MB</a>`).join('\n      ')
  const examLinks = EXAMS.map(p => `<a href="/exam/${p.id}/">${esc(p.name.split(',')[0])} photo</a>`).join('\n      ')
  const faqs = [
    { q: `How do I use a photo resizer?`, a: `Upload your photo, choose a target — an exact pixel size, or a KB/MB file-size limit — and download the result. In SnapFit you pick a preset (or Custom), and it crops, resizes and compresses in one step, all inside your browser.` },
    { q: `Which is the best photo resizer app?`, a: `The best photo resizer is the one that hits your exact requirement without uploading your photo. SnapFit runs entirely in the browser — no app to install, no sign-up, no watermark — and targets precise pixel and KB/MB sizes for Indian exam forms, ID photos and marketplace listings.` },
    { q: `Can I resize a photo to a specific KB or MB size?`, a: `Yes. Set a maximum file size and SnapFit compresses the JPEG until it fits — from small exam limits like 20 KB up to a few MB — while a live preview shows the quality.` },
    { q: `Is the photo resizer free?`, a: `Completely free, with no account and no watermark. Every image is processed on your device, so your photos stay private.` },
    { q: `What image formats can I resize?`, a: `You can resize JPG (JPEG) and PNG images, and export a compressed JPEG that is ready to upload.` },
  ]
  const jsonld = [faqLD(faqs), howToLD('How to resize a photo online', [
    { n: 'Upload', t: 'Open SnapFit and upload any JPG or PNG. It stays on your device.' },
    { n: 'Choose a size', t: 'Pick a preset, or Custom to set exact pixels and a KB/MB limit.' },
    { n: 'Download', t: 'Download the resized, compressed photo, ready to upload.' },
  ])]
  const body = `
    <p class="lede">${esc(lede)}</p>
    <a class="cta" href="/?exam=custom">Open the photo resizer →</a>
    <h2>Resize a photo to a file size</h2>
    <div class="cloud">
      ${kbLinks}
      ${mbLinks}
    </div>
    <h2>Resize by pixels, cm or document</h2>
    <div class="cloud">
      <a href="/photo-resizer-in-pixels/">Resize in pixels &amp; cm</a>
      <a href="/pan-card-photo-resizer/">PAN card photo</a>
      <a href="/signature/">Signature resizer</a>
    </div>
    <h2>Exam photo sizes</h2>
    <div class="cloud">
      ${examLinks}
    </div>
    <h2>How to resize a photo online</h2>
    <ol class="steps">
      <li>Upload any JPG or PNG — it never leaves your device.</li>
      <li>Pick a preset, or Custom to set exact pixels and a KB/MB limit.</li>
      <li>Download the resized, compressed photo.</li>
    </ol>
    <h2>Frequently asked questions</h2>
    ${faqs.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('\n    ')}`
  write(`photo-resizer/index.html`, pageHtml({ url, title, description, h1, crumbs: [{ name: 'Home', url: '/' }, { name: 'Photo resizer', url }], jsonld, body }))
  return url
}

// ─── PAN card photo resizer ────────────────────────────────────────────────────
function panCardPage() {
  const url = `/pan-card-photo-resizer/`
  const title = `PAN Card Photo Resizer — Resize PAN Photo Size Online Free | SnapFit`
  const description = `Free PAN card photo resizer: resize your photo for a PAN card / Form 49A application to a passport-style size on a light background, compressed to a small KB. In your browser, no upload.`
  const h1 = `PAN card photo resizer`
  const lede = `Resize your photograph for a PAN card (Form 49A) application — a passport-style colour photo on a light background, compressed to the small file size online forms accept — free and private in your browser.`
  const faqs = [
    { q: `What photo size is needed for a PAN card?`, a: `PAN card applications generally ask for a recent passport-style colour photograph, about 3.5 × 2.5 cm, on a plain light or white background with the full face visible. Online forms usually want a small JPEG, often around 20–50 KB. Always confirm the exact figure on the NSDL / UTIITSL portal you are using.` },
    { q: `How do I resize my photo for a PAN card online?`, a: `Open SnapFit, choose the Custom preset, and upload your photo. Set the size you need and the maximum KB the form allows, then download the ready JPEG. Everything runs in your browser.` },
    { q: `Is the PAN card photo resizer free and private?`, a: `Yes — free, no sign-up, and your photo is processed on your device and never uploaded to any server.` },
  ]
  const jsonld = [faqLD(faqs), howToLD('How to resize a PAN card photo', [
    { n: 'Upload', t: 'Open SnapFit and upload a recent passport-style photo.' },
    { n: 'Set the size', t: 'Use the Custom preset to set the dimensions and KB limit your PAN form requires.' },
    { n: 'Download', t: 'Download the resized, compressed JPEG and upload it to the PAN portal.' },
  ])]
  const body = `
    <p class="lede">${esc(lede)}</p>
    <div class="spec">
      <div><div class="k">Photo</div><div class="v">Passport-style</div></div>
      <div><div class="k">Size</div><div class="v">≈3.5×2.5 cm</div></div>
      <div><div class="k">File</div><div class="v">~20–50 KB</div></div>
      <div><div class="k">Background</div><div class="v">Light / white</div></div>
    </div>
    <a class="cta" href="/?exam=custom">Resize my PAN photo →</a>
    <h2>How to resize a PAN card photo</h2>
    <ol class="steps">
      <li>Upload a recent passport-style photo — it stays on your device.</li>
      <li>Open Custom and set the size and KB limit your PAN form asks for.</li>
      <li>Download the ready JPEG and upload it to the PAN portal.</li>
    </ol>
    <h2>Frequently asked questions</h2>
    ${faqs.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('\n    ')}`
  write(`pan-card-photo-resizer/index.html`, pageHtml({ url, title, description, h1, crumbs: [{ name: 'Home', url: '/' }, { name: 'Photo resizer', url: '/photo-resizer/' }, { name: 'PAN card', url }], jsonld, body }))
  return url
}

// ─── Photo resizer in pixels & cm ──────────────────────────────────────────────
function pixelCmPage() {
  const url = `/photo-resizer-in-pixels/`
  const title = `Photo Resizer in Pixels & CM — Resize Image to Exact Size Online | SnapFit`
  const description = `Free photo resizer in pixels and cm: set an exact width and height and resize your image online without losing clarity. No upload, no sign-up — runs in your browser.`
  const h1 = `Photo resizer in pixels and cm`
  const lede = `Set an exact width and height and resize your photo to precise pixels — or a centimetre size for print and forms — free and entirely in your browser.`
  const faqs = [
    { q: `How do I resize a photo to exact pixels?`, a: `Open SnapFit's Custom preset, enter the width and height in pixels, and upload your photo. It is resized to exactly those dimensions, and you can also cap the file size in KB.` },
    { q: `How do I resize a photo in cm?`, a: `Decide the print size in centimetres and convert to pixels — at 300 DPI, 1 cm is about 118 px. Enter those pixel values in the Custom preset. A common ID size of 3.5 × 4.5 cm maps to roughly 413 × 531 px.` },
    { q: `Will resizing to exact pixels stretch my photo?`, a: `SnapFit fits your photo to the frame and centres it, so faces are not stretched. You can nudge the zoom and vertical position to frame it correctly.` },
    { q: `Is it free and private?`, a: `Yes — free, no account, and every image is processed on your device.` },
  ]
  const jsonld = [faqLD(faqs), howToLD('How to resize a photo to exact pixels', [
    { n: 'Open Custom', t: 'Open SnapFit and choose the Custom preset.' },
    { n: 'Enter size', t: 'Type the exact width and height in pixels (or the cm equivalent).' },
    { n: 'Download', t: 'Upload your photo, frame it, and download the resized image.' },
  ])]
  const body = `
    <p class="lede">${esc(lede)}</p>
    <p>Use the <a href="/?exam=custom">Custom preset</a> to enter any width and height. For centimetre sizes, convert at roughly 118 px per cm (300 DPI).</p>
    <a class="cta" href="/?exam=custom">Open the photo resizer →</a>
    <table class="data">
      <thead><tr><th>Common size</th><th>Pixels (300 DPI)</th></tr></thead>
      <tbody>
      <tr><td>2 × 2 inch</td><td class="mono">600 × 600 px</td></tr>
      <tr><td>3.5 × 4.5 cm</td><td class="mono">413 × 531 px</td></tr>
      <tr><td>3.5 × 2.5 cm</td><td class="mono">413 × 295 px</td></tr>
      </tbody>
    </table>
    <h2>How to resize a photo to exact pixels</h2>
    <ol class="steps">
      <li>Open the Custom preset.</li>
      <li>Enter the exact width and height in pixels (or cm equivalent).</li>
      <li>Upload, frame and download the resized photo.</li>
    </ol>
    <h2>Frequently asked questions</h2>
    ${faqs.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('\n    ')}`
  write(`photo-resizer-in-pixels/index.html`, pageHtml({ url, title, description, h1, crumbs: [{ name: 'Home', url: '/' }, { name: 'Photo resizer', url: '/photo-resizer/' }, { name: 'Pixels & cm', url }], jsonld, body }))
  return url
}

// ─── Exam photo & signature size chart (long-form guide) ───────────────────────
function sizeChartPage() {
  const url = `/exam-photo-size-chart/`
  const title = `Exam Photo & Signature Size Chart 2026 — NEET, SSC, UPSC, IBPS & More | SnapFit`
  const description = `Photo and signature size for every major Indian exam in one chart — pixels, KB limits and background — plus the common reasons exam photos get rejected and how to take one at home.`
  const h1 = `Exam photo and signature size chart (2026)`
  const sigCell = (p, k) => NO_SIG.has(p.id) ? '—' : k === 'px' ? `${p.sig.w}×${p.sig.h} px` : `${p.sig.min}–${p.sig.max} KB`
  const rows = EXAMS.map(p => `<tr><td><a href="/exam/${p.id}/">${esc(EXAM_KW[p.id] || p.name)}</a></td><td class="mono">${p.w}×${p.h} px</td><td class="mono">${p.min}–${p.max} KB</td><td class="mono">${sigCell(p, 'px')}</td><td class="mono">${sigCell(p, 'kb')}</td></tr>`).join('\n      ')
  const jsonld = [{
    '@context': 'https://schema.org', '@type': 'Article', headline: h1, description,
    dateModified: TODAY, author: { '@type': 'Person', name: OWNER, url: `${ORIGIN}/about/` },
    publisher: { '@type': 'Organization', name: 'SnapFit', url: `${ORIGIN}/` },
  }]
  const body = `
    <p class="lede">Every exam portal checks your photo and signature against its own pixel and file-size limits, and a mismatch is one of the most common reasons an application gets stuck. Here are the specs SnapFit's presets use, side by side — followed by the mistakes that get photos rejected and how to take one at home that passes first time.</p>
    <div style="overflow-x:auto">
    <table class="data">
      <thead><tr><th>Exam</th><th>Photo</th><th>Photo file</th><th>Signature</th><th>Signature file</th></tr></thead>
      <tbody>
      ${rows}
      </tbody>
    </table>
    </div>
    <p style="font-size:14px;color:var(--muted)">All photos and signatures are uploaded as JPEG (.jpg). Click an exam for its full guide and a one-click preset.</p>

    <h2>How to read this chart</h2>
    <p><strong>Pixels (px)</strong> are the image's width × height. <strong>KB</strong> is the file size after it is saved as a JPEG. Portals usually check both, so a photo with the right dimensions can still be rejected for being too large — or too small, because most forms also set a <em>minimum</em> file size. A photo of 5 KB on a form that asks for 10–50 KB fails just as surely as one of 80 KB.</p>
    <p>Several exams share one spec. NEET, JEE Main and CUET (all conducted by NTA) use the same limits, and so do SSC, IBPS, SBI, RBI, LIC and CTET — which is why they share a preset in SnapFit.</p>

    <h2>Why exam photos get rejected</h2>
    <ul>
      <li><strong>Wrong dimensions or file size.</strong> The most common problem and the easiest to fix. A photo straight from a phone is typically 3000+ px wide and several MB, far beyond any exam limit.</li>
      <li><strong>Background that isn't plain and light.</strong> Patterned walls, doors, curtains or a dark shadow behind the head. Most exams want plain white or a very light colour.</li>
      <li><strong>Face too small or cut off.</strong> Notifications typically ask for the face to fill most of the frame — roughly 70–80% — with the full face, both ears and the top of the shoulders visible. A full-body or half-body shot cropped down will look tiny.</li>
      <li><strong>Caps, dark glasses or face coverings.</strong> These are not accepted; religious headwear is generally allowed as long as the face is fully visible. If you wear spectacles, avoid glare on the lenses.</li>
      <li><strong>Blurry, dark or filtered photos.</strong> Beauty filters, portrait-mode blur, low light and heavy compression artefacts can all lead to rejection — or to trouble at the exam centre when staff compare the photo with your face.</li>
      <li><strong>An old photo.</strong> Several exams require a recent photograph; UPSC, for example, has in recent cycles asked for a photo no more than 10 days old with your name and the date printed on it. Your notification has the current rule.</li>
      <li><strong>Photo and signature mixed up.</strong> Uploading the signature in the photo field (or the reverse) happens more often than you'd think when the two files have similar names. Name them clearly before you start.</li>
    </ul>

    <h2>How to take an exam photo at home</h2>
    <ol class="steps">
      <li>Stand about a metre in front of a plain white or light wall, facing a window so daylight falls evenly on your face. Avoid a single overhead bulb — it throws shadows under the eyes.</li>
      <li>Ask someone to take the photo at eye level with the phone's rear camera, held straight rather than tilted. The rear camera is sharper than the selfie camera and avoids the stretched look of an arm's-length shot.</li>
      <li>Look straight at the lens with a neutral expression and mouth closed. Keep your head and the top of your shoulders in frame, and turn off beauty mode and filters.</li>
      <li>Take a few shots and keep the sharpest one. Then open SnapFit, pick your exam, and it crops to the exact pixels, cleans the background to white and compresses within the KB range — all on your device.</li>
    </ol>

    <h2>Signature tips</h2>
    <ul>
      <li>Sign on plain white paper with a black or dark-blue pen. A slightly thicker nib scans much more cleanly than a fine ballpoint.</li>
      <li>Sign in your normal running hand. Some exams — IBPS among them — do not accept a signature written in capital letters.</li>
      <li>Photograph it straight-on in good light, then crop close around the signature so it fills the frame.</li>
      <li>Use the same signature you will sign at the exam centre; invigilators compare the two.</li>
    </ul>
    <p>The <a href="/signature/">signature resizer</a> has the per-exam signature sizes and a one-click mode for each.</p>

    <h2>Always check the official notification</h2>
    <p>Requirements can change from one exam cycle to the next. The numbers above are the ones SnapFit's presets use, and they're updated as new notifications come out — but the notification for your exam is the final word. If a number here doesn't match your notification, <a href="/contact/">let us know</a> and we'll fix the preset.</p>`
  write(`exam-photo-size-chart/index.html`, pageHtml({ url, title, description, h1, crumbs: [{ name: 'Home', url: '/' }, { name: 'Exam photo size chart', url }], jsonld, body }))
  return url
}

// ─── About / Contact / Privacy / Terms ─────────────────────────────────────────
const POLICY_DATE = '10 October 2026'
const mail = `<a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>`

function infoPage(slug, name, title, description, body) {
  const url = `/${slug}/`
  write(`${slug}/index.html`, pageHtml({ url, title, description, h1: name, crumbs: [{ name: 'Home', url: '/' }, { name, url }], jsonld: [], body, plain: true }))
  return url
}

const aboutPage = () => infoPage('about', 'About SnapFit', 'About SnapFit — Free Exam & ID Photo Resizer', `SnapFit is a free, in-browser tool for resizing exam, ID and marketplace photos to exact specs. Built and maintained by ${OWNER}.`, `
    <p class="lede">SnapFit is a free tool that resizes photos and signatures to the exact pixel and file-size limits that Indian exam portals, ID applications and online marketplaces ask for — without uploading your photo anywhere.</p>
    <h2>Why it exists</h2>
    <p>Every exam portal wants something slightly different: 200×230 px and 10–200 KB for one form, 350×350 px and 20–300 KB for the next, a signature at 140×60 px for a third. Getting it wrong means a rejected upload at the worst possible moment — close to the deadline. The usual options are a trip to a cyber café, or a website that uploads your face and ID photo to its servers.</p>
    <p>SnapFit does the whole job on your own device. Pick your exam, upload a photo, and it is cropped to the right dimensions, the background cleaned to white and the file compressed into the allowed KB range in a few seconds.</p>
    <h2>Who makes it</h2>
    <p>SnapFit is built and maintained by ${esc(OWNER)}, an independent software developer. It started as a tool to stop people losing time to photo-upload errors on exam forms, and has grown to cover ID photos, signatures and product photos for sellers on Amazon.in, Flipkart, Meesho and other marketplaces.</p>
    <h2>How it works</h2>
    <ul>
      <li><strong>On-device processing.</strong> Resizing, cropping, background removal and compression all run in your browser. The AI background-removal model is downloaded to your browser and runs locally; your photo is never sent to a server.</li>
      <li><strong>Presets kept up to date.</strong> Each exam and marketplace preset is based on the requirements published in official notifications and seller guidelines, and is updated when those change. See the full <a href="/exam-photo-size-chart/">exam photo size chart</a>.</li>
      <li><strong>Free.</strong> SnapFit is free to use, with no sign-up and no watermark, and is supported by advertising.</li>
    </ul>
    <h2>Not affiliated</h2>
    <p>SnapFit is an independent tool and is not affiliated with NTA, UPSC, SSC, IBPS, any other examination body, or any marketplace. Always confirm requirements in your official notification before submitting.</p>
    <p>Questions or a spec that looks out of date? <a href="/contact/">Get in touch</a>.</p>`)

const contactPage = () => infoPage('contact', 'Contact', 'Contact SnapFit', 'Get in touch with SnapFit — report an outdated exam photo spec, a bug, or send a feature request.', `
    <p class="lede">Questions, bug reports and corrections are all welcome. Email ${mail}.</p>
    <h2>What to write about</h2>
    <ul>
      <li><strong>An outdated or wrong spec.</strong> Exam requirements change between cycles. Tell us the exam, the number you expected, and a link to the official notification, and we'll update the preset.</li>
      <li><strong>Something not working.</strong> Mention your device, browser and what you were trying to do — for example "Android, Chrome, NEET preset, background stays grey".</li>
      <li><strong>A missing exam or marketplace.</strong> Tell us which one and where its photo requirements are published.</li>
      <li><strong>Privacy questions.</strong> See the <a href="/privacy/">privacy policy</a>, or email us.</li>
    </ul>
    <h2>Please don't email your photos</h2>
    <p>We never need your photo, signature or ID documents to help you — SnapFit is designed so they stay on your device. A description of the problem, or a screenshot with personal details covered, is all we need.</p>`)

const privacyPage = () => infoPage('privacy', 'Privacy policy', 'Privacy Policy — SnapFit', 'How SnapFit handles your data: photos are processed on your device and never uploaded. Details on advertising cookies, analytics and contact.', `
    <p class="lede">Last updated: ${POLICY_DATE}. This policy explains what information SnapFit (www.snapfit.in) handles and how. The short version: your photos and signatures are processed on your own device and are never uploaded to us.</p>
    <h2>Your photos and signatures</h2>
    <p>All photo processing — resizing, cropping, background removal and compression — happens inside your web browser. The images you open in SnapFit are not uploaded to our servers or anyone else's, and we cannot see them. When you close the page, they are gone.</p>
    <h2>Notice screenshot auto-fill (optional)</h2>
    <p>If you choose to use the feature that reads photo requirements from a screenshot of an exam notice, that screenshot (not your photo) is sent to our server and passed to a third-party AI service (OpenRouter and the model provider it routes to) to extract the size requirements. We don't store the screenshot. Avoid using this feature with screenshots that contain personal details.</p>
    <h2>Advertising and cookies</h2>
    <p>SnapFit shows ads served by Google AdSense. Third-party vendors, including Google, use cookies to serve ads based on your previous visits to this and other websites. Google's use of advertising cookies enables it and its partners to serve ads to you based on your visits to this site and/or other sites on the internet.</p>
    <p>You can opt out of personalised advertising in <a href="https://adssettings.google.com" rel="nofollow">Google Ads Settings</a>, or opt out of some third-party vendors' use of cookies at <a href="https://www.aboutads.info/choices/" rel="nofollow">aboutads.info</a>. To learn more, see <a href="https://policies.google.com/technologies/partner-sites" rel="nofollow">how Google uses information from sites that use its services</a>.</p>
    <h2>Analytics</h2>
    <p>We use Vercel Web Analytics to count page views and understand which pages are useful. It does not use cookies and reports only aggregated data — it does not identify you personally.</p>
    <h2>Stored on your device</h2>
    <p>SnapFit saves your light/dark theme choice in your browser's local storage. Nothing else is stored, and you can clear it at any time through your browser settings.</p>
    <h2>Third-party resources</h2>
    <p>To run background removal in your browser, SnapFit downloads model files from Google's servers and the jsDelivr CDN. Like any web request, these services receive your IP address and browser details; no photo data is sent.</p>
    <h2>Children</h2>
    <p>SnapFit is a general-audience tool and does not knowingly collect personal information from anyone, including children.</p>
    <h2>Changes and contact</h2>
    <p>If this policy changes, we'll update the date at the top of this page. Questions about privacy? Email ${mail}.</p>`)

const termsPage = () => infoPage('terms', 'Terms of use', 'Terms of Use — SnapFit', 'The terms for using SnapFit, a free in-browser photo and signature resizer.', `
    <p class="lede">Last updated: ${POLICY_DATE}. By using SnapFit (www.snapfit.in) you agree to these terms.</p>
    <h2>The service</h2>
    <p>SnapFit is a free tool for resizing, cropping and compressing photos and signatures. It runs in your browser and is provided "as is", without any warranty. We may change, suspend or discontinue any part of it at any time.</p>
    <h2>Check the official requirements</h2>
    <p>Presets reflect exam, ID and marketplace requirements as we understand them, but requirements change and mistakes are possible. You are responsible for confirming that your final photo and signature meet the official notification or guideline before you submit. SnapFit is not responsible for rejected applications or listings.</p>
    <h2>Your content</h2>
    <p>You keep all rights to the images you process. Only use images you have the right to use, and don't use SnapFit to create misleading or fraudulent documents or to impersonate anyone.</p>
    <h2>Limitation of liability</h2>
    <p>To the extent permitted by law, SnapFit and its maintainer are not liable for any loss arising from use of the service.</p>
    <h2>Not affiliated</h2>
    <p>SnapFit is independent and not affiliated with any examination body, government department or marketplace. Names of exams and marketplaces are used only to describe their photo requirements.</p>
    <h2>Contact</h2>
    <p>Questions about these terms? Email ${mail}.</p>`)

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
for (const d of ['exam', 'sell', 'compress', 'signature', 'photo-resizer', 'pan-card-photo-resizer', 'photo-resizer-in-pixels', 'exam-photo-size-chart', 'about', 'contact', 'privacy', 'terms'])
  rmSync(resolve(PUBLIC, d), { recursive: true, force: true })

const urls = ['/']
urls.push(photoResizerPillarPage())
for (const p of EXAMS) urls.push(examPage(p))
for (const m of MARKETPLACE_PRESETS) urls.push(sellPage(m))
for (const kb of KB_TARGETS) urls.push(kbPage(kb))
for (const mb of MB_TARGETS) urls.push(mbPage(mb))
urls.push(signaturePage())
urls.push(panCardPage())
urls.push(pixelCmPage())
urls.push(sizeChartPage())
urls.push(aboutPage(), contactPage(), privacyPage(), termsPage())
ogImage()

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${ORIGIN}${u}</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>${u === '/' ? '1.0' : '0.8'}</priority></url>`).join('\n')}
</urlset>
`
writeFileSync(resolve(PUBLIC, 'sitemap.xml'), sitemap)
writeFileSync(resolve(PUBLIC, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`)

const llms = `# SnapFit
> Free, in-browser photo resizer & compressor. Resize any photo to an exact KB, MB, pixel or cm size for Indian competitive exams, ID documents (PAN, passport) and e-commerce marketplaces. Nothing is uploaded — all processing is on-device.

## Photo resizer
- [Free online photo resizer](${ORIGIN}/photo-resizer/)
- [Photo resizer in pixels & cm](${ORIGIN}/photo-resizer-in-pixels/)
- [PAN card photo resizer](${ORIGIN}/pan-card-photo-resizer/)
- [Exam signature resizer](${ORIGIN}/signature/)
- [Exam photo & signature size chart](${ORIGIN}/exam-photo-size-chart/)

## Resize to an exact file size
${KB_TARGETS.map(kb => `- [Photo resizer to ${kb} KB](${ORIGIN}/compress/${kb}kb/)`).join('\n')}
${MB_TARGETS.map(mb => `- [Photo resizer to ${mb} MB](${ORIGIN}/compress/${mb}mb/)`).join('\n')}

## Exam photo tools
${EXAMS.map(p => `- [${EXAM_KW[p.id] || p.name} photo — ${p.w}×${p.h}px, ${p.min}-${p.max}KB](${ORIGIN}/exam/${p.id}/)`).join('\n')}

## Marketplace listing-photo tools (SnapFit Studio)
${MARKETPLACE_PRESETS.map(m => `- [${m.name} product photo — ${m.w}×${m.h}px, white background](${ORIGIN}/sell/${m.id}/)`).join('\n')}
`
writeFileSync(resolve(PUBLIC, 'llms.txt'), llms)

console.log(`✓ SEO generated: ${urls.length - 1} pages (size chart, about, contact, privacy, terms, ${EXAMS.length} exam, ${MARKETPLACE_PRESETS.length} marketplace, ${KB_TARGETS.length} KB, ${MB_TARGETS.length} MB, signature, PAN, pixel/cm, photo-resizer hub) + og-image + sitemap + robots + llms`)
