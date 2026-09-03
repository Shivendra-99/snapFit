// ─── Notification-screenshot → spec extractor (client side) ─────────────────────
// Resizes the uploaded screenshot down (keeps tokens/cost low + upload fast),
// sends it to our /api/extract-spec proxy, and maps the returned spec onto a
// SnapFit preset object. The screenshot is a document image (form text), not the
// user's face photo — the face photo is never sent anywhere.
import { CUSTOM_BASE, BG_OPTIONS } from './presets.js'

const MAX_DIM = 1280 // enough to read form text, small enough to stay cheap/fast

// File → downscaled JPEG data URL
function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That does not look like an image.'))
      img.onload = () => {
        const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

// Ask the proxy to read the spec out of the screenshot.
export async function extractSpecFromImage(file) {
  const image = await toDataUrl(file)
  const res = await fetch('/api/extract-spec', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image }),
  })
  let data = {}
  try { data = await res.json() } catch { /* fall through to status check */ }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status}).`)
  return data // { exam_name, photo, signature, confidence }
}

// Map a colour word from the form onto one of our background swatches (default white).
export function normalizeBg(word) {
  if (!word || typeof word !== 'string') return '#ffffff'
  const w = word.toLowerCase()
  if (w.includes('off')) return '#eef3fb'
  if (w.includes('light') && w.includes('blue')) return '#cfe0fb'
  if (w.includes('blue')) return '#2f6fdb'
  return '#ffffff'
}

// Build a SnapFit preset object from an extracted spec, filling gaps from CUSTOM_BASE.
export function specToPreset(spec) {
  const ph = spec.photo || {}
  const sig = spec.signature
  return {
    ...CUSTOM_BASE,
    id: 'custom',
    name: spec.exam_name ? spec.exam_name.slice(0, 30) : 'From notification',
    w: ph.w || CUSTOM_BASE.w,
    h: ph.h || CUSTOM_BASE.h,
    min: ph.min_kb || CUSTOM_BASE.min,
    max: ph.max_kb || CUSTOM_BASE.max,
    bg: normalizeBg(ph.bg),
    sig: (sig && (sig.w || sig.h || sig.max_kb))
      ? { w: sig.w || CUSTOM_BASE.sig.w, h: sig.h || CUSTOM_BASE.sig.h, min: sig.min_kb || CUSTOM_BASE.sig.min, max: sig.max_kb || CUSTOM_BASE.sig.max }
      : { ...CUSTOM_BASE.sig },
  }
}

export const BG_LABEL = (hex) => (BG_OPTIONS.find(o => o.hex === hex)?.name) || 'White'
