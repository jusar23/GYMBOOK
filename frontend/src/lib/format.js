// Formatting + date helpers (ported from the vanilla app, unit taken from the store where needed).
import { dateLocale, t } from './i18n.js'
export const todayISO = () => {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}
export const isoOf = d =>
  d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')

export const DAYN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function fmtDate(iso, long) {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString(dateLocale(), long ? { weekday: 'short', day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short' })
}
export function fmtDur(ms) {
  const m = Math.floor(ms / 60000)
  return m >= 60 ? Math.floor(m / 60) + 'h ' + (m % 60) + 'm' : m + ' min'
}
// Imported history has no clock — an unknown duration is left out rather than shown as "0 min".
export const durPart = ms => (ms >= 60000 ? [fmtDur(ms)] : [])
// Numbers follow the UI language, like the dates above — a hardcoded locale put Swiss
// apostrophes ("7'535 kg") in front of every user, in every language.
export const fmtNum = n => (Math.round(n * 10) / 10).toLocaleString(dateLocale())
// Volume stays in the profile's unit throughout: the old shorthand turned anything over
// 10 000 into "t", which is wrong for a pound profile and made one list mix "18.8t" with
// "7'535 kg" — two numbers you can't compare at a glance.
export const fmtVol = (v, unit) => fmtNum(v) + ' ' + unit
// Plural forms are not automatic when the English string is the key.
export const exCount = n => t(n === 1 ? '{0} exercise' : '{0} exercises', n)

export function weekKey(d) {
  const dt = new Date(d + 'T12:00:00')
  const day = (dt.getDay() + 6) % 7
  dt.setDate(dt.getDate() - day + 3)
  const jan4 = new Date(dt.getFullYear(), 0, 4)
  const week = 1 + Math.round(((dt - jan4) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7)
  return dt.getFullYear() + '-' + week
}

export const localTZ = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { return 'UTC' } }

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
// Accent HEX values are identical in light and dark themes; only foreground
// contrast is adjusted when a color is applied.
const accent = (label, tone, color) => ({ label, tone, color, swatch: color })
const accentOptions = {
  lime: accent('lime', 'vivid', '#B8F36B'),
  emerald: accent('emerald', 'vivid', '#10B981'),
  turquoise: accent('turquoise', 'vivid', '#06B6D4'),
  'electric-blue': accent('electric blue', 'vivid', '#3B82F6'),
  indigo: accent('indigo', 'vivid', '#6366F1'),
  violet: accent('violet', 'vivid', '#8B5CF6'),
  purple: accent('purple', 'vivid', '#A855F7'),
  magenta: accent('magenta', 'vivid', '#D946EF'),
  'intense-pink': accent('intense pink', 'vivid', '#F43F5E'),
  red: accent('red', 'vivid', '#EF4444'),
  orange: accent('orange', 'vivid', '#F97316'),
  amber: accent('amber', 'vivid', '#F59E0B'),
  'lime-light': accent('lime', 'light-intense', '#D9F7A8'),
  'emerald-light': accent('emerald', 'light-intense', '#9AE6C5'),
  'turquoise-light': accent('turquoise', 'light-intense', '#8BE5F2'),
  'electric-blue-light': accent('electric blue', 'light-intense', '#A5C8FF'),
  'indigo-light': accent('indigo', 'light-intense', '#B7B8FC'),
  'violet-light': accent('violet', 'light-intense', '#C9B3FF'),
  'purple-light': accent('purple', 'light-intense', '#DDB5FC'),
  'magenta-light': accent('magenta', 'light-intense', '#F3B0F4'),
  'intense-pink-light': accent('intense pink', 'light-intense', '#FDAAB9'),
  'red-light': accent('red', 'light-intense', '#FFAAAA'),
  'orange-light': accent('orange', 'light-intense', '#FFC08A'),
  'amber-light': accent('amber', 'light-intense', '#FFDA85'),
}

const legacyAccent = target => ({ ...accentOptions[target], selectable: false, alias: target })
export const ACCENTS = {
  ...accentOptions,
  // Preserve the saved appearance of profiles using the former palette names.
  sky: legacyAccent('electric-blue'),
  pink: legacyAccent('intense-pink'),
  rose: legacyAccent('intense-pink'),
  teal: legacyAccent('turquoise'),
  gold: legacyAccent('amber'),
  lavender: legacyAccent('purple'),
  mint: legacyAccent('emerald'),
  coral: legacyAccent('orange'),
  'sky-light': legacyAccent('electric-blue-light'),
  'pink-light': legacyAccent('intense-pink-light'),
  'rose-light': legacyAccent('intense-pink-light'),
  'teal-light': legacyAccent('turquoise-light'),
  'gold-light': legacyAccent('amber-light'),
  'lavender-light': legacyAccent('purple-light'),
  'mint-light': legacyAccent('emerald-light'),
  'coral-light': legacyAccent('orange-light'),
}
