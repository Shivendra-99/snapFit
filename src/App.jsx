import { useState, useRef, useEffect, useCallback, Fragment } from 'react'
import './index.css'
import * as pdfjsLib from 'pdfjs-dist'
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href

// ─── Preset groups ────────────────────────────────────────────────────────────
// G = colour group: green | orange | blue | navy | purple
const G = {
  green:  { tint: '#eaf6ee', ink: '#15803d' },
  orange: { tint: '#fdeede', ink: '#c4730e' },
  blue:   { tint: '#e7eefb', ink: '#2f5fc4' },
  navy:   { tint: '#edf4ff', ink: '#1d5fa8' },
  purple: { tint: '#f3f0ff', ink: '#6d28d9' },
}

const PRESETS = [
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

const CUSTOM_BASE = PRESETS.find(p => p.id === 'custom')

const BG_OPTIONS = [
  { hex: '#ffffff', name: 'White' },
  { hex: '#eef3fb', name: 'Off-white' },
  { hex: '#cfe0fb', name: 'Lt blue' },
  { hex: '#2f6fdb', name: 'Blue' },
]

function hexToRgb(h) {
  h = h.replace('#', '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function applyBgReplace(data, w, h, newHex, thr) {
  const corners = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]]
  let tr = 0, tg = 0, tb = 0
  corners.forEach(([x, y]) => {
    const i = (y * w + x) * 4
    tr += data[i]; tg += data[i + 1]; tb += data[i + 2]
  })
  tr /= 4; tg /= 4; tb /= 4
  const [nr, ng, nb] = hexToRgb(newHex)
  const soft = thr * 1.6
  for (let i = 0; i < data.length; i += 4) {
    const dr = data[i] - tr, dg = data[i + 1] - tg, db = data[i + 2] - tb
    const dist = Math.sqrt(dr * dr + dg * dg + db * db)
    if (dist < thr) {
      data[i] = nr; data[i + 1] = ng; data[i + 2] = nb
    } else if (dist < soft) {
      const t = (dist - thr) / (soft - thr)
      data[i]     = Math.round(nr * (1 - t) + data[i]     * t)
      data[i + 1] = Math.round(ng * (1 - t) + data[i + 1] * t)
      data[i + 2] = Math.round(nb * (1 - t) + data[i + 2] * t)
    }
  }
}

function kbOf(url) {
  return Math.max(1, Math.round((url.split(',')[1] || '').length * 0.75 / 1024))
}

// ─── PDF Compressor ───────────────────────────────────────────────────────────
function fmtKb(kb) {
  return kb >= 1000 ? `${(kb / 1024).toFixed(2)} MB` : `${kb} KB`
}

