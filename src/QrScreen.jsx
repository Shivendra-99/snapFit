import { useState, useRef, useEffect } from 'react'
import QRCode from 'qrcode'

const SIZE = 1024 // export resolution; the preview just scales it down via CSS

const card = { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 18, padding: 18 }
const label = { fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, display: 'block' }
const input = {
  width: '100%', boxSizing: 'border-box', border: '1px solid var(--line)', background: 'var(--surface2)',
  color: 'var(--ink)', fontFamily: 'inherit', fontSize: 14, padding: '11px 13px', borderRadius: 11,
}
const ghost = {
  border: '1px solid var(--line)', background: 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit',
  fontWeight: 700, fontSize: 13.5, color: 'var(--ink)', padding: '9px 15px', borderRadius: 11,
}

export default function QrScreen({ onBack }) {
  const [text,  setText]  = useState('https://www.snapfit.in')
  const [fg,    setFg]    = useState('#000000')
  const [bg,    setBg]    = useState('#ffffff')
  const [logo,  setLogo]  = useState(null)   // HTMLImageElement | null
  const [logoPct, setLogoPct] = useState(22) // logo width as % of the QR
  const canvasRef = useRef(null)
  const fileRef   = useRef(null)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv || !text.trim()) return
    // Level H survives ~30% of the code being covered — that's what lets a logo sit on top.
    QRCode.toCanvas(cv, text, {
      width: SIZE, margin: 2, errorCorrectionLevel: logo ? 'H' : 'M', color: { dark: fg, light: bg },
    }).then(() => {
      cv.style.width = '100%'; cv.style.height = 'auto' // qrcode pins the CSS size to SIZE px
      if (!logo) return
      const ctx = cv.getContext('2d')
      const w = SIZE * logoPct / 100
      const h = w * logo.naturalHeight / logo.naturalWidth
      const pad = w * 0.12
      ctx.fillStyle = bg
      ctx.beginPath()
      ctx.roundRect((SIZE - w) / 2 - pad, (SIZE - h) / 2 - pad, w + 2 * pad, h + 2 * pad, pad)
      ctx.fill()
      ctx.drawImage(logo, (SIZE - w) / 2, (SIZE - h) / 2, w, h)
    }).catch(() => {}) // text too long for a QR → keep the last good render
  }, [text, fg, bg, logo, logoPct])

  const pickLogo = (file) => {
    if (!file) return
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => { setLogo(img); URL.revokeObjectURL(url) }
    img.src = url
  }

  const download = () => {
    canvasRef.current.toBlob(blob => {
      const url = URL.createObjectURL(blob)
      Object.assign(document.createElement('a'), { href: url, download: 'qr-code.png' }).click()
      URL.revokeObjectURL(url)
    })
  }

  // A4 page with the QR centred near the top, 120 mm square (print-ready; vector-sharp enough at 1024px).
  const downloadPdf = async () => {
    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
    pdf.addImage(canvasRef.current.toDataURL('image/png'), 'PNG', 45, 40, 120, 120, undefined, 'FAST')
    pdf.save('qr-code.pdf')
  }

  return (
    <div className="sf-page" style={{ maxWidth: 980, width: '100%', margin: '0 auto', padding: 'clamp(18px,3vw,30px) clamp(16px,5vw,40px) 50px' }}>
      <button onClick={onBack} style={{ ...ghost, display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 24 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        Back
      </button>

      <h1 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 700, letterSpacing: '-.03em', marginBottom: 8 }}>QR Code Generator</h1>
      <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 26 }}>
        A QR code is the square barcode people scan with their phone camera to open your website. Paste your link, add your logo if you want, and download it as a PNG or PDF. Free, no sign-up, made in your browser.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
        {/* Controls */}
        <div style={{ ...card, flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={label} htmlFor="qr-text">Website link or text</label>
            <textarea id="qr-text" rows={3} value={text} onChange={e => setText(e.target.value)} placeholder="https://yourwebsite.com" style={{ ...input, resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={label} htmlFor="qr-fg">QR colour</label>
              <input id="qr-fg" type="color" value={fg} onChange={e => setFg(e.target.value)} style={{ ...input, padding: 3, height: 42 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={label} htmlFor="qr-bg">Background</label>
              <input id="qr-bg" type="color" value={bg} onChange={e => setBg(e.target.value)} style={{ ...input, padding: 3, height: 42 }} />
            </div>
          </div>

          <div>
            <span style={label}>Logo (optional)</span>
            <input ref={fileRef} type="file" accept="image/*" onChange={e => { pickLogo(e.target.files?.[0]); e.target.value = '' }} style={{ display: 'none' }} />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => fileRef.current?.click()} style={ghost}>{logo ? 'Change logo' : 'Add logo'}</button>
              {logo && <button onClick={() => setLogo(null)} style={ghost}>Remove</button>}
            </div>
            {logo && (
              <div style={{ marginTop: 14 }}>
                <label style={label} htmlFor="qr-logo-size">Logo size · {logoPct}%</label>
                <input id="qr-logo-size" type="range" min={10} max={28} value={logoPct} onChange={e => setLogoPct(+e.target.value)} style={{ width: '100%' }} />
                <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 4 }}>Keep it small — a bigger logo can make the code harder to scan. Test it with your phone before printing.</div>
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div style={{ flex: '1 1 320px', maxWidth: 420 }}>
          <div style={{ ...card, padding: 14 }}>
            <canvas ref={canvasRef} width={SIZE} height={SIZE} role="img" aria-label="Generated QR code" style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 10 }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={download} disabled={!text.trim()}
              style={{ flex: 1, border: 'none', cursor: 'pointer', background: 'var(--green)', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 15, padding: 16, borderRadius: 14, boxShadow: '0 10px 24px rgba(21,128,61,.3)' }}>
              Download PNG
            </button>
            <button onClick={downloadPdf} disabled={!text.trim()}
              style={{ ...ghost, flex: 1, fontWeight: 800, fontSize: 15, padding: 16, borderRadius: 14 }}>
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
