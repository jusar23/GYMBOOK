import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MOBILE } from './lib/mobile.js'
import './index.css'

const appEntry = MOBILE ? import('./App.jsx') : import('./views/WebsiteApp.jsx')
appEntry.then(({ default: App }) => {
  createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)
})

// The web deployment is an informational site, not an offline app. Remove any old
// gymbook app worker/cache left by a previous web version so it cannot serve the app UI.
if (!MOBILE && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => registrations.forEach(registration => registration.unregister())).catch(() => {})
  if ('caches' in window) caches.keys().then(keys => keys.filter(key => key.startsWith('gymbook-rt-')).forEach(key => caches.delete(key))).catch(() => {})
}