function PdfScreen({ onBack }) {
  const [pdfDoc,    setPdfDoc]    = useState(null)
  const [fileName,  setFileName]  = useState('')
  const [origKb,    setOrigKb]    = useState(0)
  const [pages,     setPages]     = useState(0)
  const [quality,   setQuality]   = useState(70)
  const [origPrev,  setOrigPrev]  = useState(null)
  const [compPrev,  setCompPrev]  = useState(null)
  const [compKb,    setCompKb]    = useState(0)
  const [pdfBlob,   setPdfBlob]   = useState(null)
  const [busy,      setBusy]      = useState(false)

  const fileRef  = useRef(null)
  const docRef   = useRef(null)
  const timerRef = useRef(null)

  // ── Core compression routine ─────────────────────────────────────────
  const compress = useCallback(async (doc, q) => {
    setBusy(true)
    try {
      const jq = 0.3 + (q / 100) * 0.65   // JPEG quality: 0.30 → 0.95
      const sc = 0.5 + (q / 100) * 1.0    // render scale: 0.50 → 1.50

      // Compressed preview of first page
      const p1   = await doc.getPage(1)
      const vpC  = p1.getViewport({ scale: sc })
      const cvC  = Object.assign(document.createElement('canvas'), { width: vpC.width, height: vpC.height })
      await p1.render({ canvasContext: cvC.getContext('2d'), viewport: vpC }).promise
      setCompPrev(cvC.toDataURL('image/jpeg', jq))

      // Build compressed PDF (all pages)
      const { jsPDF } = await import('jspdf')
      let pdf = null
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i)
        const vo   = page.getViewport({ scale: 1 })   // original dimensions
        const vr   = page.getViewport({ scale: sc })   // render dimensions

        if (i === 1) {
          pdf = new jsPDF({
            unit: 'px',
            format: [vo.width, vo.height],
            orientation: vo.width > vo.height ? 'l' : 'p',
            compress: true,
          })
        } else {
          pdf.addPage([vo.width, vo.height], vo.width > vo.height ? 'l' : 'p')
        }

        const cv = Object.assign(document.createElement('canvas'), { width: vr.width, height: vr.height })
        await page.render({ canvasContext: cv.getContext('2d'), viewport: vr }).promise
        pdf.addImage(cv.toDataURL('image/jpeg', jq), 'JPEG', 0, 0, vo.width, vo.height, '', 'FAST')
      }

      const blob = pdf.output('blob')
      setPdfBlob(blob)
      setCompKb(Math.round(blob.size / 1024))
    } catch (err) {
      console.error('PDF compress error', err)
    } finally {
      setBusy(false)
    }
  }, [])

  // ── Load PDF file ─────────────────────────────────────────────────────
  const loadFile = useCallback(async (file) => {
    if (!file?.type?.includes('pdf')) return
    setBusy(true)
    setFileName(file.name)
    setOrigKb(Math.round(file.size / 1024))
    try {
      const doc = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise
      docRef.current = doc
      setPdfDoc(doc)
      setPages(doc.numPages)

      // High-quality preview of page 1 (fixed, for "before" side)
      const pg  = await doc.getPage(1)
      const vp  = pg.getViewport({ scale: 1.5 })
      const cv  = Object.assign(document.createElement('canvas'), { width: vp.width, height: vp.height })
      await pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise
      setOrigPrev(cv.toDataURL('image/jpeg', 0.95))

      await compress(doc, quality)
    } catch (err) {
      console.error('PDF load error', err)
      setBusy(false)
    }
  }, [quality, compress])

  // ── Slider handler with debounce ─────────────────────────────────────
  const handleSlider = (val) => {
    setQuality(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (docRef.current) compress(docRef.current, val)
    }, 400)
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const download = () => {
    if (!pdfBlob) return
    const url = URL.createObjectURL(pdfBlob)
    Object.assign(document.createElement('a'), { href: url, download: `compressed_${fileName}` }).click()
    URL.revokeObjectURL(url)
  }

  const savings  = origKb > 0 ? Math.round((1 - compKb / origKb) * 100) : 0
  const savColor = savings >= 40 ? '#16a34a' : savings >= 15 ? '#c4730e' : '#64748b'

  // ── Upload screen (no PDF loaded yet) ────────────────────────────────
  if (!pdfDoc) {
    return (
      <div className="sf-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(24px,5vw,60px) clamp(18px,5vw,56px)' }}>
        <input ref={fileRef} type="file" accept=".pdf,application/pdf" onChange={e => loadFile(e.target.files?.[0])} style={{ display: 'none' }} />
        <div style={{ textAlign: 'center', maxWidth: 520, width: '100%' }}>
          <button onClick={onBack} style={{
            border: '1px solid var(--line)', background: 'var(--surface)', cursor: 'pointer',
            fontFamily: 'inherit', fontWeight: 700, fontSize: 13.5, color: 'var(--ink)',
            padding: '9px 15px', borderRadius: 11, display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 36,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            Back to photo tool
          </button>

          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--tint)', color: 'var(--green-ink)', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
            <Ico.file width="28" height="28" />
          </div>
          <h1 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 700, letterSpacing: '-.03em', marginBottom: 10 }}>PDF Compressor</h1>
          <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 32 }}>
            Reduce PDF file size with a quality slider — see the before &amp; after preview before you download. 100% in your browser, nothing uploaded.
          </p>

          <div
            className="upload-area"
            onClick={() => fileRef.current?.click()}
            onDrop={e => { e.preventDefault(); loadFile(e.dataTransfer.files?.[0]) }}
            onDragOver={e => e.preventDefault()}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 80% at 50% -10%,var(--tint) 0%,transparent 60%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ width: 64, height: 64, margin: '0 auto 16px', borderRadius: 18, background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'floaty 3.4s ease-in-out infinite', boxShadow: '0 10px 24px rgba(21,128,61,.34)' }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 15V3M8 7l4-4 4 4" /><path d="M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
                </svg>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Drop your PDF here</div>
              <div style={{ fontSize: 13.5, color: 'var(--muted)', fontWeight: 500, marginBottom: 18 }}>or click to browse</div>
              <span style={{ display: 'inline-block', background: 'var(--tint)', color: 'var(--green-ink)', fontWeight: 700, fontSize: 13.5, padding: '11px 22px', borderRadius: 11, animation: 'pulsering 2.4s infinite' }}>Choose PDF</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Main editor ───────────────────────────────────────────────────────
  return (
    <div className="sf-page" style={{ maxWidth: 1180, width: '100%', margin: '0 auto', padding: 'clamp(18px,3vw,30px) clamp(16px,5vw,40px) 50px', animation: 'fadeup .35s var(--ease-out) both' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ border: '1px solid var(--line)', background: 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 13.5, color: 'var(--ink)', padding: '9px 15px', borderRadius: 11, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          Back
        </button>
        <div style={{ fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--muted)', fontWeight: 600, fontSize: 13 }}>PDF Compressor</span>
          {pages} page{pages > 1 ? 's' : ''}
        </div>
        <button onClick={() => { setPdfDoc(null); setPdfBlob(null); setOrigPrev(null); setCompPrev(null) }} style={{ border: '1px solid var(--line)', background: 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 13.5, color: 'var(--ink)', padding: '9px 15px', borderRadius: 11 }}>
          Replace
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>

        {/* PREVIEW PANEL */}
        <div style={{ flex: '1 1 380px', minWidth: 300 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 22, padding: 'clamp(18px,3vw,28px)', boxShadow: '0 12px 34px -20px rgba(22,36,27,.3)' }}>
            <div style={{ display: 'flex', gap: 18, justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap' }}>

              {/* Original */}
              <div style={{ textAlign: 'center', flex: '1 1 140px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>Original · {fmtKb(origKb)}</div>
                <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 6, display: 'inline-block', width: '100%' }}>
                  {origPrev && <img src={origPrev} alt="Original page 1" style={{ display: 'block', width: '100%', borderRadius: 6, objectFit: 'contain' }} />}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', alignSelf: 'center', color: 'var(--faint)', flexShrink: 0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </div>

              {/* Compressed */}
              <div style={{ textAlign: 'center', flex: '1 1 140px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green-ink)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>
                  {quality}% quality · {fmtKb(compKb)}
                </div>
                <div style={{ background: 'var(--tint)', borderRadius: 10, padding: 6, display: 'inline-block', width: '100%', boxShadow: '0 0 0 2px rgba(21,128,61,.18)', position: 'relative' }}>
                  {compPrev && <img src={compPrev} alt="Compressed page 1" style={{ display: 'block', width: '100%', borderRadius: 6, objectFit: 'contain' }} />}
                  {busy && (
                    <div style={{ position: 'absolute', inset: 0, borderRadius: 6, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>Updating…</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Size summary row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--surface2)', padding: '8px 14px', borderRadius: 10 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)' }}>{fmtKb(origKb)}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>{fmtKb(compKb)}</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--tint)', padding: '8px 14px', borderRadius: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: savColor, display: 'inline-block' }} />
                <span style={{ fontSize: 12.5, fontWeight: 800, color: savColor }}>{savings}% smaller</span>
              </div>
            </div>
          </div>

          {/* Download button */}
          <button
            onClick={download}
            disabled={busy || !pdfBlob}
            style={{ width: '100%', marginTop: 14, border: 'none', cursor: busy ? 'not-allowed' : 'pointer', background: busy ? 'var(--line)' : 'var(--green)', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 15, padding: 16, borderRadius: 14, boxShadow: busy ? 'none' : '0 10px 24px rgba(21,128,61,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'background .2s' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4v12M7 11l5 5 5-5" /><path d="M5 20h14" />
            </svg>
            {busy ? 'Processing…' : `Download compressed PDF (${fmtKb(compKb)})`}
          </button>
        </div>

        {/* CONTROLS PANEL */}
        <div style={{ flex: '0 1 300px', minWidth: 260, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* File info */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 18, padding: 18 }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--green)', display: 'inline-block' }} />
              File info
            </div>
            {[
              { label: 'File',     val: fileName.length > 24 ? fileName.slice(0, 22) + '…' : fileName },
              { label: 'Pages',    val: pages },
              { label: 'Original', val: fmtKb(origKb) },
            ].map(({ label, val }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 7, alignItems: 'baseline' }}>
                <span style={{ fontWeight: 600, color: 'var(--muted)' }}>{label}</span>
                <span style={{ fontWeight: 700, color: 'var(--ink)', fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Quality slider */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 18, padding: 18 }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--green)', display: 'inline-block' }} />
              Quality
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Compression level</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, fontSize: 20, color: 'var(--green-ink)' }}>{quality}%</span>
            </div>
            <input type="range" min="10" max="100" value={quality} onChange={e => handleSlider(+e.target.value)} style={{ width: '100%' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--faint)', fontWeight: 600, marginTop: 4 }}>
              <span>Smaller file</span>
              <span>Better quality</span>
            </div>
            <div style={{ marginTop: 14, fontSize: 11.5, color: 'var(--muted)', fontWeight: 500, lineHeight: 1.55 }}>
              Move slider left to reduce size. The preview updates automatically so you can judge quality before downloading.
            </div>
          </div>

          {/* Size result */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 18, padding: 18 }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--green)', display: 'inline-block' }} />
              Output size
            </div>
            {[
              { label: 'Original',   val: fmtKb(origKb),  color: 'var(--muted)' },
              { label: 'Compressed', val: fmtKb(compKb),  color: 'var(--ink)'   },
              { label: 'Saved',      val: `${savings}%`,  color: savColor       },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 8, alignItems: 'baseline' }}>
                <span style={{ fontWeight: 600, color: 'var(--muted)' }}>{label}</span>
                <span style={{ fontWeight: 800, color, fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>{val}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── Motion helpers ───────────────────────────────────────────────────────────
const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Reveals every [data-reveal] in the tree the first time it scrolls into view.
// Re-runs on `key` so a screen change picks up freshly mounted nodes.
function useRevealOnScroll(key) {
  useEffect(() => {
    const nodes = document.querySelectorAll('[data-reveal]:not(.is-in)')
    if (!nodes.length) return
    if (reducedMotion()) {
      nodes.forEach(n => n.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return
        e.target.classList.add('is-in')
        io.unobserve(e.target)
      })
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.12 })
    nodes.forEach(n => io.observe(n))

    // Safety net: content must never stay invisible because the observer
    // was throttled (background tab, headless render, print).
    const failsafe = setTimeout(() => nodes.forEach(n => n.classList.add('is-in')), 2500)

    return () => { clearTimeout(failsafe); io.disconnect() }
  }, [key])
}

// Feeds the pointer position to CSS (spotlight) and, optionally, a 3D tilt.
function trackPointer(e, tiltDeg = 0) {
  const el = e.currentTarget
  const r  = el.getBoundingClientRect()
  const px = (e.clientX - r.left) / r.width
  const py = (e.clientY - r.top) / r.height
  el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`)
  el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`)
  if (tiltDeg && !reducedMotion()) {
    el.style.setProperty('--tilt-y', `${((px - 0.5) * 2 * tiltDeg).toFixed(2)}deg`)
    el.style.setProperty('--tilt-x', `${(-(py - 0.5) * 2 * tiltDeg).toFixed(2)}deg`)
  }
}

function releasePointer(e) {
  e.currentTarget.style.setProperty('--tilt-x', '0deg')
  e.currentTarget.style.setProperty('--tilt-y', '0deg')
}

// Counts a number up on mount; lands immediately under reduced motion.
// Not gated on scroll — a throttled observer must never leave a wrong number on screen.
function useCountUp(target) {
  const [n, setN] = useState(() => (reducedMotion() ? target : 0))
  useEffect(() => {
    if (reducedMotion()) return
    let raf, t0
    const step = (t) => {
      if (t0 === undefined) t0 = t
      const p = Math.min(1, (t - t0) / 1100)
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))))   // ease-out cubic
      if (p < 1) raf = requestAnimationFrame(step)
      else setN(target)
    }
    raf = requestAnimationFrame(step)
    // rAF is paused in background tabs — timers are not. Never leave a wrong number up.
    const failsafe = setTimeout(() => setN(target), 2500)
    return () => { clearTimeout(failsafe); cancelAnimationFrame(raf) }
  }, [target])
  return n
}

function useScrolled(px = 8) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > px)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [px])
  return scrolled
}

// ─── Button with pointer-anchored ripple ──────────────────────────────────────
function Btn({ variant = '', className = '', onClick, children, ...rest }) {
  const ref = useRef(null)

  const handleClick = (e) => {
    const el = ref.current
    if (el && !reducedMotion()) {
      const r = el.getBoundingClientRect()
      const ink = document.createElement('span')
      ink.className = 'sf-ripple'
      ink.style.setProperty('--rx', `${e.clientX - r.left}px`)
      ink.style.setProperty('--ry', `${e.clientY - r.top}px`)
      el.appendChild(ink)
      setTimeout(() => ink.remove(), 640)
    }
    onClick?.(e)
  }

  return (
    <button
      ref={ref}
      className={['sf-btn', variant, className].filter(Boolean).join(' ')}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </button>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ico = {
  upload: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M12 16V4M7 9l5-5 5 5" /><path d="M5 16v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3" />
    </svg>
  ),
  file: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
    </svg>
  ),
  camera: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <rect x="3" y="6" width="18" height="14" rx="2.5" /><circle cx="12" cy="13" r="3.4" /><path d="M8 6l1.4-2.4h5.2L16 6" />
    </svg>
  ),
  pen: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M3 18.5c3-1 4-6 7-6s2.5 3.5 5 3.5c1.6 0 2.8-1.2 3.6-2.4" /><path d="M14.5 5.5l4 4L9 19l-4.5.5L5 15z" />
    </svg>
  ),
  sun: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" aria-hidden="true" {...p}>
      <circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
    </svg>
  ),
  moon: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M20.5 14.3A8.5 8.5 0 0 1 9.7 3.5a8.5 8.5 0 1 0 10.8 10.8z" />
    </svg>
  ),
  arrow: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  chevron: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  shield: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M12 2.7l7.5 3v5.6c0 4.6-3.1 8.6-7.5 10-4.4-1.4-7.5-5.4-7.5-10V5.7z" /><path d="M9 12l2.2 2.2L15.4 10" />
    </svg>
  ),
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav({ dark, onToggleDark, onUpload, onGoHome, onOpenPdf }) {
  const stuck = useScrolled()

  return (
    <nav className={`sf-nav${stuck ? ' is-stuck' : ''}`}>
      <button className="sf-brand" onClick={onGoHome} aria-label="SnapFit home">
        <span className="sf-logo"><Ico.camera width="20" height="20" /></span>
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05, textAlign: 'left' }}>
          <span className="sf-display" style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-.025em' }}>SnapFit</span>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--muted)' }}>Exam Photo Fixer</span>
        </span>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="sf-chip sf-chip--brand sf-hide-sm">
          <span className="sf-dot sf-dot--live" style={{ color: 'var(--green)' }} />
          100% in your browser
        </span>

        <Btn
          variant="sf-btn--icon sf-theme-btn"
          onClick={onToggleDark}
          aria-pressed={dark}
          aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
          title={dark ? 'Light theme' : 'Dark theme'}
        >
          {dark ? <Ico.sun width="18" height="18" /> : <Ico.moon width="18" height="18" />}
        </Btn>

        <Btn onClick={onOpenPdf} className="sf-hide-sm">
          <Ico.file width="15" height="15" />
          Compress PDF
        </Btn>

        <Btn variant="sf-btn--primary" onClick={onUpload}>
          <Ico.upload width="15" height="15" />
          Upload photo
        </Btn>
      </div>
    </nav>
  )
}

