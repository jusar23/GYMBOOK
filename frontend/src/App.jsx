import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useStore } from './store/useStore.js'
import { useUI } from './store/useUI.js'
import { bindUI } from './components/ui.jsx'
import { ACCENTS } from './lib/format.js'
import { setLang, useLang, t } from './lib/i18n.js'
import { setNav } from './lib/nav.js'
import { useWakeLock } from './lib/wakelock.js'
import { startFlow } from './sheets.jsx'
import Icon from './components/Icon.jsx'
import TabBar from './components/TabBar.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import Modals from './components/Modals.jsx'
import Toast from './components/Toast.jsx'
import RestTimer from './components/RestTimer.jsx'
import Login from './views/Login.jsx'
import { MOBILE } from './lib/mobile.js'
import { NATIVE_OAUTH_REDIRECT, processOAuthCallback } from './lib/supabaseAuth.js'
import { needsLegalSetup } from './lib/legalConsent.js'
import { openTutorial, tutorialSeenKey } from './components/Tutorial.jsx'
import SubscriptionGate from './views/SubscriptionGate.jsx'
import { refreshNativeSubscription } from './lib/subscription.js'
import { setWorkoutOrientationLocked } from './lib/workout-orientation.js'

const Home = lazy(() => import('./views/Home.jsx'))
const Plan = lazy(() => import('./views/Plan.jsx'))
const RoutineEdit = lazy(() => import('./views/RoutineEdit.jsx'))
const Workout = lazy(() => import('./views/Workout.jsx'))
const Stats = lazy(() => import('./views/Stats.jsx'))
const History = lazy(() => import('./views/History.jsx'))
const Library = lazy(() => import('./views/Library.jsx'))
const Settings = lazy(() => import('./views/Settings.jsx'))
const Admin = lazy(() => import('./views/Admin.jsx'))
const Legal = lazy(() => import('./views/Legal.jsx'))

bindUI(useUI)
const MAIN_TABS = new Set(['/home', '/plan', '/workout', '/stats', '/library'])

function applyPrefs(theme, accent) {
  const de = document.documentElement
  de.dataset.theme = theme === 'light' ? 'light' : 'dark'
  const accentKey = ACCENTS[accent] ? accent : 'lime'
  const colors = ACCENTS[accentKey]
  de.dataset.accent = accentKey
  de.style.setProperty('--acc', de.dataset.theme === 'light' ? colors.light : colors.dark)
  de.style.setProperty('--acc-2', de.dataset.theme === 'light' ? colors.light : colors.dark)
  de.style.setProperty('--on-acc', de.dataset.theme === 'light' ? '#fff' : '#000')
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.content = de.dataset.theme === 'light' ? '#f2f2f7' : '#000000'
}

