import { lazy, Suspense, useEffect, useRef } from 'react'
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
  const { S, user, ready, signingOut, signingIn } = useStore()
  const isGuest = useStore(s => s.isGuest())
  const langV = useLang()
  const tutorialOpenedFor = useRef('')
  const authed = !!user || (!MOBILE && isGuest)
  const loginRoute = loc.pathname === '/login'

  useEffect(() => { setNav(navigate) }, [navigate])
  useEffect(() => { applyPrefs(S.theme, S.accent) }, [S.theme, S.accent])
  useEffect(() => { setLang(S.lang || 'en') }, [S.lang])
  useEffect(() => { document.documentElement.lang = S.lang || 'en' }, [langV, S.lang])
  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])
  useWakeLock(!!S.active && S.keepAwake !== false)

  useEffect(() => {
    if (!MOBILE || !ready || !user?.id || user.needsLegalSetup) return
    const hasTrainingHistory = !!(S.workouts?.length || S.routines?.length || S.active)
    if (hasTrainingHistory) return
    const key = tutorialSeenKey(user.id)
    if (tutorialOpenedFor.current === user.id || localStorage.getItem(key) === '1') return
    tutorialOpenedFor.current = user.id
    localStorage.setItem(key, '1')
    openTutorial()
  }, [ready, user?.id, user?.needsLegalSetup, S.workouts?.length, S.routines?.length, !!S.active])

  if (signingOut) return (
    <div id="app">
      <div className="loading-mark" role="status" aria-label="Signing out of gymbook">
        <Icon name="dumbbell" />
        <div className="loading-label">Signing out…</div>
      </div>
    </div>
  )

  if (!ready) return (
    <div id="app">
      <div className="loading-mark" role="status" aria-label="Signing in to gymbook">
        <Icon name="dumbbell" />
        <div className="loading-label">{signingIn ? 'Signing in…' : t('Loading data...')}</div>
      </div>
    </div>
  )

  if (loc.pathname === '/legal' || loc.pathname.startsWith('/legal/')) return (
    <div id="app" className="vfade">
      <Suspense fallback={<div className="loading-mark" role="status" aria-label="Loading legal information"><Icon name="dumbbell" /><div className="loading-label">Loading…</div></div>}>
        <Legal />
      </Suspense>
    </div>
  )

  return (
    <>
      {signingIn && <div className="app-loading-overlay">
        <div className="loading-mark" role="status" aria-label="Signing in to gymbook">
          <Icon name="dumbbell" />
          <div className="loading-label">Signing in…</div>
        </div>
      </div>}

      <div id="app" className="vfade" key={loc.pathname}>
        {authed && !loginRoute && !user?.needsLegalSetup && <div className="app-topbar">
          <div className="app-brand">gymbook</div>
          {MAIN_TABS.has(loc.pathname) && <button className="iconbtn" onClick={() => navigate('/settings')} aria-label={t('Settings')} title={t('Settings')}><Icon name="gear" /></button>}
        </div>}

        <ErrorBoundary>
          {loginRoute
            ? (user && !user.needsLegalSetup ? <Navigate to="/home" replace /> : <Login legalSetup={!!user?.needsLegalSetup} />)
            : user?.needsLegalSetup
              ? <Login legalSetup />
            : !authed
              ? <Login />
              : (
                <Suspense fallback={<div className="loading-mark" role="status" aria-label="Loading gymbook"><Icon name="dumbbell" /><div className="loading-label">Loading…</div></div>}>
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
            name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'GYMBOOK user',
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
