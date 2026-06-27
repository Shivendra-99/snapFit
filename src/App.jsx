import { useState, useRef, useEffect, useCallback } from 'react'
import './index.css'

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
  // ── Medical / Engineering ──────────────────────────────────────────────
  { id: 'neet',   name: 'NEET UG',          abbr: 'NEET', w: 200, h: 230, bg: '#ffffff', min: 10,  max: 200, ...G.green  },
  { id: 'jee',    name: 'JEE Main / Adv.',  abbr: 'JEE',  w: 200, h: 230, bg: '#ffffff', min: 10,  max: 200, ...G.green  },
  { id: 'gate',   name: 'GATE',             abbr: 'GATE', w: 240, h: 320, bg: '#ffffff', min: 5,   max: 200, ...G.green  },
  { id: 'cuet',   name: 'CUET UG/PG',       abbr: 'CUET', w: 200, h: 230, bg: '#ffffff', min: 10,  max: 200, ...G.blue   },
  { id: 'cat',    name: 'CAT (IIM)',         abbr: 'CAT',  w: 100, h: 130, bg: '#ffffff', min: 10,  max: 50,  ...G.blue   },
  // ── Civil Services ────────────────────────────────────────────────────
  { id: 'upsc',   name: 'UPSC CSE',         abbr: 'UPSC', w: 350, h: 350, bg: '#ffffff', min: 20,  max: 300, ...G.green  },
  { id: 'ugcnet', name: 'UGC NET / SET',    abbr: 'NET',  w: 200, h: 230, bg: '#ffffff', min: 10,  max: 100, ...G.green  },
  { id: 'bpsc',   name: 'BPSC',             abbr: 'BPSC', w: 215, h: 265, bg: '#ffffff', min: 10,  max: 50,  ...G.orange },
  { id: 'tnpsc',  name: 'TNPSC',            abbr: 'TN',   w: 150, h: 200, bg: '#ffffff', min: 10,  max: 40,  ...G.orange },
  { id: 'mpsc',   name: 'MPSC / UPPSC',     abbr: 'PSC',  w: 200, h: 230, bg: '#ffffff', min: 10,  max: 50,  ...G.orange },
  // ── Staff Selection ───────────────────────────────────────────────────
  { id: 'ssc',    name: 'SSC CGL / CHSL',   abbr: 'SSC',  w: 200, h: 230, bg: '#ffffff', min: 20,  max: 50,  ...G.orange },
  { id: 'ctet',   name: 'CTET / DSSSB',     abbr: 'CTET', w: 200, h: 230, bg: '#ffffff', min: 20,  max: 50,  ...G.orange },
  // ── Banking & Finance ─────────────────────────────────────────────────
  { id: 'ibps',   name: 'IBPS PO / Clerk',  abbr: 'IBPS', w: 200, h: 230, bg: '#ffffff', min: 20,  max: 50,  ...G.blue   },
  { id: 'sbi',    name: 'SBI PO / Clerk',   abbr: 'SBI',  w: 200, h: 230, bg: '#ffffff', min: 20,  max: 50,  ...G.blue   },
  { id: 'rbi',    name: 'RBI Grade B',       abbr: 'RBI',  w: 200, h: 230, bg: '#ffffff', min: 20,  max: 50,  ...G.blue   },
  { id: 'lic',    name: 'LIC AAO / ADO',    abbr: 'LIC',  w: 200, h: 230, bg: '#ffffff', min: 20,  max: 50,  ...G.blue   },
  // ── Railway ───────────────────────────────────────────────────────────
  { id: 'rrb',    name: 'RRB / NTPC',       abbr: 'RRB',  w: 130, h: 160, bg: '#ffffff', min: 15,  max: 40,  ...G.orange },
  // ── Defence ───────────────────────────────────────────────────────────
  { id: 'nda',    name: 'NDA / CDS',        abbr: 'NDA',  w: 200, h: 240, bg: '#ffffff', min: 20,  max: 50,  ...G.navy   },
  { id: 'afcat',  name: 'AFCAT',            abbr: 'AF',   w: 200, h: 240, bg: '#ffffff', min: 10,  max: 50,  ...G.navy   },
  // ── ID Documents ─────────────────────────────────────────────────────
  { id: 'pass',   name: 'Passport 35×45',   abbr: 'PP',   w: 413, h: 531, bg: '#ffffff', min: 20,  max: 100, ...G.orange },
  { id: 'visa',   name: 'US Visa 2×2"',     abbr: 'VISA', w: 600, h: 600, bg: '#ffffff', min: 100, max: 240, ...G.navy   },
  // ── Custom ────────────────────────────────────────────────────────────
  { id: 'custom', name: 'Custom',            abbr: '✎',    w: 200, h: 230, bg: '#ffffff', min: 10,  max: 200, ...G.purple },
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

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav({ dark, onToggleDark, onUpload, onGoHome }) {
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      padding: '16px clamp(18px,5vw,56px)', position: 'sticky', top: 0, zIndex: 30,
      background: 'var(--navbg)', backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--line)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer' }} onClick={onGoHome}>
        <div style={{
          width: 38, height: 38, borderRadius: 11, background: 'var(--green)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(21,128,61,.32)',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="6" width="18" height="14" rx="2.5" />
            <circle cx="12" cy="13" r="3.4" />
            <path d="M8 6l1.4-2.4h5.2L16 6" />
          </svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-.02em' }}>SnapFit</span>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--muted)', letterSpacing: '.02em' }}>Exam Photo Fixer</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onToggleDark} title="Toggle light / dark" style={{
          border: '1px solid var(--line)', background: 'var(--surface)', cursor: 'pointer',
          width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: 'var(--ink)', padding: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" />
          </svg>
        </button>

        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600,
          color: 'var(--green-ink)', background: 'var(--tint)', padding: '7px 13px',
          borderRadius: 99, border: '1px solid rgba(21,128,61,.16)',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: 99, background: '#16a34a', display: 'inline-block' }} />
          100% in your browser
        </span>

        <button onClick={onUpload} style={{
          border: 'none', cursor: 'pointer', background: 'var(--green)', color: '#fff',
          fontFamily: 'inherit', fontWeight: 700, fontSize: 13.5, padding: '10px 18px',
          borderRadius: 11, boxShadow: '0 4px 12px rgba(21,128,61,.28)',
        }}>
          Upload photo
        </button>
      </div>
    </nav>
  )
}

