// Small Supabase Auth REST client. Keeps the web app dependency-light while using
// Supabase's hosted password, OAuth and refresh-token flows.
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const SESSION_KEY = 'gym_supabase_session_v1'
const OAUTH_KEY = 'gym_supabase_oauth_v1'
const RECOVERY_KEY = 'gym_pending_recovery_code'

export const supabaseAuthConfigured = () => !!(SUPABASE_URL && SUPABASE_KEY)
export const savePendingRecoveryCode = code => {
  if (code?.trim()) sessionStorage.setItem(RECOVERY_KEY, code.trim().toUpperCase())
  else sessionStorage.removeItem(RECOVERY_KEY)
}
export const getPendingRecoveryCode = () => sessionStorage.getItem(RECOVERY_KEY) || ''
export const clearPendingRecoveryCode = () => sessionStorage.removeItem(RECOVERY_KEY)

function requireConfig() {
  if (!supabaseAuthConfigured()) throw new Error('Supabase Auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
}

async function authRequest(path, body) {
  requireConfig()
  const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.msg || data.message || data.error_description || data.error || 'Authentication failed.')
  return data
}

function saveSession(session) {
  if (!session?.access_token || !session?.refresh_token) throw new Error('Supabase did not return a valid session.')
  const value = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at || Math.floor(Date.now() / 1000) + (session.expires_in || 3600),
    user: session.user || null
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(value))
  return value
}

function readSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null } catch { return null }
}

function cleanOAuthUrl() {
  const clean = `${window.location.pathname}${window.location.hash.startsWith('#/') ? window.location.hash : '#/'}`
  window.history.replaceState({}, document.title, clean)
}

export async function processOAuthCallback() {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const oauthError = params.get('error_description') || params.get('error')
  if (oauthError) { cleanOAuthUrl(); sessionStorage.removeItem(OAUTH_KEY); sessionStorage.removeItem(RECOVERY_KEY); throw new Error(oauthError) }
  if (!code) return null
  let pending = null
  try { pending = JSON.parse(sessionStorage.getItem(OAUTH_KEY)) } catch { /* expired or malformed */ }
  cleanOAuthUrl()
  sessionStorage.removeItem(OAUTH_KEY)
  if (!pending?.verifier) {
    sessionStorage.removeItem(RECOVERY_KEY)
    throw new Error('The Google sign-in expired. Please try again.')
  }
  const session = await authRequest('token?grant_type=pkce', { auth_code: code, code_verifier: pending.verifier })
  return saveSession(session)
}

export async function createEmailAccount({ email, password, name }) {
  const redirectTo = `${window.location.origin}${window.location.pathname}`
  const data = await authRequest(`signup?redirect_to=${encodeURIComponent(redirectTo)}`, {
    email: email.trim(), password,
    data: { full_name: name.trim() }
  })
  return data.access_token ? saveSession(data) : { confirmationRequired: true }
}

export async function signInWithEmail({ email, password }) {
  return saveSession(await authRequest('token?grant_type=password', { email: email.trim(), password }))
}

function randomVerifier() {
  const bytes = crypto.getRandomValues(new Uint8Array(48))
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function signInWithGoogle(recoveryCode = '') {
  requireConfig()
  const verifier = randomVerifier()
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  sessionStorage.setItem(OAUTH_KEY, JSON.stringify({ verifier }))
  savePendingRecoveryCode(recoveryCode)
  const params = new URLSearchParams({
    apikey: SUPABASE_KEY,
    provider: 'google',
    redirect_to: `${window.location.origin}${window.location.pathname}`,
    code_challenge: challenge,
    code_challenge_method: 's256'
  })
  window.location.assign(`${SUPABASE_URL}/auth/v1/authorize?${params}`)
}

export async function getAuthSession() {
  let session = readSession()
  if (!session) return null
  if (session.expires_at > Math.floor(Date.now() / 1000) + 60) return session
  try {
    session = saveSession(await authRequest('token?grant_type=refresh_token', { refresh_token: session.refresh_token }))
    return session
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export async function signOutSupabase(global = false) {
  const session = await getAuthSession()
  if (session?.access_token) {
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/logout${global ? '?scope=global' : ''}`, {
        method: 'POST', headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${session.access_token}` }
      })
    } catch { /* Local sign-out still proceeds while offline. */ }
  }
  localStorage.removeItem(SESSION_KEY)
}
