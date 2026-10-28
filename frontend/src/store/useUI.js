import { create } from 'zustand'
import { uid } from '../lib/format.js'
import { playTimerTone, unlockAudio, vibrate } from '../lib/sound.js'
import { api } from '../lib/api.js'
import { t } from '../lib/i18n.js'
import { ANDROID_APP, MOBILE, clearNativeRestTimer, setNativeRestTimer } from '../lib/mobile.js'
import { useStore } from './useStore.js'
import { EXIDX } from '../lib/exercises.js'

// Fire-and-forget: lets the server push a "rest over" alert if this tab gets suspended
// before the local timer completes. No-ops for guests / offline.
const pushRestTimer = sec => { if (!MOBILE && useStore.getState().user) api('/api/push/rest-timer', { method: 'POST', body: JSON.stringify({ seconds: sec }) }).catch(() => {}) }
const cancelPushRestTimer = () => { if (!MOBILE && useStore.getState().user) api('/api/push/rest-timer/cancel', { method: 'POST', body: '{}' }).catch(() => {}) }

let toastTm = null
let timerInt = null
let timerTick = null
let nativeRestCleanup = null
let workInt = null
let workTick = null
let workDone = null

const restNotificationOptions = (endsAt, settings, recent) => {
  const S = useStore.getState().S
  const entry = recent && S.active?.entries?.[recent.entryIdx]
  const set = entry?.sets?.[recent.setIdx]
  const name = entry ? (EXIDX[entry.id]?.n || entry.id) : ''
  const values = []
  if (Number.isFinite(set?.w)) values.push(`${set.w} ${entry.weightUnit || S.unit}`)
  if (Number.isFinite(set?.r)) values.push(`× ${set.r}`)
  return {
    endsAt: String(endsAt), sound: !!settings.sound, tone: settings.soundTone || 'classic',
    title: t('Rest timer'), detail: name ? `${name}${values.length ? ` · ${values.join(' ')}` : ''}` : t('Rest'),
    adjustLabel: t('Adjust last set'),
  }
}