function Shell() {
  const navigate = useNavigate()
  const loc = useLocation()
  const user = useStore(s => s.user)
  const ready = useStore(s => s.ready)
  const signingOut = useStore(s => s.signingOut)
  const signingIn = useStore(s => s.signingIn)
  const theme = useStore(s => s.S.theme)
  const accent = useStore(s => s.S.accent)
  const lang = useStore(s => s.S.lang)
  const workoutActive = useStore(s => !!s.S.active)
  const keepAwake = useStore(s => s.S.keepAwake)
  const lockOrientation = useStore(s => s.S.lockOrientation)
  const hasTrainingHistory = useStore(s => !!(s.S.workouts?.length || s.S.routines?.length || s.S.active))
  const [subscription, setSubscription] = useState(() => MOBILE && useStore.getState().user?.id
    ? { configured: true, status: 'loading', granted: false, packages: [] }
    : { configured: false, status: 'unconfigured', granted: true, packages: [] })
  const isGuest = useStore(s => s.isGuest())
  const langV = useLang()
  const tutorialOpenedFor = useRef('')
  const checkSubscription = useCallback(async () => {
    if (!MOBILE || !user?.id || user.needsLegalSetup) {
      setSubscription({ configured: false, status: 'unconfigured', granted: true, packages: [] })
      return
    }
    setSubscription(current => ({ ...current, configured: true, status: 'loading' }))
    const next = await refreshNativeSubscription(user.id)
    setSubscription(next)
  }, [user?.id, user?.needsLegalSetup])
  const authed = !!user || (!MOBILE && isGuest)
  const loginRoute = loc.pathname === '/login'

  useEffect(() => { setNav(navigate) }, [navigate])
  useEffect(() => {
    if (!ready) return
    void checkSubscription()
  }, [ready, checkSubscription])
  useEffect(() => {
    if (!MOBILE || !ready || !user?.id || user.needsLegalSetup) return
    let resumeTimer
    const recheck = () => {
      if (document.visibilityState !== 'visible') return
      clearTimeout(resumeTimer)
      resumeTimer = setTimeout(() => void checkSubscription(), 250)
    }
    window.addEventListener('focus', recheck)
    document.addEventListener('visibilitychange', recheck)
    let expiryTimer
    if (subscription.granted && subscription.expiresAt) {
      const delay = Date.parse(subscription.expiresAt) - Date.now() + 500
      if (delay > 0) expiryTimer = setTimeout(() => void checkSubscription(), Math.min(delay, 2147483000))
      else expiryTimer = setTimeout(() => void checkSubscription(), 0)
    }
    return () => {
      window.removeEventListener('focus', recheck)
      document.removeEventListener('visibilitychange', recheck)
      clearTimeout(resumeTimer)
      clearTimeout(expiryTimer)
    }
  }, [ready, user?.id, user?.needsLegalSetup, subscription.granted, subscription.expiresAt, checkSubscription])
  useEffect(() => { applyPrefs(theme, accent) }, [theme, accent])
  useEffect(() => { setLang(lang || 'en') }, [lang])
  useEffect(() => { document.documentElement.lang = lang || 'en' }, [langV, lang])
  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])
  useWakeLock(workoutActive && keepAwake !== false)
  useEffect(() => {
    const locked = workoutActive && lockOrientation === true
    void setWorkoutOrientationLocked(locked)
    return () => { void setWorkoutOrientationLocked(false) }
  }, [workoutActive, lockOrientation])

  useEffect(() => {
    if (!MOBILE || !ready || !user?.id || user.needsLegalSetup) return
    if (hasTrainingHistory) return
    const key = tutorialSeenKey(user.id)
    if (tutorialOpenedFor.current === user.id || localStorage.getItem(key) === '1') return
    tutorialOpenedFor.current = user.id
    localStorage.setItem(key, '1')
    openTutorial()
  }, [ready, user?.id, user?.needsLegalSetup, hasTrainingHistory])

  if (signingOut) return (
    <div id="app">
      <div className="loading-mark" role="status" aria-label="Signing out of Gym Book Training">
        <Icon name="bookTraining" />
        <div className="loading-label">Signing out…</div>
      </div>
    </div>
  )

  if (!ready) return (
    <div id="app">
      <div className="loading-mark" role="status" aria-label="Signing in to Gym Book Training">
        <Icon name="bookTraining" />
        <div className="loading-label">{signingIn ? 'Signing in…' : t('Loading data...')}</div>
      </div>
    </div>
  )

  if (loc.pathname === '/legal' || loc.pathname.startsWith('/legal/')) return (
    <div id="app" className="vfade">
      <Suspense fallback={<div className="loading-mark" role="status" aria-label="Loading legal information"><Icon name="bookTraining" /><div className="loading-label">Loading…</div></div>}>
        <Legal />
      </Suspense>
    </div>
  )

  return (
    <>
      {signingIn && <div className="app-loading-overlay">
        <div className="loading-mark" role="status" aria-label="Signing in to Gym Book Training">
          <Icon name="bookTraining" />
          <div className="loading-label">Signing in…</div>
        </div>
      </div>}

      <div id="app" className="vfade" key={loc.pathname}>
        {authed && !loginRoute && !user?.needsLegalSetup && <div className="app-topbar">
          <div className="app-brand">Gym Book Training</div>
          {MAIN_TABS.has(loc.pathname) && <button className="iconbtn" onClick={() => navigate('/settings')} aria-label={t('Settings')} title={t('Settings')}><Icon name="gear" /></button>}
        </div>}

        <ErrorBoundary>
          {loginRoute
            ? (user && !user.needsLegalSetup ? <Navigate to="/home" replace /> : <Login legalSetup={!!user?.needsLegalSetup} />)
            : user?.needsLegalSetup
              ? <Login legalSetup />
            : MOBILE && !!user?.id && subscription.configured && (!subscription.granted || subscription.status === 'loading')
              ? <SubscriptionGate user={user} status={subscription} refresh={checkSubscription} />
            : !authed
              ? <Login />
              : (
                <Suspense fallback={<div className="loading-mark" role="status" aria-label="Loading Gym Book Training"><Icon name="bookTraining" /><div className="loading-label">Loading…</div></div>}>
                  <Routes>
                    <Route path="/home" element={<Home />} />
                    <Route path="/plan" element={<Plan />} />
                    <Route path="/plan/r/:id" element={<RoutineEdit />} />
                    <Route path="/workout" element={<Workout />} />
                    <Route path="/stats" element={<Stats />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/library" element={<Library />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/admin" element={user?.admin ? <Admin /> : <Navigate to="/home" replace />} />
                    <Route path="*" element={<Navigate to="/home" replace />} />
                  </Routes>
                </Suspense>
              )}
        </ErrorBoundary>
      </div>

      {authed && !loginRoute && !user?.needsLegalSetup && <TabBar onStart={startFlow} />}
      {authed && !loginRoute && !user?.needsLegalSetup && <RestTimer />}
      <Modals />
      <Toast />
    </>
  )
}

