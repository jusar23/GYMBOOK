import { EXDB } from './exercises-data.js'
import { t } from './i18n.js'
import { MOBILE } from './mobile.js'

export { EXDB }
export const EXIDX = {}
EXDB.forEach(e => { EXIDX[e.id] = e })
export const BODYPARTS = [...new Set(EXDB.map(e => e.bp))].sort()

// Equipment options present in a given list of exercises, most common first (issue #6).
// Deriving them from the *already filtered* list keeps the chip row short and means
// every body-part × equipment combination on screen has results behind it.
export function equipmentOf(list) {
  const c = {}
  list.forEach(e => { if (e.eq) c[e.eq] = (c[e.eq] || 0) + 1 })
  return Object.keys(c).sort((a, b) => c[b] - c[a] || (a < b ? -1 : 1))
}

// Custom (user-created) exercises live in synced state S.customEx (issue #11) and are
// merged into the id index here so every EXIDX[id] lookup keeps working unchanged.
let customIds = []
export function registerCustom(list) {
  customIds.forEach(id => delete EXIDX[id])
  customIds = (list || []).map(e => e.id)
  ;(list || []).forEach(e => { EXIDX[e.id] = e })
}
// Full searchable catalogue — customs first so your own exercises are easy to find.
export const allExercises = st => [...(st.customEx || []), ...EXDB]

// Media normally sits next to the app (img/ and gif/, mounted into the web container).
// A build can point them somewhere else — the demo build pulls them off a CDN instead of
// shipping ~140 MB of images into the deployment.
// Use origin-root paths for bundled/local media. Relative paths such as `img/foo.webp`
// resolve under the current SPA route (for example `/workout/img/foo.webp`) in WebView.
const IMG_BASE = MOBILE ? '/img/' : (import.meta.env.VITE_IMG_BASE || '/img/')
const GIF_BASE = MOBILE ? '/gif/' : (import.meta.env.VITE_GIF_BASE || '/gif/')
// Catalogues may provide sex-specific demonstrations (imgFemale/gifFemale,
// imgMale/gifMale). Older entries only have the shared img/gif, which remains
// the fallback so exercises never lose their media.
const variant = (ex, key, body) => ex[`${key}${body === 'female' ? 'Female' : 'Male'}`] || ex[key]
export const imgSrc = (ex, body = 'male') => {
  const file = variant(ex, 'img', body)
  return file ? IMG_BASE + (MOBILE ? file.replace(/\.jpe?g$/i, '.webp') : file) : ''
}
export const gifSrc = (ex, body = 'male') => {
  const file = variant(ex, 'gif', body)
  return file ? GIF_BASE + (MOBILE ? file.replace(/\.gif$/i, '.webp') : file) : ''
}

// Cardio exercises log time + speed instead of weight × reps.
export const isCardio = idOrEx => (typeof idOrEx === 'string' ? EXIDX[idOrEx] : idOrEx)?.bp === 'cardio'

// Exercises the dataset already knows carry no external load (issue #32) — a quarter of the
// catalogue. This seeds the `bw` flag on a fresh config so a push-up never asks for a weight
// nobody was going to enter. It is only the default: the flag lives on the config, so a dip
// done with a belt can turn it off and a custom exercise can turn it on.
export const isBodyweightEq = idOrEx =>
  (typeof idOrEx === 'string' ? EXIDX[idOrEx] : idOrEx)?.eq === 'body weight'

// An id that resolves to nothing — a plan file built against a different exercise dataset,
// a custom exercise deleted on another device before the sync arrived — still has to
// render. A placeholder keeps it visible (and removable) instead of taking the whole view
// down on the first `ex.n`.
export const exOr = id => EXIDX[id] ||
  { id, n: t('Unknown exercise'), bp: '', tg: '', eq: '', sm: [], st: [], missing: true }