export const useUI = create((set, get) => ({
  sheets: [],          // { id, render:(close)=>JSX, kind:'sheet'|'center'|'full', locked }
  toastMsg: '',
  timer: null,         // rest countdown between sets — { left, total, endsAt }
  work: null,          // work countdown DURING a timed set (issue #16) — { left, total, endsAt, label }
  recentSet: null,     // { entryIdx, setIdx } shown above the rest timer for quick corrections
  workoutAdvance: null,
  setRecentSet(recentSet) { set({ recentSet }) },
  setWorkoutAdvance(workoutAdvance) { set({ workoutAdvance }) },

  openSheet(render, { kind = 'sheet', locked = false } = {}) {
    const id = uid()
    set(s => ({ sheets: [...s.sheets, { id, render, kind, locked }] }))
    const close = () => get().closeSheet(id)
    return { id, close, lock: v => set(s => ({ sheets: s.sheets.map(x => x.id === id ? { ...x, locked: v } : x) })) }
  },
  closeSheet(id) { set(s => ({ sheets: s.sheets.filter(x => x.id !== id) })) },
  closeAll() { set({ sheets: [] }) },

  toast(msg) {
    set({ toastMsg: msg })
    clearTimeout(toastTm)
    toastTm = setTimeout(() => set({ toastMsg: '' }), 2200)
  },

  startRest(sec) {
    get().stopRest()
    if (nativeRestCleanup) clearTimeout(nativeRestCleanup); nativeRestCleanup = null
    unlockAudio()
    const duration = Math.min(360, Math.max(1, Math.round(Number(sec) || 1)))
    const endsAt = Date.now() + duration * 1000
    const settings = useStore.getState().S
    const nativeAlert = ANDROID_APP && !!settings.restNotification
    set({ timer: { left: duration, total: duration, endsAt, nativeAlert } })
    if (nativeAlert) setNativeRestTimer(restNotificationOptions(endsAt, settings, get().recentSet))
    pushRestTimer(duration)
    timerTick = () => {
      const tm = get().timer
      if (!tm) return
      const left = Math.max(0, Math.round((tm.endsAt - Date.now()) / 1000))
      if (left === tm.left) return
      const settings = useStore.getState().S
      const snd = settings.sound
      const tone = settings.soundTone || 'classic'
      if (left <= 0) {
        if (tm.nativeAlert) {
          // Hide the rest bar immediately. Keep the native schedule alive briefly so its
          // finish cue can complete even if the WebView's tick wins the race at zero.
          if (document.visibilityState === 'visible') playTimerTone(snd, tone, 'finish', true)
          if (timerInt) clearInterval(timerInt); timerInt = null
          if (timerTick) document.removeEventListener('visibilitychange', timerTick); timerTick = null
          cancelPushRestTimer()
          set({ timer: null })
          get().toast(t('Rest over — next set!'))
          if (!nativeRestCleanup) nativeRestCleanup = setTimeout(() => {
            nativeRestCleanup = null
            clearNativeRestTimer()
          }, 1800)
          return
        }
        playTimerTone(snd, tone, 'finish', true)
        vibrate([200, 100, 200]); get().toast(t('Rest over — next set!')); get().stopRest(); return
      }
      if (left <= 3 && (!tm.nativeAlert || document.visibilityState === 'visible')) playTimerTone(snd, tone, 'countdown')
      set({ timer: { ...tm, left } })
    }
    timerInt = setInterval(timerTick, 1000)
    document.addEventListener('visibilitychange', timerTick)
  },
  addRest(sec) {
    const tm = get().timer
    if (!tm) return
    if (nativeRestCleanup) clearTimeout(nativeRestCleanup); nativeRestCleanup = null
    const left = Math.min(360, tm.left + sec)
    // taking off more than is left means "I'm ready now" — same as skipping, and it keeps a
    // negative duration out of both the progress bar and the server-side push schedule
    if (left <= 0) { get().stopRest(); return }
    const added = left - tm.left
    const updated = { ...tm, left, total: Math.min(360, tm.total + added), endsAt: tm.endsAt + added * 1000 }
    set({ timer: updated })
    if (tm.nativeAlert) {
      const settings = useStore.getState().S
      setNativeRestTimer(restNotificationOptions(updated.endsAt, settings, get().recentSet))
    }
    pushRestTimer(left)
  },
  stopRest() {
    if (timerInt) clearInterval(timerInt); timerInt = null
    if (timerTick) document.removeEventListener('visibilitychange', timerTick); timerTick = null
    if (nativeRestCleanup) clearTimeout(nativeRestCleanup); nativeRestCleanup = null
    const current = get().timer
    if (current) cancelPushRestTimer()
    if (current?.nativeAlert) clearNativeRestTimer()
    set({ timer: null })
  },
  finishRestEarly() {
    const current = get().timer
    if (!current) return
    const settings = useStore.getState().S
    get().stopRest()
    playTimerTone(settings.sound, settings.soundTone || 'classic', 'finish', true)
    vibrate([200, 100, 200])
    get().toast(t('Rest over — next set!'))
  },

  /* ---- work timer (issue #16) ----
     Times the set itself, not the recovery after it. Kept separate from the rest timer on
     purpose: the two mean opposite things, they must never run together, and a work set is
     something you are watching — so it gets no server push (that endpoint says "rest over",
     and a plank does not need a notification you are staring at anyway).
     `onDone(elapsedSec)` is called both when the countdown reaches zero and on an early
     finish; the elapsed time is what actually gets logged, so stopping at 0:38 of a 0:45
     hold records 0:38 rather than crediting the full target. */
  startWork(sec, label, onDone) {
    get().stopWork()
    get().stopRest()
    unlockAudio()
    const total = Math.max(1, Math.round(sec) || 1)
    const endsAt = Date.now() + total * 1000
    workDone = onDone
    set({ work: { left: total, total, endsAt, label } })
    workTick = () => {
      const wk = get().work
      if (!wk) return
      const left = Math.max(0, Math.round((wk.endsAt - Date.now()) / 1000))
      if (left === wk.left) return
      const settings = useStore.getState().S
      const snd = settings.sound
      const tone = settings.soundTone || 'classic'
      if (left <= 0) {
        playTimerTone(snd, tone, 'finish')
        vibrate([200, 100, 200])
        const done = workDone
        get().stopWork()
        if (done) done(wk.total)
        return
      }
      if (left <= 3) playTimerTone(snd, tone, 'countdown')
      set({ work: { ...wk, left } })
    }
    workInt = setInterval(workTick, 1000)
    document.addEventListener('visibilitychange', workTick)
  },
  // Ended the hold early — log what was actually held.
  finishWorkEarly() {
    const wk = get().work
    if (!wk) return
    const elapsed = Math.max(1, wk.total - wk.left)
    const done = workDone
    vibrate(30)
    get().stopWork()
    if (done) done(elapsed)
  },
  // Abandon without logging anything.
  stopWork() {
    if (workInt) clearInterval(workInt); workInt = null
    if (workTick) document.removeEventListener('visibilitychange', workTick); workTick = null
    workDone = null
    set({ work: null })
  }
}))