export default function App() {
  const boot = useStore(s => s.boot)
  useEffect(() => {
    if (!MOBILE) return
    let disposed = false
    let removeListener = null
    const handled = new Set()

    const handleOAuthUrl = async url => {
      if (!url?.startsWith(NATIVE_OAUTH_REDIRECT) || handled.has(url)) return
      handled.add(url)
      try { await import('@capacitor/browser').then(({ Browser }) => Browser.close()) } catch { /* tab may already be closed */ }
      try {
        const session = await processOAuthCallback(url)
        if (session?.user) {
          if (!useStore.getState().ready) await new Promise(resolve => {
            const unsubscribe = useStore.subscribe(state => {
              if (state.ready) { unsubscribe(); resolve() }
            })
            if (useStore.getState().ready) { unsubscribe(); resolve() }
          })
          const authUser = session.user
          useStore.getState().setUser({
            id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Gym Book Training user',
            needsLegalSetup: needsLegalSetup(authUser),
          })
        }
        useStore.getState().setSigningIn(false)
      } catch (error) {
        localStorage.setItem('gym_auth_error', error.message || 'Google sign-in failed. Please try again.')
        window.location.reload()
      }
    }

    ;(async () => {
      const { Capacitor } = await import('@capacitor/core')
      if (!Capacitor.isNativePlatform()) return
      const { App: NativeApp } = await import('@capacitor/app')
      const listener = await NativeApp.addListener('appUrlOpen', ({ url }) => { void handleOAuthUrl(url) })
      if (disposed) { listener.remove(); return }
      removeListener = () => listener.remove()
      const launch = await NativeApp.getLaunchUrl()
      if (launch?.url) await handleOAuthUrl(launch.url)
    })().catch(error => {
      localStorage.setItem('gym_auth_error', error.message || 'Could not initialize Google sign-in.')
    })

    return () => { disposed = true; removeListener?.() }
  }, [])
  useEffect(() => { boot() }, [boot])
  return <HashRouter><Shell /></HashRouter>
}
