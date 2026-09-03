// ─── Google AdSense config (single source for app + landing-page generator) ─────
// The loader script (in index.html and every generated landing page) is what
// AdSense uses to verify the site and, once approved, to serve ads. Individual
// ad UNITS below need a slot ID from the AdSense dashboard:
//   AdSense → Ads → By ad unit → Display ads → create a responsive unit →
//   copy the data-ad-slot number (10 digits) and paste it below.
// Leave a slot as '' to render NOTHING in that spot (e.g. before approval) — the
// page stays clean, no empty ad box.
export const AD_CLIENT = 'ca-pub-3576532225137751'

export const AD_SLOTS = {
  landing: '', // mid-content on every /exam, /sell, /compress, /photo-resizer… page
  editor: '',  // below the tool on the photo editor
}
