// ─── AI background segmentation (MediaPipe Selfie Segmenter) ──────────────────
// Runs entirely client-side (WASM/GPU): the model file is fetched once and
// cached by the browser, then every photo is segmented locally in memory.
// Falls back to color-based chroma-key (see applyBgReplace in App.jsx) if the
// model can't load or a delegate isn't supported.

const TASKS_VISION_VERSION = '1.0.1'
const WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite'

let segmenterPromise = null

async function createSegmenter() {
  const { FilesetResolver, ImageSegmenter } = await import('@mediapipe/tasks-vision')
  const vision = await FilesetResolver.forVisionTasks(WASM_BASE)

  const opts = {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
    runningMode: 'IMAGE',
    outputCategoryMask: false,
    outputConfidenceMasks: true,
  }
  try {
    return await ImageSegmenter.createFromOptions(vision, opts)
  } catch (err) {
    console.warn('SnapFit: GPU delegate unavailable for segmentation, retrying on CPU', err)
    return await ImageSegmenter.createFromOptions(vision, { ...opts, baseOptions: { ...opts.baseOptions, delegate: 'CPU' } })
  }
}

function getSegmenter() {
  if (!segmenterPromise) segmenterPromise = createSegmenter()
  return segmenterPromise
}

// Returns a grayscale <canvas> (white = subject, black = background) sized to
// match the source image exactly, so callers can drawImage() it through the
// same crop/zoom transform used for the photo itself.
export async function segmentSubject(imgEl) {
  const segmenter = await getSegmenter()
  const result = segmenter.segment(imgEl)
  const mask = result.confidenceMasks?.[0]
  if (!mask) {
    result.close?.()
    throw new Error('Segmenter returned no confidence mask')
  }

  const w = mask.width, h = mask.height
  const values = mask.getAsFloat32Array()

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  const out = ctx.createImageData(w, h)
  for (let i = 0; i < values.length; i++) {
    const v = Math.max(0, Math.min(255, Math.round(values[i] * 255)))
    const j = i * 4
    out.data[j] = v; out.data[j + 1] = v; out.data[j + 2] = v; out.data[j + 3] = 255
  }
  ctx.putImageData(out, 0, 0)

  mask.close?.()
  result.close?.()
  return canvas
}
