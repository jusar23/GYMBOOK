import { Suspense, useEffect, lazy } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { LANGS, setLang } from '../lib/i18n.js'
import Website from './Website.jsx'
const AccountPortal = lazy(() => import('./AccountPortal.jsx'))

const Legal = lazy(() => import('./Legal.jsx'))

export default function WebsiteApp() {
  useEffect(() => {
    const saved = localStorage.getItem('gymbook_site_lang')
    void setLang(Object.prototype.hasOwnProperty.call(LANGS, saved) ? saved : 'en')
    const query = new URLSearchParams(window.location.search)
    if ((query.has('code') || query.has('error') || query.has('error_description'))
      && !window.location.hash.startsWith('#/account')) window.location.hash = '/account'
  }, [])
  return <HashRouter><Routes>
    <Route path="/account" element={<Suspense fallback={<div className="site-loading">Loading your account…</div>}><AccountPortal /></Suspense>} />
    <Route path="/legal/*" element={<Suspense fallback={<div className="site-loading">Cargando información legal…</div>}><Legal /></Suspense>} />
    <Route path="*" element={<Website />} />
  </Routes></HashRouter>
}
