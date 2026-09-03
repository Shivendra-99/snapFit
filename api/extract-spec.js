// ─── /api/extract-spec ─────────────────────────────────────────────────────────
// Vercel serverless proxy. Takes a base64 screenshot of an Indian exam
// notification, asks MiniMax M3 (multimodal) to read the required photo &
// signature spec out of it, validates the numbers, and returns clean JSON.
//
// The OpenRouter key lives ONLY here (process.env.OPENROUTER_API_KEY) — it is
// never shipped to the browser. The user's screenshot is passed straight to the
// model and not stored anywhere.
//
// Local dev: `vercel dev` runs this alongside the Vite app. Set the key in a
// gitignored .env (`OPENROUTER_API_KEY=...`) or in the Vercel project settings.

const MODEL = process.env.OPENROUTER_MODEL || 'minimax/minimax-m3:free'
const API_URL = 'https://openrouter.ai/api/v1/chat/completions'

const PROMPT = `You are reading a screenshot of an Indian competitive-exam application form or notification. Extract ONLY the specification for the uploaded PHOTOGRAPH and the SIGNATURE image.

Return STRICT JSON, nothing else:
{
  "exam_name": string | null,
  "photo": { "w": integer|null, "h": integer|null, "min_kb": number|null, "max_kb": number|null, "bg": string|null } | null,
  "signature": { "w": integer|null, "h": integer|null, "min_kb": number|null, "max_kb": number|null } | null,
  "confidence": "high" | "medium" | "low"
}

Rules:
- w and h are pixels; min_kb and max_kb are kilobytes.
- "bg" is the background colour if the form states one (e.g. "white", "light blue"), else null.
- If a value is not clearly stated in the screenshot, use null. NEVER guess or invent a number.
- If the image contains no photo/signature spec at all, set "photo" and "signature" to null and "confidence" to "low".
- Output JSON only, no markdown, no commentary.`

// keep only sane numbers, else null
const num = (v, lo, hi) => {
  const n = Number(v)
  return Number.isFinite(n) && n >= lo && n <= hi ? Math.round(n) : null
}
const cleanBlock = (b, isSig) => {
  if (!b || typeof b !== 'object') return null
  const out = {
    w: num(b.w, 20, 5000), h: num(b.h, 20, 5000),
    min_kb: num(b.min_kb, 1, 20000), max_kb: num(b.max_kb, 1, 20000),
  }
  if (!isSig) out.bg = typeof b.bg === 'string' ? b.bg.slice(0, 40) : null
  // a block with no usable numbers is not a real spec
  return (out.w || out.h || out.max_kb) ? out : null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  if (!process.env.OPENROUTER_API_KEY) return res.status(500).json({ error: 'Server is missing its API key.' })

  const image = req.body?.image
  if (typeof image !== 'string' || !image.startsWith('data:image/'))
    return res.status(400).json({ error: 'Send { image: "data:image/...;base64,..." }' })

  try {
    const r = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://www.snapfit.in',
        'X-Title': 'SnapFit notice reader',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: PROMPT },
            { type: 'image_url', image_url: { url: image } },
          ],
        }],
      }),
    })

    if (r.status === 429)
      return res.status(429).json({ error: 'Busy right now (rate limit). Try again in a minute or pick a preset manually.' })
    if (!r.ok)
      return res.status(502).json({ error: `Model error (${r.status}).` })

    const data = await r.json()
    const text = data?.choices?.[0]?.message?.content
    if (!text) return res.status(502).json({ error: 'Empty response from model.' })

    let parsed
    try {
      parsed = JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, ''))
    } catch { return res.status(502).json({ error: 'Could not read the spec from that screenshot.' }) }

    const photo = cleanBlock(parsed.photo, false)
    const signature = cleanBlock(parsed.signature, true)
    const confidence = ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'low'
    const exam_name = typeof parsed.exam_name === 'string' ? parsed.exam_name.slice(0, 80) : null

    return res.status(200).json({ exam_name, photo, signature, confidence })
  } catch (e) {
    return res.status(502).json({ error: 'Could not reach the model. Check your connection and try again.' })
  }
}
