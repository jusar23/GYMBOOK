import { create } from 'zustand'
import { api, createAppSessionWithSupabase } from '../lib/api.js'
import { clearPendingRecoveryCode, getAuthSession, getPendingRecoveryCode, isPasswordRecovery, processOAuthCallback, signOutSupabase } from '../lib/supabaseAuth.js'
import { localTZ } from '../lib/format.js'
import { registerCustom } from '../lib/exercises.js'
import { DEMO, DEMO_SEEDED } from '../lib/demo.js'
import { MOBILE, nativeLoad, nativeSave, nativeClear, syncReminder, syncStreakWidget, syncNativeWorkoutNotification, clearNativeWorkoutNotification } from '../lib/mobile.js'
import { getCloudBackupConsent } from '../lib/supabaseBackup.js'
import { needsLegalSetup } from '../lib/legalConsent.js'
import { ageFromDateOfBirth } from '../lib/routine-recommendation.js'
import { setLang } from '../lib/i18n.js'

const KEY = 'gym_state_v1'
const SIGNED_OUT_KEY = 'gym_signed_out_v1'
const timeoutSignal = ms => typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
  ? AbortSignal.timeout(ms) : undefined
export const DEF = {
  unit: 'kg', restSec: 90, sideRestSec: 30, warmupEnabled: false, sound: true, soundTone: 'classic', restNotification: false, keepAwake: true, lockOrientation: false, lang: 'en',
  theme: 'dark', accent: 'lime', body: 'male', targetW: null,
  bodyweight: [], routines: [], week: {}, dayPlan: {},
  exWeights: {}, workouts: [], active: null, customEx: [], favoriteEx: [], favoritesMigrated: false, gifSize: 'full',
  // effort: which per-set effort scale is logged — 'none' | 'rir' | 'rpe'. null, not 'none', so
  // that a profile which never chose (loaded state is overlaid on DEF, on every path: local,
  // server pull, backup import) still falls back to the `showRir` boolean this replaced and
  // keeps the column it had. See effortOf.
  reminder: { on: false, time: '08:00', tz: null }, effort: null
}
const clone = o => JSON.parse(JSON.stringify(o))

function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return migrateRestNotification(migratePerSideRoutines(migrateChosenExercises(Object.assign(clone(DEF), JSON.parse(raw)))))
  } catch (e) { /* ignore */ }
  return migrateRestNotification(migratePerSideRoutines(migrateChosenExercises(clone(DEF))))
}

// Older routines stored both limbs' reps as one even total (`side: true`). Convert only
// reusable routine targets to per-limb reps and mark the new paired-set format. Completed
// workouts and an in-progress session retain their original values for accurate history.
function migratePerSideRoutines(state) {
  ;(state.routines || []).forEach(routine => (routine.ex || []).forEach(ex => {
    if (ex.side !== true) return
    for (const field of ['reps', 'repsMin', 'repsMax']) {
      if (Number.isFinite(ex[field]) && ex[field] > 0) ex[field] = Math.max(1, Math.ceil(ex[field] / 2))
    }
    ex.side = 'paired'
  }))
  return state
}

// Preserve exercises already selected in routines or workouts when unifying "Chosen" with favorites.
function migrateChosenExercises(state) {
  if (state.favoritesMigrated) return state
  const favorites = new Set(Array.isArray(state.favoriteEx) ? state.favoriteEx : [])
  ;(state.routines || []).forEach(r => (r.ex || []).forEach(e => e.id && favorites.add(e.id)))
  ;(state.workouts || []).forEach(w => (w.entries || []).forEach(e => e.id && favorites.add(e.id)))
  ;(state.active?.entries || []).forEach(e => e.id && favorites.add(e.id))
  state.favoriteEx = [...favorites]
  state.favoritesMigrated = true
  return state
}

function migrateRestNotification(state) {
  if (state.restNotification == null) state.restNotification = false
  delete state.restBubble
  return state
}

const hasData = st => !!((st.workouts || []).length || (st.routines || []).length || (st.bodyweight || []).length)

