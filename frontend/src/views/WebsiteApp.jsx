import { Suspense, useEffect, lazy } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { LANGS, setLang } from '../lib/i18n.js'
import Website from './Website.jsx'

const Legal = lazy(() => import('./Legal.jsx'))

export default function WebsiteApp() {
  useEffect(() => {
    const saved = localStorage.getItem('gymbook_site_lang')
    void setLang(Object.prototype.hasOwnProperty.call(LANGS, saved) ? saved : 'en')
  }, [])
  return <HashRouter><Routes>
    <Route path="/legal/*" element={<Suspense fallback={<div className="site-loading">Cargando información legal…</div>}><Legal /></Suspense>} />
    <Route path="*" element={<Website />} />
  </Routes></HashRouter>
}
