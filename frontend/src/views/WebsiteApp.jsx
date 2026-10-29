import { Suspense, useEffect, lazy } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { LANGS, setLang } from '../lib/i18n.js'
import Website from './Website.jsx'
const TrainingApp = lazy(() => import('../App.jsx'))
const AccountPortal = lazy(() => import('./AccountPortal.jsx'))

const Legal = lazy(() => import('./Legal.jsx'))
const DeleteAccount = lazy(() => import('./DeleteAccount.jsx'))

export default function WebsiteApp() {
  // Keep the public landing page at / and expose the same full training
  // experience through ?app=1. TrainingApp owns its HashRouter, so render it outside
  // the website router.
  if (window.location.pathname.replace(/\/$/, '') === '/app' || new URLSearchParams(window.location.search).get('app') === '1') return <Suspense fallback={<div className="site-loading">Cargando GYMBOOK…</div>}><TrainingApp /></Suspense>
  return <WebsiteRoutes />
}

function WebsiteRoutes() {
  useEffect(() => {
    const saved = localStorage.getItem('gymbook_site_lang')
    void setLang(Object.prototype.hasOwnProperty.call(LANGS, saved) ? saved : 'en')
    const query = new URLSearchParams(window.location.search)
    if ((query.has('code') || query.has('error') || query.has('error_description'))
      && !window.location.hash.startsWith('#/account')) window.location.hash = '/account'
  }, [])
  return <HashRouter><Routes>
    <Route path="/account" element={<Suspense fallback={<div className="site-loading">Loading your account…</div>}><AccountPortal /></Suspense>} />
    <Route path="/delete-account" element={<Suspense fallback={<div className="site-loading">Loading…</div>}><DeleteAccount /></Suspense>} />
    <Route path="/legal/*" element={<Suspense fallback={<div className="site-loading">Cargando información legal…</div>}><Legal /></Suspense>} />
    <Route path="*" element={<Website />} />
  </Routes></HashRouter>
}