// ─── Home Page ────────────────────────────────────────────────────────────────
const HERO_WORDS = ['Exam', 'photo', '&', 'PDF,', 'sorted', 'in']

function HomePage({ onUpload, onDrop, onDragOver, onDragLeave, onSelectPreset, onOpenPdf, mode, onSetMode }) {
  const [dragging, setDragging] = useState(false)
  const presetCount = useCountUp(20)

  useRevealOnScroll('home')

  const handleDrop = (e) => { setDragging(false); onDrop(e) }
  const handleOver = (e) => { e.preventDefault(); setDragging(true); onDragOver(e) }
  const handleLeave = (e) => { setDragging(false); onDragLeave(e) }

  return (
    <div className="sf-page">
      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="sf-container sf-hero">
        <div>
          <div className="sf-chip" style={{ color: 'var(--amber)', marginBottom: 20 }} data-reveal>
            <span className="sf-dot sf-dot--live" />
            Photo fixer &amp; PDF compressor — free
          </div>

          <h1 className="sf-h1">
            {/* Space sits outside the inline-block or it collapses at the edge */}
            {HERO_WORDS.map((w, i) => (
              <Fragment key={w + i}>
                <span className="sf-word" style={{ '--d': `${80 + i * 65}ms` }}>{w}</span>{' '}
              </Fragment>
            ))}
            <span className="sf-word" style={{ '--d': `${80 + HERO_WORDS.length * 65}ms` }}>
              <span className="sf-grad-word">seconds</span>.
            </span>
          </h1>

          <p className="sf-lede" data-reveal style={{ '--d': '260ms' }}>
            Resize exam photos for NEET, SSC, UPSC, IBPS, JEE and 20+ more exams — or shrink
            any PDF to a fraction of its size. All in your browser, nothing uploaded, no sign-up.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }} data-reveal>
            <Btn variant="sf-btn--primary sf-btn--lg" onClick={onUpload}>
              <Ico.upload width="18" height="18" />
              Fix exam photo
            </Btn>
            <Btn variant="sf-btn--lg" onClick={onOpenPdf}>
              <Ico.file width="18" height="18" />
              Compress PDF
            </Btn>
          </div>

          <p style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 7 }} data-reveal>
            <Ico.shield width="14" height="14" style={{ color: 'var(--green-ink)' }} />
            JPG / PNG / PDF · 100% private · free forever
          </p>

          <div className="sf-stats" data-reveal style={{ '--d': '120ms' }}>
            <div>
              <div className="sf-stat-val">{presetCount}+</div>
              <div className="sf-stat-lbl">exam presets</div>
            </div>
            <div className="sf-stat-rule" />
            <div>
              <div className="sf-stat-val">PDF</div>
              <div className="sf-stat-lbl">compression too</div>
            </div>
            <div className="sf-stat-rule" />
            <div>
              <div className="sf-stat-val">0</div>
              <div className="sf-stat-lbl">uploads to server</div>
            </div>
          </div>
        </div>

        {/* Upload card — tilts toward the pointer, lights up under it */}
        <div data-reveal style={{ '--d': '160ms' }}>
          <div
            className={`upload-area${dragging ? ' is-dragging' : ''}`}
            role="button"
            tabIndex={0}
            aria-label="Choose or drop a photo to fix"
            onClick={onUpload}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onUpload() } }}
            onPointerMove={e => trackPointer(e, 5)}
            onPointerLeave={releasePointer}
            onDrop={handleDrop}
            onDragOver={handleOver}
            onDragLeave={handleLeave}
          >
            <div className="sf-drop-inner">
              <div className="sf-drop-icon">
                <Ico.upload width="34" height="34" />
              </div>
              <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 6 }} className="sf-display">
                {dragging ? 'Drop it — we’ve got it' : 'Drop your photo here'}
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--muted)', fontWeight: 500, marginBottom: 20 }}>
                or click to browse · JPG, PNG up to 20MB
              </div>
              <span className="sf-drop-cta">Choose file</span>

              <div style={{ marginTop: 20, display: 'flex', gap: 7, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['Auto crop', 'BG replace', 'KB fit'].map((tag, i) => (
                  <span key={tag} className="sf-tag" style={{ transitionDelay: `${i * 45}ms` }}>{tag}</span>
                ))}
              </div>

              <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                <button
                  onClick={e => { e.stopPropagation(); onOpenPdf() }}
                  className="sf-btn sf-btn--quiet"
                  style={{ fontSize: 12.5, padding: '10px 14px' }}
                >
                  <Ico.file width="13" height="13" />
                  Want to compress a PDF instead?
                  <Ico.arrow width="13" height="13" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRESETS ─────────────────────────────────────────────────────── */}
      <section className="sf-container" style={{ paddingBlock: 'clamp(18px,3vw,32px) clamp(28px,4vw,52px)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, marginBottom: 22 }} data-reveal>
          <div>
            <h2 className="sf-h2" style={{ marginBottom: 5 }}>Pick your exam</h2>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
              {mode === 'sig' ? 'Showing signature dimensions & KB limits' : 'Showing photo dimensions & KB limits'}
            </span>
          </div>

          <div className="sf-seg" role="tablist" aria-label="Preset dimension mode">
            <span className="sf-seg-thumb" style={{ left: mode === 'photo' ? 4 : '50%', width: 'calc(50% - 4px)' }} />
            {[
              { val: 'photo', label: 'Photo',     Icon: Ico.camera },
              { val: 'sig',   label: 'Signature', Icon: Ico.pen    },
            ].map(({ val, label, Icon }) => (
              <button
                key={val}
                role="tab"
                aria-selected={mode === val}
                className="sf-seg-btn"
                style={{ flex: '1 1 0', minWidth: 118, justifyContent: 'center' }}
                onClick={() => onSetMode(val)}
              >
                <Icon width="14" height="14" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(172px,1fr))', gap: 14 }}>
          {PRESETS.map((p, i) => {
            const d = mode === 'sig' ? p.sig : p
            return (
              <button
                key={p.id}
                className="preset-card"
                data-reveal
                style={{
                  '--d': `${Math.min(i, 8) * 45}ms`,
                  '--card-glow': `${p.ink}22`,
                  ...(p.id === 'custom' ? { borderStyle: 'dashed', borderColor: p.ink } : {}),
                }}
                onPointerMove={e => trackPointer(e)}
                onClick={() => onSelectPreset(p)}
                aria-label={`${p.name} — ${p.id === 'custom' ? 'custom size' : `${d.w} by ${d.h} pixels, ${d.min} to ${d.max} kilobytes`}`}
              >
                <div style={{ marginBottom: 12 }}>
                  <span className="preset-badge" style={{ background: p.tint, color: p.ink, fontSize: 11.5 }}>
                    {p.abbr}
                  </span>
                </div>
                <div className="preset-name" style={{ fontSize: p.name.length > 18 ? 11.5 : 14.5 }}>{p.name}</div>
                <div className="preset-spec">
                  {p.id === 'custom' ? 'any size · any KB' : `${d.w}×${d.h} px · ${d.min}–${d.max} KB`}
                </div>
                <span className="preset-go"><Ico.arrow width="16" height="16" /></span>
              </button>
            )
          })}
        </div>

        <p style={{ fontSize: 11.5, color: 'var(--faint)', fontWeight: 500, margin: '20px 0 0', textAlign: 'center' }}>
          Specs are illustrative defaults — always confirm exact requirements in the official exam notification before final upload.
        </p>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section style={{ background: 'var(--surface)', borderBlock: '1px solid var(--line)' }}>
        <div className="sf-container" style={{ paddingBlock: 'clamp(34px,5vw,62px)' }}>
          <h2 className="sf-h2" style={{ textAlign: 'center', marginBottom: 30 }} data-reveal>
            Three steps. Thirty seconds.
          </h2>
          <div className="sf-steps">
            {[
              { n: 1, bg: 'var(--tint)',      c: 'var(--green-ink)', title: 'Upload',           desc: 'Drop any selfie or studio photo. It never leaves your device.' },
              { n: 2, bg: 'var(--amber-tint)', c: 'var(--amber)',    title: 'Pick exam & tweak', desc: 'We crop to size, swap the background, and frame the face for you.' },
              { n: 3, bg: 'var(--tint)',      c: 'var(--green-ink)', title: 'Download',          desc: 'Get a JPG that already fits the exact KB range. Upload & done.' },
            ].map((step, i) => (
              <div className="sf-step" key={step.n} data-reveal style={{ '--d': `${i * 110}ms` }}>
                {i < 2 && <span className="sf-step-rail" />}
                <div className="sf-step-num" style={{ background: step.bg, color: step.c }}>{step.n}</div>
                <div className="sf-display" style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>{step.title}</div>
                <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.55 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="sf-container" style={{ paddingBlock: 'clamp(34px,5vw,62px)' }}>
        <h2 className="sf-h2" style={{ textAlign: 'center', marginBottom: 30 }} data-reveal>
          Frequently asked questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 780, margin: '0 auto' }}>
          {[
            {
              q: 'What is the required photo size for NEET exam?',
              a: 'NEET (NTA) requires a 200×230 pixel JPEG photo between 10 KB and 200 KB with a plain white background. Select the NEET preset in SnapFit and your photo is auto-cropped, background-swapped and compressed in one click.',
            },
            {
              q: 'What photo size does UPSC CSE require?',
              a: 'UPSC Civil Services requires a 350×350 pixel JPEG between 20 KB and 300 KB. The UPSC preset handles everything — dimensions, background and file size — automatically.',
            },
            {
              q: 'How do I compress a photo to under 50 KB for SSC or IBPS?',
              a: 'Upload your photo, pick the SSC CGL/CHSL or IBPS PO/Clerk preset, and SnapFit auto-reduces JPEG quality in steps until the output fits within the 20–50 KB range. No manual tuning needed.',
            },
            {
              q: 'Can I change my photo background to white online?',
              a: 'Yes — completely free. SnapFit detects the original background by sampling the four corners of your photo and replaces every matching pixel with the colour you choose (white, off-white or blue). Everything runs in your browser.',
            },
            {
              q: 'What is the photo size for JEE Main / Advanced?',
              a: 'JEE Main (NTA) requires 200×230 px, 10–200 KB, JPEG, white background — identical to NEET since both are NTA exams. Choose the JEE Main preset and download in seconds.',
            },
            {
              q: 'Is my photo uploaded to any server?',
              a: 'No. SnapFit uses the HTML5 Canvas API entirely in your browser. Your photo never leaves your device — there is no server, no account required, and no storage.',
            },
            {
              q: 'Can I use a custom photo size not in the preset list?',
              a: 'Yes. Choose the Custom preset and enter your own width (px), height (px), minimum KB and maximum KB. SnapFit will resize and compress to exactly those specs.',
            },
            {
              q: 'What photo format do Indian competitive exams require?',
              a: 'Nearly all Indian exams — NEET, JEE, UPSC, SSC, IBPS, RRB, GATE, NDA, AFCAT, CTET — require JPEG (JPG) format. SnapFit always produces a JPEG output and auto-compresses it to the KB target of the chosen exam.',
            },
          ].map(({ q, a }, i) => (
            <FaqItem key={q} q={q} a={a} idx={i} />
          ))}
        </div>
      </section>

      <footer className="sf-container" style={{ borderTop: '1px solid var(--line)', paddingBlock: 28, display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--faint)', fontWeight: 500, maxWidth: '62ch' }}>
          © 2026 SnapFit · Photos processed locally, never uploaded · Not affiliated with NTA, UPSC, SSC or any examination body.
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {['NEET', 'JEE', 'UPSC', 'SSC', 'IBPS', 'RRB', 'GATE', 'NDA', 'Passport'].map(tag => (
            <span key={tag} style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--faint)' }}>{tag} photo</span>
          ))}
        </div>
      </footer>
    </div>
  )
}

function FaqItem({ q, a, idx }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const id = `faq-${idx}`
  // Toggle imperatively (instead of via the rendered className) so this doesn't
  // clobber the `is-in` class the scroll-reveal IntersectionObserver adds to
  // this same node outside React — otherwise clicking would re-render the
  // className string without `is-in` and the item would snap back to opacity:0.
  useEffect(() => {
    ref.current?.classList.toggle('is-open', open)
  }, [open])
  return (
    <div ref={ref} className="sf-faq" data-reveal style={{ '--d': `${Math.min(idx, 5) * 40}ms` }}>
      <button
        className="sf-faq-q"
        id={`${id}-q`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={id}
      >
        <span>{q}</span>
        <Ico.chevron className="sf-faq-icon" width="18" height="18" />
      </button>
      {/* `inert` (not `hidden`) so the panel can animate its height open */}
      <div className="sf-faq-a" id={id} role="region" aria-labelledby={`${id}-q`} inert={!open}>
        <div><p>{a}</p></div>
      </div>
    </div>
  )
}

// ─── Editor Page ──────────────────────────────────────────────────────────────
function EditorPage({
  preset, onSelectPreset, onCustomField,
  imgSrc, outputUrl, outputKB, quality,
  mode, onSetMode,
  bgColor, replaceBg, threshold, vposPct, zoom,
  onToggleReplace, onSetBg, onSetThreshold, onSetVpos, onSetZoom, onSetQuality,
  onDownload, onGoHome, onUpload,
}) {
  const dims = mode === 'sig' ? preset.sig : preset
  const ok = outputKB >= dims.min && outputKB <= dims.max
  const box = 210
  const scale = Math.min(box / dims.w, 250 / dims.h, 1)
  const previewW = Math.round(dims.w * scale)
  const previewH = Math.round(dims.h * scale)
  const vposLabel = vposPct === 0 ? 'center' : (vposPct < 0 ? `${-vposPct}% up` : `${vposPct}% down`)
  const sizeBg   = ok ? 'var(--tint)' : '#fdeede'
  const sizeDot  = ok ? '#16a34a' : '#e08a1e'
  const sizeInk  = ok ? 'var(--green-ink)' : '#b8650c'
  const sizeMark = ok ? '✓' : '!'

  return (
    <div className="sf-page" style={{
      maxWidth: 1180, width: '100%', margin: '0 auto',
      padding: 'clamp(18px,3vw,30px) clamp(16px,5vw,40px) 50px',
      animation: 'fadeup .35s var(--ease-out) both',
    }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
        <button onClick={onGoHome} style={{
          border: '1px solid var(--line)', background: 'var(--surface)', cursor: 'pointer',
          fontFamily: 'inherit', fontWeight: 700, fontSize: 13.5, color: 'var(--ink)',
          padding: '9px 15px', borderRadius: 11, display: 'inline-flex', alignItems: 'center', gap: 7,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </button>

        <div style={{ fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--muted)', fontWeight: 600, fontSize: 13 }}>Editing for</span>
          {preset.name}
        </div>

        <button onClick={onUpload} style={{
          border: '1px solid var(--line)', background: 'var(--surface)', cursor: 'pointer',
          fontFamily: 'inherit', fontWeight: 700, fontSize: 13.5, color: 'var(--ink)',
          padding: '9px 15px', borderRadius: 11,
        }}>
          Replace
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>

        {/* PREVIEW PANEL */}
        <div style={{ flex: '1 1 380px', minWidth: 300 }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--line)',
            borderRadius: 22, padding: 'clamp(18px,3vw,28px)',
            boxShadow: '0 12px 34px -20px rgba(22,36,27,.3)',
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22, justifyContent: 'center', alignItems: 'flex-start' }}>
              {/* Original */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>
                  Original
                </div>
                <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: 8, display: 'inline-block' }}>
                  {imgSrc && <img src={imgSrc} alt="Original" style={{ display: 'block', maxWidth: 200, maxHeight: 240, borderRadius: 6, objectFit: 'contain' }} />}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', alignSelf: 'center', color: 'var(--faint)' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </div>

              {/* Output */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--green-ink)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>
                  Exam-ready
                </div>
                <div style={{ background: 'var(--tint)', borderRadius: 12, padding: 8, display: 'inline-block', boxShadow: '0 0 0 2px rgba(21,128,61,.18)' }}>
                  {outputUrl && (
                    <img
                      src={outputUrl}
                      alt="Output"
                      style={{ display: 'block', width: previewW, height: previewH, borderRadius: 6, objectFit: 'contain', background: '#fff' }}
                    />
                  )}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', fontFamily: "'JetBrains Mono',monospace", marginTop: 8 }}>
                  {dims.w}×{dims.h} px
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 22, paddingTop: 20, borderTop: '1px solid var(--line)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--tint)', padding: '8px 13px', borderRadius: 10 }}>
                <span style={{ width: 18, height: 18, borderRadius: 99, background: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>✓</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--green-ink)' }}>Dimensions {dims.w}×{dims.h}</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: sizeBg, padding: '8px 13px', borderRadius: 10 }}>
                <span style={{ width: 18, height: 18, borderRadius: 99, background: sizeDot, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>{sizeMark}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: sizeInk }}>{outputKB} KB · target {dims.min}–{dims.max}</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--tint)', padding: '8px 13px', borderRadius: 10 }}>
                <span style={{ width: 18, height: 18, borderRadius: 99, background: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>✓</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--green-ink)' }}>JPEG format</span>
              </div>
            </div>
          </div>

          {/* Quality / file-size slider */}
          <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>File size / Quality</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, fontSize: 13, color: 'var(--green-ink)' }}>
                {Math.round(quality * 100)}% · {outputKB} KB
              </span>
            </div>
            <input type="range" min="20" max="100" value={Math.round(quality * 100)} onChange={onSetQuality} style={{ width: '100%' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 600, color: 'var(--faint)', marginTop: 3 }}>
              <span>← smaller file</span><span>larger file →</span>
            </div>
            {outputKB > dims.max && (
              <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: '#b45309', background: '#fef3c7', borderRadius: 7, padding: '5px 9px' }}>
                {outputKB} KB exceeds {dims.max} KB limit — slide left to reduce
              </div>
            )}
          </div>

          <button onClick={onDownload} style={{
            width: '100%', marginTop: 10, border: 'none', cursor: 'pointer',
            background: 'var(--green)', color: '#fff', fontFamily: 'inherit', fontWeight: 800,
            fontSize: 16, padding: 16, borderRadius: 14,
            boxShadow: '0 10px 24px rgba(21,128,61,.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4v12M7 11l5 5 5-5" />
              <path d="M5 20h14" />
            </svg>
            Download exam photo ({outputKB} KB)
          </button>
        </div>

        {/* CONTROLS PANEL */}
        <div style={{ flex: '0 1 360px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Photo / Signature toggle */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 18, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
              {mode === 'sig' ? 'Signature mode' : 'Photo mode'}
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginTop: 2, fontFamily: "'JetBrains Mono',monospace" }}>
                {dims.w}×{dims.h} px · {dims.min}–{dims.max} KB
              </div>
            </div>
            <div style={{ display: 'inline-flex', background: 'var(--surface2)', borderRadius: 99, padding: 3, flexShrink: 0 }}>
              {[{ val: 'photo', label: '📷 Photo' }, { val: 'sig', label: '✍ Signature' }].map(opt => (
                <button key={opt.val} onClick={() => onSetMode(opt.val)} style={{
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 12,
                  padding: '7px 13px', borderRadius: 99,
                  background: mode === opt.val ? 'var(--green)' : 'transparent',
                  color: mode === opt.val ? '#fff' : 'var(--muted)',
                  transition: 'background .15s, color .15s',
                }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Exam preset */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 18, padding: 18 }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--green)', display: 'inline-block' }} />
              Exam preset
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxHeight: 260, overflowY: 'auto', paddingRight: 2 }}>
              {PRESETS.map(p => {
                const sel = p.id === preset.id
                return (
                  <div key={p.id} onClick={() => onSelectPreset(p)} style={{
                    cursor: 'pointer',
                    border: `1.5px solid ${sel ? p.ink : 'var(--line)'}`,
                    background: sel ? p.tint : 'var(--surface)',
                    borderRadius: 11, padding: '9px 10px', textAlign: 'left',
                  }}>
                    <div title={p.name} style={{ fontWeight: 700, fontSize: 11.5, color: sel ? p.ink : 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--faint)', fontFamily: "'JetBrains Mono',monospace" }}>
                      {p.id === 'custom' ? 'custom' : `${p.w}×${p.h}`}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Custom dimensions — shown only when Custom preset is selected */}
          {preset.id === 'custom' && (
            <div style={{ background: 'var(--surface)', border: `1.5px dashed ${preset.ink}`, borderRadius: 18, padding: 18 }}>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: 99, background: preset.ink, display: 'inline-block' }} />
                Custom dimensions
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { key: 'w',   label: 'Width',    unit: 'px',  min: 10,  max: 3000 },
                  { key: 'h',   label: 'Height',   unit: 'px',  min: 10,  max: 3000 },
                  { key: 'min', label: 'Min size', unit: 'KB',  min: 1,   max: 50000 },
                  { key: 'max', label: 'Max size', unit: 'KB',  min: 1,   max: 50000 },
                ].map(({ key, label, unit, min, max }) => (
                  <div key={key}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 5 }}>
                      {label} <span style={{ color: 'var(--faint)', fontWeight: 500 }}>({unit})</span>
                    </div>
                    <input
                      className="custom-input"
                      type="number"
                      min={min}
                      max={max}
                      value={preset[key]}
                      onChange={e => onCustomField(key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--faint)', fontWeight: 500, marginTop: 10 }}>
                Output will be resized to exactly {preset.w}×{preset.h} px and compressed to ≤{preset.max} KB.
              </div>
            </div>
          )}

          {/* Background */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 18, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
              <div style={{ fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--green)', display: 'inline-block' }} />
                Background
              </div>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--ink)', userSelect: 'none' }}>
                <span onClick={onToggleReplace} style={{
                  width: 36, height: 20, borderRadius: 99,
                  background: replaceBg ? 'var(--green)' : '#cbd4c8',
                  position: 'relative', transition: 'background .2s', display: 'inline-block', cursor: 'pointer',
                }}>
                  <span style={{
                    position: 'absolute', top: 2,
                    left: replaceBg ? 18 : 2,
                    width: 16, height: 16, borderRadius: 99,
                    background: 'var(--surface)', transition: 'left .2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,.3)',
                  }} />
                </span>
                Replace
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {BG_OPTIONS.map(b => (
                <div key={b.hex} onClick={() => onSetBg(b.hex)} style={{ cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 11, background: b.hex,
                    border: `2px solid ${b.hex === bgColor ? 'var(--green)' : 'var(--line)'}`,
                    boxShadow: '0 1px 4px var(--line)',
                  }} />
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', marginTop: 5 }}>{b.name}</div>
                </div>
              ))}
            </div>
            {replaceBg && (
              <div style={{ marginTop: 15 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>
                  <span>Background sensitivity</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", color: 'var(--green-ink)' }}>{threshold}</span>
                </div>
                <input type="range" min="20" max="120" value={threshold} onChange={onSetThreshold} />
                <div style={{ fontSize: 10.5, color: 'var(--faint)', fontWeight: 500, marginTop: 4 }}>
                  Higher = removes more of the old background. Works best on plain backgrounds.
                </div>
              </div>
            )}
          </div>

          {/* Framing */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 18, padding: 18 }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--green)', display: 'inline-block' }} />
              Face framing
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>
              <span>Vertical position</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", color: 'var(--green-ink)' }}>{vposLabel}</span>
            </div>
            <input type="range" min="-40" max="40" value={vposPct} onChange={onSetVpos} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 600, color: 'var(--faint)', marginTop: 2 }}>
              <span>↑ up</span><span>center</span><span>down ↓</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', margin: '16px 0 6px' }}>
              <span>Zoom</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", color: 'var(--green-ink)' }}>{zoom}%</span>
            </div>
            <input type="range" min="100" max="180" value={zoom} onChange={onSetZoom} />
          </div>


        </div>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,    setScreen]    = useState('home')
  const [dark,      setDark]      = useState(() => {
    const saved = localStorage.getItem('snapfit-theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const [imgSrc,    setImgSrc]    = useState(null)
  const [preset,    setPreset]    = useState(PRESETS[0])
  const [bgColor,   setBgColor]   = useState('#ffffff')
  const [replaceBg, setReplaceBg] = useState(true)
  const [threshold, setThreshold] = useState(70)
  const [vposPct,   setVposPct]   = useState(0)
  const [zoom,      setZoom]      = useState(100)
  const [outputUrl, setOutputUrl] = useState(null)
  const [outputKB,  setOutputKB]  = useState(0)
  const [quality,   setQuality]   = useState(0.92)
  const [mode,      setMode]      = useState('photo')
  const [processKey, setProcessKey] = useState(0)

  const fileRef  = useRef(null)
  const imgElRef = useRef(null)
  const canvasRef = useRef(null)

  // Re-run canvas processing whenever any parameter or image changes
  useEffect(() => {
    const img = imgElRef.current
    if (!img) return
    if (!canvasRef.current) canvasRef.current = document.createElement('canvas')

    const dims = mode === 'sig' ? preset.sig : preset

    const canvas = canvasRef.current
    canvas.width  = dims.w
    canvas.height = dims.h
    const ctx = canvas.getContext('2d')

    ctx.clearRect(0, 0, dims.w, dims.h)
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, dims.w, dims.h)

    const s = Math.max(dims.w / img.width, dims.h / img.height) * (zoom / 100)
    const dw = img.width * s
    const dh = img.height * s
    const dx = (dims.w - dw) / 2
    const dy = (dims.h - dh) / 2 + (vposPct / 100) * dims.h
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, dx, dy, dw, dh)

    if (replaceBg) {
      try {
        const id = ctx.getImageData(0, 0, dims.w, dims.h)
        applyBgReplace(id.data, dims.w, dims.h, bgColor, threshold)
        ctx.putImageData(id, 0, 0)
      } catch (_) {}
    }

    const url = canvas.toDataURL('image/jpeg', quality)
    const kb  = kbOf(url)
    setOutputUrl(url)
    setOutputKB(kb)
  }, [preset, mode, bgColor, replaceBg, threshold, vposPct, zoom, processKey, quality])

  const openFile = useCallback(() => fileRef.current?.click(), [])

  const loadFile = useCallback((file) => {
    if (!file?.type?.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const src = ev.target.result
      const img = new Image()
      img.onload = () => {
        imgElRef.current = img
        setImgSrc(src)
        setScreen('editor')
        setProcessKey(k => k + 1)
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }, [])

  const handleFile = useCallback((e) => {
    loadFile(e.target.files?.[0])
    e.target.value = ''
  }, [loadFile])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    loadFile(e.dataTransfer.files?.[0])
  }, [loadFile])

  const handleSelectPreset = useCallback((p) => {
    // When switching TO custom, seed with CUSTOM_BASE so dimensions stay editable.
    // When switching FROM custom TO another preset, use the new preset's bg.
    setPreset(p.id === 'custom' ? { ...CUSTOM_BASE } : p)
    setBgColor(p.bg)
  }, [])

  const handleCustomField = useCallback((key, rawVal) => {
    const val = Math.max(1, Number(rawVal) || 1)
    setPreset(prev => ({ ...prev, [key]: val }))
  }, [])

  const download = useCallback(() => {
    if (!outputUrl) return
    const a = document.createElement('a')
    a.href     = outputUrl
    a.download = `${preset.id}_exam_photo_${outputKB}kb.jpg`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }, [outputUrl, preset.id, outputKB])

  // Persist the theme choice and hand it to the UA so form controls / scrollbars follow.
  useEffect(() => {
    localStorage.setItem('snapfit-theme', dark ? 'dark' : 'light')
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  }, [dark])

  // Screens mount their own [data-reveal] nodes — re-arm the observer on each change.
  useRevealOnScroll(screen)

  return (
    <div className={`shell${dark ? ' dark' : ''}`}>
      {/* Ambient aurora + film grain — decorative, never interactive */}
      <div className="sf-atmos" aria-hidden="true">
        <span className="sf-blob sf-blob--a" />
        <span className="sf-blob sf-blob--b" />
        <span className="sf-blob sf-blob--c" />
        <span className="sf-grain" />
      </div>

      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />

      <Nav
        dark={dark}
        onToggleDark={() => setDark(d => !d)}
        onUpload={openFile}
        onGoHome={() => setScreen('home')}
        onOpenPdf={() => setScreen('pdf')}
      />

      {screen === 'home' && (
        <HomePage
          onUpload={openFile}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onDragLeave={e => e.preventDefault()}
          onSelectPreset={(p) => { handleSelectPreset(p); openFile() }}
          onOpenPdf={() => setScreen('pdf')}
          mode={mode}
          onSetMode={setMode}
        />
      )}

      {screen === 'editor' && (
        <EditorPage
          preset={preset}
          onSelectPreset={handleSelectPreset}
          onCustomField={handleCustomField}
          imgSrc={imgSrc}
          outputUrl={outputUrl}
          outputKB={outputKB}
          quality={quality}
          bgColor={bgColor}
          replaceBg={replaceBg}
          threshold={threshold}
          vposPct={vposPct}
          zoom={zoom}
          onToggleReplace={() => setReplaceBg(r => !r)}
          onSetBg={(hex) => setBgColor(hex)}
          onSetThreshold={(e) => setThreshold(+e.target.value)}
          onSetVpos={(e) => setVposPct(+e.target.value)}
          onSetZoom={(e) => setZoom(+e.target.value)}
          onSetQuality={(e) => setQuality(+e.target.value / 100)}
          mode={mode}
          onSetMode={setMode}
          onDownload={download}
          onGoHome={() => setScreen('home')}
          onUpload={openFile}
        />
      )}

      {screen === 'pdf' && (
        <PdfScreen onBack={() => setScreen('home')} />
      )}
    </div>
  )
}
