import { lazy, Suspense, useEffect } from 'react'
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
const Home = lazy(() => import('./views/Home.jsx'))
const Plan = lazy(() => import('./views/Plan.jsx'))
const RoutineEdit = lazy(() => import('./views/RoutineEdit.jsx'))
const Workout = lazy(() => import('./views/Workout.jsx'))
const Stats = lazy(() => import('./views/Stats.jsx'))
const History = lazy(() => import('./views/History.jsx'))
const Library = lazy(() => import('./views/Library.jsx'))
const Settings = lazy(() => import('./views/Settings.jsx'))
const Admin = lazy(() => import('./views/Admin.jsx'))

bindUI(useUI)   // lets the shared controls open sheets without importing the store at module scope
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
  const langV = useLang()   // re-renders the whole shell when the language (pack) changes
  useEffect(() => { setNav(navigate) }, [navigate])
  useEffect(() => { applyPrefs(S.theme, S.accent) }, [S.theme, S.accent])
  useEffect(() => { setLang(S.lang || 'en') }, [S.lang])
  useEffect(() => { document.documentElement.lang = S.lang || 'en' }, [langV, S.lang])
  // every tab/route change starts at the top of the page
  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])
  // bound to the workout, not to the route — checking Stats mid-session keeps the screen on
  useWakeLock(!!S.active && S.keepAwake !== false)

  const authed = user || isGuest
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
        <div className="loading-label">{signingIn ? 'Signing in…' : 'Loading…'}</div>
      </div>
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
      {/* keyed on the route: a view that throws is contained, and switching tabs
          re-mounts the boundary, so the tab bar is always a way out */}
      <div id="app" className="vfade" key={loc.pathname}>
        {authed && <div className="app-topbar">
          <div className="app-brand">gymbook</div>
          {MAIN_TABS.has(loc.pathname) && <button className="iconbtn" onClick={() => navigate('/settings')} aria-label={t('Settings')} title={t('Settings')}><Icon name="gear" /></button>}
        </div>}
        <ErrorBoundary>
          {!authed ? <Login /> : (
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
      <TabBar onStart={startFlow} />
      <RestTimer />
      <Modals />
      <Toast />
    </>
  )
}

export default function App() {
  const boot = useStore(s => s.boot)
  useEffect(() => { boot() }, [boot])
  return <HashRouter><Shell /></HashRouter>
}