// ─── Home Page ────────────────────────────────────────────────────────────────
function HomePage({ onUpload, onDrop, onDragOver, onDragLeave, onSelectPreset }) {
  return (
    <div style={{ flex: 1 }}>
      {/* HERO */}
      <section style={{
        display: 'flex', flexWrap: 'wrap', gap: 'clamp(28px,5vw,64px)', alignItems: 'center',
        maxWidth: 1180, margin: '0 auto',
        padding: 'clamp(28px,5vw,64px) clamp(18px,5vw,56px) clamp(20px,4vw,44px)',
      }}>
        <div style={{ flex: '1 1 360px', animation: 'fadeup .5s ease both' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--surface)',
            border: '1px solid var(--line)', padding: '7px 13px', borderRadius: 99,
            fontSize: 12.5, fontWeight: 700, color: '#b8650c',
            boxShadow: '0 2px 8px rgba(22,36,27,.04)', marginBottom: 20,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: '#f08a24', display: 'inline-block' }} />
            Built for Indian competitive exams
          </div>

          <h1 style={{
            fontSize: 'clamp(34px,5.4vw,56px)', lineHeight: 1.04,
            letterSpacing: '-.03em', fontWeight: 800, margin: '0 0 18px',
          }}>
            Exam photo,<br />fixed in <span style={{ color: 'var(--green)' }}>one click</span>.
          </h1>

          <p style={{
            fontSize: 'clamp(15px,1.6vw,18px)', lineHeight: 1.55, color: 'var(--muted)',
            margin: '0 0 26px', maxWidth: 460,
          }}>
            Auto-crop, change the background, and compress to the exact size NEET, SSC, UPSC,
            IBPS and more demand — no software, no sign-up, nothing leaves your phone.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <button onClick={onUpload} style={{
              border: 'none', cursor: 'pointer', background: 'var(--green)', color: '#fff',
              fontFamily: 'inherit', fontWeight: 700, fontSize: 15.5, padding: '15px 26px',
              borderRadius: 14, boxShadow: '0 8px 22px rgba(21,128,61,.3)',
              display: 'inline-flex', alignItems: 'center', gap: 9,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 16V4M7 9l5-5 5 5" />
                <path d="M5 16v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3" />
              </svg>
              Upload your photo
            </button>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>JPG / PNG · no sign-up · free</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22, marginTop: 34 }}>
            {[
              { val: '20+',      label: 'exam presets' },
              { val: '10–300KB', label: 'auto-compressed' },
              { val: '0',        label: 'uploads to server' },
            ].map((stat, i) => (
              <>
                {i > 0 && <div key={`div-${i}`} style={{ width: 1, background: 'var(--line)' }} />}
                <div key={stat.label}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>{stat.val}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--muted)' }}>{stat.label}</div>
                </div>
              </>
            ))}
          </div>
        </div>

        {/* Upload card */}
        <div style={{ flex: '1 1 340px', animation: 'fadeup .6s ease both' }}>
          <div
            className="upload-area"
            onClick={onUpload}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
          >
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(120% 80% at 50% -10%,var(--tint) 0%,transparent 60%)',
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 74, height: 74, margin: '0 auto 18px', borderRadius: 20,
                background: 'var(--green)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', animation: 'floaty 3.4s ease-in-out infinite',
                boxShadow: '0 10px 24px rgba(21,128,61,.34)',
              }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 15V3M8 7l4-4 4 4" />
                  <path d="M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
                </svg>
              </div>
              <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 6 }}>Drop your photo here</div>
              <div style={{ fontSize: 13.5, color: 'var(--muted)', fontWeight: 500, marginBottom: 20 }}>
                or click to browse · JPG, PNG up to 20MB
              </div>
              <span style={{
                display: 'inline-block', background: 'var(--tint)', color: 'var(--green)',
                fontWeight: 700, fontSize: 13.5, padding: '11px 22px', borderRadius: 11,
                animation: 'pulsering 2.4s infinite',
              }}>
                Choose file
              </span>
              <div style={{ marginTop: 20, display: 'flex', gap: 7, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['Auto crop', 'BG replace', 'KB fit'].map(tag => (
                  <span key={tag} style={{
                    fontSize: 11, fontWeight: 600, color: 'var(--faint)',
                    background: 'var(--surface2)', padding: '5px 10px', borderRadius: 7,
                  }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRESETS */}
      <section style={{
        maxWidth: 1180, margin: '0 auto',
        padding: 'clamp(18px,3vw,32px) clamp(18px,5vw,56px) clamp(28px,4vw,48px)',
      }}>
        <div style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'baseline',
          justifyContent: 'space-between', gap: 10, marginBottom: 22,
        }}>
          <h2 style={{ fontSize: 'clamp(22px,2.6vw,30px)', fontWeight: 800, letterSpacing: '-.02em', margin: 0 }}>
            Pick your exam
          </h2>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
            We auto-apply the official-style dimensions & file size
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(168px,1fr))', gap: 14 }}>
          {PRESETS.map(p => (
            <div
              key={p.id}
              className="preset-card"
              onClick={() => onSelectPreset(p)}
              style={p.id === 'custom' ? { borderStyle: 'dashed', borderColor: p.ink, opacity: 0.9 } : {}}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 11, background: p.tint,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: p.id === 'custom' ? 20 : 13, color: p.ink,
                }}>{p.abbr}</div>
                {p.id !== 'custom' && (
                  <div style={{ width: 26, height: 32, borderRadius: 4, background: '#ffffff', border: '1.5px solid var(--line)' }} />
                )}
              </div>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-.01em', marginBottom: 3 }}>{p.name}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', fontFamily: "'JetBrains Mono',monospace" }}>
                {p.id === 'custom' ? 'any size · any KB' : `${p.w}×${p.h} px`}
              </div>
              <div style={{
                fontSize: 11.5, fontWeight: 600, color: p.ink, background: p.tint,
                display: 'inline-block', padding: '3px 8px', borderRadius: 6, marginTop: 10,
              }}>
                {p.id === 'custom' ? 'fully custom' : `${p.min}–${p.max} KB`}
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 11.5, color: 'var(--faint)', fontWeight: 500, margin: '18px 0 0', textAlign: 'center' }}>
          Specs are illustrative defaults — always confirm exact requirements in the official exam notification before final upload.
        </p>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(34px,5vw,58px) clamp(18px,5vw,56px)' }}>
          <h2 style={{
            fontSize: 'clamp(22px,2.6vw,30px)', fontWeight: 800, letterSpacing: '-.02em',
            margin: '0 0 28px', textAlign: 'center',
          }}>
            Three steps. Thirty seconds.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 18 }}>
            {[
              { n: 1, bg: 'var(--tint)', c: 'var(--green)', title: 'Upload',           desc: "Drop any selfie or studio photo. It never leaves your device." },
              { n: 2, bg: '#fdeede',     c: '#c4730e',       title: 'Pick exam & tweak', desc: "We crop to size, swap the background, and frame the face for you." },
              { n: 3, bg: 'var(--tint)', c: 'var(--green)', title: 'Download',          desc: "Get a JPG that already fits the exact KB range. Upload & done." },
            ].map(step => (
              <div key={step.n} style={{ textAlign: 'center', padding: 10 }}>
                <div style={{
                  width: 54, height: 54, borderRadius: 16, background: step.bg, color: step.c,
                  fontWeight: 800, fontSize: 20, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', margin: '0 auto 16px',
                }}>{step.n}</div>
                <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 6 }}>{step.title}</div>
                <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — targeted at search queries like "NEET photo size", "compress to 50kb" */}
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(34px,5vw,58px) clamp(18px,5vw,56px)' }}>
        <h2 style={{ fontSize: 'clamp(22px,2.6vw,30px)', fontWeight: 800, letterSpacing: '-.02em', margin: '0 0 28px', textAlign: 'center' }}>
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
            <FaqItem key={i} q={q} a={a} />
          ))}
        </div>
      </section>

      <footer style={{ borderTop: '1px solid var(--line)', padding: '28px clamp(18px,5vw,56px)', display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--faint)', fontWeight: 500 }}>
          © 2026 SnapFit · Photos processed locally, never uploaded · Not affiliated with NTA, UPSC, SSC or any examination body.
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {['NEET', 'JEE', 'UPSC', 'SSC', 'IBPS', 'RRB', 'GATE', 'NDA', 'Passport'].map(tag => (
            <span key={tag} style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--faint)' }}>{tag} photo</span>
          ))}
        </div>
      </footer>
    </div>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
          padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          fontFamily: 'inherit', fontWeight: 700, fontSize: 14.5, color: 'var(--ink)',
        }}
      >
        <span>{q}</span>
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="var(--green)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div style={{ padding: '0 20px 16px', fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.65, borderTop: '1px solid var(--line)' }}>
          {a}
        </div>
      )}
    </div>
  )
}

