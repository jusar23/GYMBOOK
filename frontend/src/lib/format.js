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
// Each swatch is a selectable tone, not a theme lock. The paired values preserve
// that choice's hue and contrast when the app switches between dark and light.
export const ACCENTS = {
  lime: { swatch: '#30d158', dark: '#30d158', light: '#167a34' },
  sky: { swatch: '#62aaff', dark: '#62aaff', light: '#0057b8' },
  orange: { swatch: '#ff9f0a', dark: '#ff9f0a', light: '#a84b00' },
  violet: { swatch: '#d18cff', dark: '#d18cff', light: '#7733a8' },
  pink: { swatch: '#ff8298', dark: '#ff8298', light: '#c2185b' },
  rose: { swatch: '#ff9ec7', dark: '#ff9ec7', light: '#a61b58' },
  red: { swatch: '#ff8078', dark: '#ff8078', light: '#c62828' },
  teal: { swatch: '#40c8e0', dark: '#40c8e0', light: '#006f82' },
  gold: { swatch: '#ffd60a', dark: '#ffd60a', light: '#8a6500' },
  lavender: { swatch: '#c9a0ff', dark: '#c9a0ff', light: '#6633a8' },
  mint: { swatch: '#70e1c2', dark: '#70e1c2', light: '#00785e' },
  coral: { swatch: '#ff8a65', dark: '#ff8a65', light: '#a63f25' },
  'lime-light': { swatch: '#9be8ae', dark: '#9be8ae', light: '#236d39' },
  'sky-light': { swatch: '#9ecbff', dark: '#9ecbff', light: '#1c4f8a' },
  'orange-light': { swatch: '#ffc875', dark: '#ffc875', light: '#8a4700' },
  'violet-light': { swatch: '#e3b7ff', dark: '#e3b7ff', light: '#65378a' },
  'pink-light': { swatch: '#ffafbd', dark: '#ffafbd', light: '#98324d' },
  'rose-light': { swatch: '#ffc7df', dark: '#ffc7df', light: '#8b2751' },
  'red-light': { swatch: '#ffaaa5', dark: '#ffaaa5', light: '#972d29' },
  'teal-light': { swatch: '#8ee7f4', dark: '#8ee7f4', light: '#006676' },
  'gold-light': { swatch: '#ffe680', dark: '#ffe680', light: '#755800' },
  'lavender-light': { swatch: '#dec6ff', dark: '#dec6ff', light: '#573888' },
  'mint-light': { swatch: '#a5efd9', dark: '#a5efd9', light: '#006d59' },
  'coral-light': { swatch: '#ffb49c', dark: '#ffb49c', light: '#874533' },
}