export const useStore = create((set, get) => {
  let pushTm = null
  let saveTm = null
  let reminderTm = null
  let streakWidgetTm = null
  let workoutNotificationTm = null
  let workoutNotificationKey
  let stateRevision = 0

  // Mobile build: mirror state locally. Reminders are synced separately only when their
  // inputs change, so recording sets does not cancel and recreate OS notifications.
  const nativePersist = () => {
    clearTimeout(saveTm)
    saveTm = setTimeout(() => { saveTm = null; nativeSave(get().S) }, 800)
  }

  const reminderConfig = S => JSON.stringify([
    S.reminder || null,
    S.week || {},
    (S.routines || []).map(({ id, name }) => [id, name]),
  ])

  const nativeReminderPersist = () => {
    clearTimeout(reminderTm)
    reminderTm = setTimeout(() => {
      reminderTm = null
      syncReminder(get().S)
    }, 800)
  }

  const nativeStreakWidgetPersist = () => {
    clearTimeout(streakWidgetTm)
    streakWidgetTm = setTimeout(() => {
      streakWidgetTm = null
      syncStreakWidget(get().S)
    }, 800)
  }

  const nativeWorkoutNotificationPersist = S => {
    const active = S.active
    const sets = active?.entries || []
    const done = sets.reduce((sum, entry) => sum + (entry.sets || []).filter(item => item.done).length + (entry.warmupSet?.done ? 1 : 0), 0)
    const total = sets.reduce((sum, entry) => sum + (entry.sets || []).length + (entry.warmupSet ? 1 : 0), 0)
    const key = active && S.restNotification
      ? JSON.stringify([active.id, active.name, active.cur, done, total])
      : ''
    if (key === workoutNotificationKey) return
    workoutNotificationKey = key
    clearTimeout(workoutNotificationTm)
    workoutNotificationTm = null
    if (!key) {
      void clearNativeWorkoutNotification()
      return
    }
    workoutNotificationTm = setTimeout(() => {
      workoutNotificationTm = null
      void syncNativeWorkoutNotification(get().S)
    }, 120)
  }

  const persist = (S, push = true) => {
    const reminderChanged = MOBILE && reminderConfig(get().S) !== reminderConfig(S)
    migrateChosenExercises(S)
    migratePerSideRoutines(S)
    migrateRestNotification(S)
    S._ts = Date.now()
    registerCustom(S.customEx)
    localStorage.setItem(KEY, JSON.stringify(S))
    set({ S })
    if (MOBILE) {
      nativePersist()
      nativeStreakWidgetPersist()
      nativeWorkoutNotificationPersist(S)
      if (reminderChanged) nativeReminderPersist()
    }
    if (push && get().user?.trainingDataConsent === true && !MOBILE) {
      stateRevision++
      localStorage.setItem('gym_dirty', '1')
      clearTimeout(pushTm)
      pushTm = setTimeout(() => get().pushState(), 1500)
    }
  }

  // A setting changed right before switching away/closing the tab must not get lost mid-debounce
  // (e.g. setting the reminder time then immediately backgrounding to test it). On mobile the
  // same applies to the file mirror — backgrounding is often the last thing before the OS
  // kills the app.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'hidden') return
    if (MOBILE && saveTm) {
      clearTimeout(saveTm)
      saveTm = null
      nativeSave(get().S)
    }
    if (MOBILE && reminderTm) {
      clearTimeout(reminderTm)
      reminderTm = null
      syncReminder(get().S)
    }
    if (MOBILE && streakWidgetTm) {
      clearTimeout(streakWidgetTm)
      streakWidgetTm = null
      syncStreakWidget(get().S)
    }
    if (MOBILE && workoutNotificationTm) {
      clearTimeout(workoutNotificationTm)
      workoutNotificationTm = null
      void syncNativeWorkoutNotification(get().S)
    }
    if (pushTm) {
      clearTimeout(pushTm)
      pushTm = null
      get().pushState()
    }
  })

  // Everything a sign-out leaves behind on this device, whichever way it was triggered.
  const clearLocalSession = () => {
    localStorage.setItem(SIGNED_OUT_KEY, '1')
    get().setUser(null)
    localStorage.removeItem('gym_guest')
    localStorage.removeItem('gym_dirty')
    localStorage.removeItem(KEY)
    persist(clone(DEF), false)
    set({ signingOut: false })
  }

  return {
    S: (() => { const s = loadState(); registerCustom(s.customEx); return s })(),
    user: (() => {
      if (localStorage.getItem(SIGNED_OUT_KEY) === '1') return null
      try { return JSON.parse(localStorage.getItem('gym_user')) || null } catch { return null }
    })(),
    ready: false,
    signingOut: false,
    signingIn: !!localStorage.getItem('gym_user') || new URLSearchParams(window.location.search).has('code'),

    // Mutate a draft of S via producer fn, then persist + schedule sync.
    update(mut, push = true) {
      const S = clone(get().S)
      mut(S)
      persist(S, push)
    },
    replaceState(S, push = false) { persist(clone(S), push) },

    isGuest: () => localStorage.getItem('gym_guest') === '1',
    setGuest(v) { if (v) localStorage.setItem('gym_guest', '1'); else localStorage.removeItem('gym_guest'); set({}) },

    setUser(u) {
      if (u) {
        const { dateOfBirth, ...userFields } = u
        const user = { ...userFields, age: u.age ?? ageFromDateOfBirth(dateOfBirth) }
        localStorage.setItem('gym_user', JSON.stringify(user)); localStorage.removeItem('gym_guest'); localStorage.removeItem(SIGNED_OUT_KEY)
        set({ user })
        return
      }
      else localStorage.removeItem('gym_user')
      set({ user: u })
    },
    setSigningIn(value) { set({ signingIn: !!value }) },

    async pushState(force = false) {
      if (!get().user || get().user.trainingDataConsent !== true) return
      clearTimeout(pushTm)
      if (!force && localStorage.getItem('gym_dirty') !== '1') return
      const revision = stateRevision
      const body = JSON.stringify({ state: get().S })
      try {
        await api('/api/data', { method: 'PUT', body })
        if (revision === stateRevision) localStorage.removeItem('gym_dirty')
        else localStorage.setItem('gym_dirty', '1')
      }
      catch (e) { localStorage.setItem('gym_dirty', '1') }
    },
    async pullState(remoteState, alreadyFetched = false, required = false) {
      try {
        const { state } = alreadyFetched ? { state: remoteState } : await api('/api/data')
        const S = get().S
        const dirty = localStorage.getItem('gym_dirty') === '1'
        if (state && (!hasData(S) || ((state._ts || 0) >= (S._ts || 0) && !dirty))) {
          const active = S.active
          const next = Object.assign(clone(DEF), state)
          if (active) next.active = active
          persist(next, false)
        } else if (hasData(S)) { await get().pushState(true) }
      } catch (e) {
        if (required) throw e
        /* offline — keep local */
      }
    },

    async signOut() {
      set({ signingOut: true })
      if (MOBILE) {
        await signOutSupabase(false)
        get().setUser(null)
        get().setGuest(false)
        set({ signingOut: false })
        return
      }
      await get().pushState()
      // Keep boot from silently recreating the app session from a cookie or an old Supabase
      // token if this browser reloads immediately after sign-out.
      localStorage.setItem(SIGNED_OUT_KEY, '1')
      // The app cookie and Supabase token are independent, so revoke both at once after the
      // profile save completes instead of paying for two sequential network round trips.
      await Promise.allSettled([
        api('/api/logout', { method: 'POST', body: '{}', signal: timeoutSignal(4000) }),
        signOutSupabase(false),
      ])
      clearLocalSession()
    },

    // "Sign out everywhere": the server bumps this profile's session version, which kills every
    // session it has on any device — this browser included.
    // The local session ends either way; the caller reports if remote invalidation fails.


    async signOutAll() {
      set({ signingOut: true })
      await get().pushState()   // never throws — stores gym_dirty and moves on when offline
      localStorage.setItem(SIGNED_OUT_KEY, '1')
      const [serverResult] = await Promise.allSettled([
        api('/api/logout/all', { method: 'POST', body: '{}', signal: timeoutSignal(4000) }),
        signOutSupabase(true),
      ])
      clearLocalSession()
      const serverError = serverResult.status === 'rejected' ? serverResult.reason : null
      if (serverError) throw serverError
    },

    async completeAccountDeletion() {
      set({ signingOut: true })
      // The account is already gone remotely. Clear auth, local progress/settings, and the
      // Android private state file without attempting to push anything to the deleted account.
      clearTimeout(saveTm)
      saveTm = null
      clearTimeout(reminderTm)
      reminderTm = null
      clearTimeout(streakWidgetTm)
      streakWidgetTm = null
      clearTimeout(workoutNotificationTm)
      workoutNotificationTm = null
      workoutNotificationKey = ''
      clearTimeout(pushTm)
      pushTm = null
      await signOutSupabase(false).catch(() => {})
      if (!MOBILE) await api('/api/logout', { method: 'POST', body: '{}' }).catch(() => {})
      localStorage.setItem(SIGNED_OUT_KEY, '1')
      for (const key of ['gym_user', 'gym_guest', 'gym_dirty', KEY]) localStorage.removeItem(key)
      registerCustom([])
      set({ S: clone(DEF), user: null, signingOut: false, signingIn: false })
      if (MOBILE) {
        await nativeClear()
        await syncReminder(DEF)
      }
    },

    // Demo build only: drop the seeded example profile back in (Settings → "Reset demo data").
    // Dynamic import so the generator never ships in a self-hosted bundle.
    async resetDemo() {
      const { buildDemoState } = await import('../lib/demoSeed.js')
      localStorage.removeItem('gym_dirty')
      persist(Object.assign(clone(DEF), buildDemoState()), false)
    },

    // Boot: ask the server for the current profile and its state together.
    async boot() {
      // Mobile build: restore local progress first, then restore only the Supabase Auth
      // session. Workout data is never fetched automatically.
      if (MOBILE) {
        // Mobile requires an authenticated account; discard any legacy guest-mode flag.
        get().setGuest(false)
        const saved = await nativeLoad()
        const S = get().S
        if (saved && (!hasData(S) || (saved._ts || 0) >= (S._ts || 0))) {
          persist(Object.assign(clone(DEF), saved), false)
        } else if (hasData(S)) {
          nativeSave(S)   // first run after an update from a file-less version: seed the mirror
        }
        // The widget is optional UI. Never let a native widget call hold the app's first
        // screen open if the Android provider is unavailable or slow to respond.
        void syncStreakWidget(get().S)
        void syncNativeWorkoutNotification(get().S)
        let authSession = null
        try { authSession = await processOAuthCallback() || await getAuthSession() }
        catch (e) { localStorage.setItem('gym_auth_error', e.message || 'Sign-in failed. Please try again.') }
        if (authSession?.user) {
          const authUser = authSession.user
          const language = authUser.user_metadata?.gymbook_language
          if (language) {
            get().update(state => { state.lang = language }, false)
            await setLang(language)
          }
          const user = {
            id: authUser.id,
            email: authUser.email,
            createdAt: authUser.created_at || '',
            tutorialSeenAt: authUser.user_metadata?.gymbook_tutorial_seen_at || get().user?.tutorialSeenAt || null,
            name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Gym Book Training user',
            dateOfBirth: authUser.user_metadata?.date_of_birth || '',
            needsLegalSetup: needsLegalSetup(authUser),
            trainingDataConsent: false,
          }
          get().setUser(user)
          // Backup authorization affects cloud backup only, not access to local workouts.
          // Resolve it after the app is usable so a slow/offline Supabase request cannot
          // leave Android on "Loading data..." indefinitely.
          void getCloudBackupConsent(authSession).then(({ accepted }) => {
            if (get().user?.id === user.id) get().setUser({ ...get().user, trainingDataConsent: accepted === true })
          }).catch(() => {})
        } else {
          get().setUser(null)
        }
        clearTimeout(reminderTm)
        reminderTm = null
        void syncReminder(get().S)
        set({ ready: true, signingIn: false })
        return
      }
      // Demo build (GitHub Pages): no backend at all — seed once, stay in guest mode.
      if (DEMO) {
        if (!localStorage.getItem(DEMO_SEEDED)) {
          localStorage.setItem(DEMO_SEEDED, '1')
          await get().resetDemo()
        }
        get().setGuest(true)
        set({ ready: true, signingIn: false })
        return
      }
      let authSession = null
      try { authSession = await processOAuthCallback() }
      catch (e) { localStorage.setItem('gym_auth_error', e.message || 'Google sign-in failed. Please try again.') }

      // A recovery link grants a temporary Supabase session only for setting a new
      // password. Do not create a Gym Book Training app session until the user signs in again.
      if (authSession && isPasswordRecovery()) {
        set({ ready: true, signingIn: false })
        return
      }

      if (authSession?.user && needsLegalSetup(authSession.user)) {
        const authUser = authSession.user
        const language = authUser.user_metadata?.gymbook_language
        if (language) {
          get().update(state => { state.lang = language }, false)
          await setLang(language)
        }
        get().setUser({
          id: authUser.id, email: authUser.email, createdAt: authUser.created_at || '',
          tutorialSeenAt: authUser.user_metadata?.gymbook_tutorial_seen_at || get().user?.tutorialSeenAt || null,
          name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Gym Book Training user',
          dateOfBirth: authUser.user_metadata?.date_of_birth || '',
          needsLegalSetup: true,
        })
        set({ ready: true, signingIn: false })
        return
      }

      // An explicit sign-out takes precedence over existing cookies/tokens, but a fresh OAuth
      // callback must be allowed to finish after the user starts a new Google sign-in.
      if (!authSession && localStorage.getItem(SIGNED_OUT_KEY) === '1') {
        get().setUser(null)
        set({ ready: true, signingIn: false })
        return
      }

      // A fresh visitor has no app session to restore. Show the login screen without
      // waiting for a round trip to the API (or Supabase) just to confirm that fact.
      // Existing signed-in users and OAuth callbacks still take the full restore path.
      if (!authSession && !localStorage.getItem('gym_user')) {
        set({ ready: true, signingIn: false })
        return
      }

      let appUser = null
      let initialState
      let initialStateFetched = false
      if (authSession?.access_token) {
        try {
          const result = await createAppSessionWithSupabase(authSession.access_token, getPendingRecoveryCode())
          appUser = result.user
          initialState = result.state
          initialStateFetched = Object.hasOwn(result, 'state')
          clearPendingRecoveryCode()
        }
        catch (e) { localStorage.setItem('gym_auth_error', e.message || 'Could not connect your account to Gym Book Training.') }
      }
      if (!authSession) {
        try {
          const result = await api('/api/me')
          appUser = result.user
          initialState = result.state
          initialStateFetched = Object.hasOwn(result, 'state')
        }
        catch {
          get().setUser(null)
          try {
            authSession = await getAuthSession()
            if (authSession?.access_token) {
              const result = await createAppSessionWithSupabase(authSession.access_token, getPendingRecoveryCode())
              appUser = result.user
              initialState = result.state
              initialStateFetched = Object.hasOwn(result, 'state')
              clearPendingRecoveryCode()
            }
          } catch (e) { localStorage.setItem('gym_auth_error', e.message || 'Could not connect your account to Gym Book Training.') }
        }
      }
      if (appUser) {
        const localUser = get().user
        get().setUser({ ...appUser, tutorialSeenAt: appUser.tutorialSeenAt || authSession?.user?.user_metadata?.gymbook_tutorial_seen_at || localUser?.tutorialSeenAt || null })
        try { await get().pullState(initialState, initialStateFetched, true) }
        catch (e) {
          get().setUser(null)
          localStorage.setItem('gym_auth_error', e.message || 'Could not load your profile data.')
        }
        // Re-stamp the reminder's timezone on every load — keeps it correct if you're travelling,
        // without needing to revisit Settings.
        const tz = localTZ()
        if (get().S.reminder?.on && get().S.reminder.tz !== tz) {
          get().update(s => { s.reminder = { ...s.reminder, tz } })
        }
      }
      set({ ready: true, signingIn: false })
    }
  }
})

export { hasData }