// ─── Editor Page ──────────────────────────────────────────────────────────────
function EditorPage({
  preset, onSelectPreset, onCustomField,
  imgSrc, outputUrl, outputKB, quality,
  bgColor, replaceBg, threshold, vposPct, zoom,
  onToggleReplace, onSetBg, onSetThreshold, onSetVpos, onSetZoom,
  onDownload, onGoHome, onUpload,
}) {
  const ok = outputKB >= preset.min && outputKB <= preset.max
  const box = 210
  const scale = Math.min(box / preset.w, 250 / preset.h, 1)
  const previewW = Math.round(preset.w * scale)
  const previewH = Math.round(preset.h * scale)
  const vposLabel = vposPct === 0 ? 'center' : (vposPct < 0 ? `${-vposPct}% up` : `${vposPct}% down`)
  const sizeBg   = ok ? 'var(--tint)' : '#fdeede'
  const sizeDot  = ok ? '#16a34a' : '#e08a1e'
  const sizeInk  = ok ? 'var(--green-ink)' : '#b8650c'
  const sizeMark = ok ? '✓' : '!'

  return (
    <div style={{
      flex: 1, maxWidth: 1180, width: '100%', margin: '0 auto',
      padding: 'clamp(18px,3vw,30px) clamp(16px,5vw,40px) 50px',
      animation: 'fadeup .35s ease both',
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
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>
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
                  {preset.w}×{preset.h} px
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 22, paddingTop: 20, borderTop: '1px solid var(--line)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--tint)', padding: '8px 13px', borderRadius: 10 }}>
                <span style={{ width: 18, height: 18, borderRadius: 99, background: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>✓</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--green-ink)' }}>Dimensions {preset.w}×{preset.h}</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: sizeBg, padding: '8px 13px', borderRadius: 10 }}>
                <span style={{ width: 18, height: 18, borderRadius: 99, background: sizeDot, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>{sizeMark}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: sizeInk }}>{outputKB} KB · target {preset.min}–{preset.max}</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--tint)', padding: '8px 13px', borderRadius: 10 }}>
                <span style={{ width: 18, height: 18, borderRadius: 99, background: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>✓</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--green-ink)' }}>JPEG format</span>
              </div>
            </div>
          </div>

          <button onClick={onDownload} style={{
            width: '100%', marginTop: 16, border: 'none', cursor: 'pointer',
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
                    <div style={{ fontWeight: 700, fontSize: 12.5, color: sel ? p.ink : 'var(--ink)' }}>{p.name}</div>
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
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", color: 'var(--green)' }}>{threshold}</span>
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
              <span style={{ fontFamily: "'JetBrains Mono',monospace", color: 'var(--green)' }}>{vposLabel}</span>
            </div>
            <input type="range" min="-40" max="40" value={vposPct} onChange={onSetVpos} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 600, color: 'var(--faint)', marginTop: 2 }}>
              <span>↑ up</span><span>center</span><span>down ↓</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', margin: '16px 0 6px' }}>
              <span>Zoom</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", color: 'var(--green)' }}>{zoom}%</span>
            </div>
            <input type="range" min="100" max="180" value={zoom} onChange={onSetZoom} />
          </div>

          {/* File size */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 18, padding: 18 }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--green)', display: 'inline-block' }} />
              File size
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, lineHeight: 1.5 }}>
              Auto-compressed to fit{' '}
              <b style={{ color: 'var(--green-ink)' }}>{preset.min}–{preset.max} KB</b>.
              {' '}Current output:{' '}
              <b style={{ color: sizeInk, fontFamily: "'JetBrains Mono',monospace" }}>{outputKB} KB</b>
              {' '}at {Math.round(quality * 100)}% quality.
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,    setScreen]    = useState('home')
  const [dark,      setDark]      = useState(false)
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
  const [processKey, setProcessKey] = useState(0)

  const fileRef  = useRef(null)
  const imgElRef = useRef(null)
  const canvasRef = useRef(null)

  // Re-run canvas processing whenever any parameter or image changes
  useEffect(() => {
    const img = imgElRef.current
    if (!img) return
    if (!canvasRef.current) canvasRef.current = document.createElement('canvas')

    const canvas = canvasRef.current
    canvas.width  = preset.w
    canvas.height = preset.h
    const ctx = canvas.getContext('2d')

    ctx.clearRect(0, 0, preset.w, preset.h)
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, preset.w, preset.h)

    const s = Math.max(preset.w / img.width, preset.h / img.height) * (zoom / 100)
    const dw = img.width * s
    const dh = img.height * s
    const dx = (preset.w - dw) / 2
    const dy = (preset.h - dh) / 2 + (vposPct / 100) * preset.h
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, dx, dy, dw, dh)

    if (replaceBg) {
      try {
        const id = ctx.getImageData(0, 0, preset.w, preset.h)
        applyBgReplace(id.data, preset.w, preset.h, bgColor, threshold)
        ctx.putImageData(id, 0, 0)
      } catch (_) {}
    }

    let q = 0.92
    let url = canvas.toDataURL('image/jpeg', q)
    let kb = kbOf(url)
    let guard = 0
    while (kb > preset.max && q > 0.28 && guard < 12) {
      q = Math.max(0.28, q - 0.08)
      url = canvas.toDataURL('image/jpeg', q)
      kb = kbOf(url)
      guard++
    }
    setOutputUrl(url)
    setOutputKB(kb)
    setQuality(q)
  }, [preset, bgColor, replaceBg, threshold, vposPct, zoom, processKey])

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

  return (
    <div className={`shell${dark ? ' dark' : ''}`}>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />

      <Nav
        dark={dark}
        onToggleDark={() => setDark(d => !d)}
        onUpload={openFile}
        onGoHome={() => setScreen('home')}
      />

      {screen === 'home' && (
        <HomePage
          onUpload={openFile}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onDragLeave={e => e.preventDefault()}
          onSelectPreset={(p) => { handleSelectPreset(p); openFile() }}
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
          onDownload={download}
          onGoHome={() => setScreen('home')}
          onUpload={openFile}
        />
      )}
    </div>
  )
}
