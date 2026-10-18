// Small Supabase Auth REST client. Keeps the web app dependency-light while using
// Supabase's hosted password, OAuth and refresh-token flows.
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '').replace(/\/rest\/v1$/i, '')
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const SESSION_KEY = 'gym_supabase_session_v1'
const OAUTH_KEY = 'gym_supabase_oauth_v1'
export const NATIVE_OAUTH_REDIRECT = 'com.jusar23.gymbook://auth-callback'
const RECOVERY_KEY = 'gym_pending_recovery_code'
const PASSWORD_RECOVERY_FLOW_KEY = 'gym_password_recovery_flow_v1'
const PASSWORD_RECOVERY_VERIFIER_KEY = 'gym_password_recovery_verifier_v1'
const PASSWORD_RECOVERY_KEY = 'gym_password_recovery_v1'
const timeoutSignal = ms => {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') return AbortSignal.timeout(ms)
  if (typeof AbortController === 'undefined') return undefined
  const controller = new AbortController()
  setTimeout(() => controller.abort(), ms)
  return controller.signal
}

function authTimeoutError(error) {
  if (error?.name === 'AbortError' || error?.name === 'TimeoutError') {
    return new Error('Authentication request timed out. Check your connection and try again.')
  }
  return error
}

// Android's emulator live-reload origin (http://10.0.2.2) is not a secure context, so
// WebCrypto's subtle.digest may be unavailable even though getRandomValues still works.
// Keep PKCE working there with a small SHA-256 fallback; production Capacitor origins use
// the native WebCrypto implementation.
async function sha256(input) {
  if (globalThis.crypto?.subtle) return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input)))

  const bytes = new TextEncoder().encode(input)
  const bitLength = bytes.length * 8
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64
  const data = new Uint8Array(paddedLength)
  data.set(bytes)
  data[bytes.length] = 0x80
  const view = new DataView(data.buffer)
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000), false)
  view.setUint32(paddedLength - 4, bitLength >>> 0, false)

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]
  const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]
  const rotr = (x, n) => (x >>> n) | (x << (32 - n))
  const w = new Uint32Array(64)

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4, false)
    for (let i = 16; i < 64; i++) {
      const x = w[i - 15], y = w[i - 2]
      const s0 = rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3)
      const s1 = rotr(y, 17) ^ rotr(y, 19) ^ (y >>> 10)
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0
    }
    let [a, b, c, d, e, f, g, hh] = h
    for (let i = 0; i < 64; i++) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)
      const ch = (e & f) ^ (~e & g)
      const t1 = (hh + s1 + ch + k[i] + w[i]) >>> 0
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const t2 = (s0 + maj) >>> 0
      hh = g; g = f; f = e; e = (d + t1) >>> 0
      d = c; c = b; b = a; a = (t1 + t2) >>> 0
    }
    h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0
    h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0
    h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0
    h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0
  }

  const digest = new Uint8Array(32)
  const out = new DataView(digest.buffer)
  h.forEach((word, i) => out.setUint32(i * 4, word, false))
  return digest
}

const toBase64Url = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

export const supabaseAuthConfigured = () => !!(SUPABASE_URL && SUPABASE_KEY)
export const savePendingRecoveryCode = code => {
  if (code?.trim()) sessionStorage.setItem(RECOVERY_KEY, code.trim().toUpperCase())
  else sessionStorage.removeItem(RECOVERY_KEY)
}
export const getPendingRecoveryCode = () => sessionStorage.getItem(RECOVERY_KEY) || ''
export const clearPendingRecoveryCode = () => sessionStorage.removeItem(RECOVERY_KEY)
export const isPasswordRecovery = () => sessionStorage.getItem(PASSWORD_RECOVERY_KEY) === '1'

export async function requestPasswordReset(email) {
  requireConfig()
  const verifier = randomVerifier()
  const challenge = toBase64Url(await sha256(verifier))
  const redirectTo = `${window.location.origin}${window.location.pathname}`
  // localStorage lets the email link finish in a new tab in the same browser.
  localStorage.setItem(PASSWORD_RECOVERY_VERIFIER_KEY, verifier)
  localStorage.setItem(PASSWORD_RECOVERY_FLOW_KEY, '1')
  try {
    await authRequest(`recover?redirect_to=${encodeURIComponent(redirectTo)}`, {
      email: email.trim(), code_challenge: challenge, code_challenge_method: 's256'
    })
  } catch (error) {
    localStorage.removeItem(PASSWORD_RECOVERY_VERIFIER_KEY)
    localStorage.removeItem(PASSWORD_RECOVERY_FLOW_KEY)
    throw error
  }
}

export async function updateRecoveredPassword(password) {
  const session = readSession()
  if (!session?.access_token || !isPasswordRecovery()) throw new Error('This password reset link is invalid or has expired. Request a new one.')
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: 'PUT',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.msg || data.message || data.error_description || data.error || 'Could not update the password.')
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(PASSWORD_RECOVERY_KEY)
  localStorage.removeItem(PASSWORD_RECOVERY_FLOW_KEY)
  localStorage.removeItem(PASSWORD_RECOVERY_VERIFIER_KEY)
  return data
}

export function cancelPasswordRecovery() {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(PASSWORD_RECOVERY_KEY)
  localStorage.removeItem(PASSWORD_RECOVERY_FLOW_KEY)
  localStorage.removeItem(PASSWORD_RECOVERY_VERIFIER_KEY)
}

function requireConfig() {
  if (!supabaseAuthConfigured()) throw new Error('Supabase Auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
}

async function authRequest(path, body) {
  requireConfig()
  let response
  try {
    response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: timeoutSignal(15000),
    })
  } catch (error) { throw authTimeoutError(error) }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.msg || data.message || data.error_description || data.error || `Authentication failed (HTTP ${response.status}).`)
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

export async function processOAuthCallback(callbackUrl = '') {
  const callback = callbackUrl ? new URL(callbackUrl) : new URL(window.location.href)
  const params = callback.searchParams
  const code = params.get('code')
  const oauthError = params.get('error_description') || params.get('error')
  const clearOAuth = () => { localStorage.removeItem(OAUTH_KEY); sessionStorage.removeItem(OAUTH_KEY) }
  if (oauthError) { if (!callbackUrl) cleanOAuthUrl(); clearOAuth(); sessionStorage.removeItem(RECOVERY_KEY); sessionStorage.removeItem(PASSWORD_RECOVERY_KEY); localStorage.removeItem(PASSWORD_RECOVERY_FLOW_KEY); localStorage.removeItem(PASSWORD_RECOVERY_VERIFIER_KEY); throw new Error(oauthError) }
  if (!code) return null
  const passwordRecovery = localStorage.getItem(PASSWORD_RECOVERY_FLOW_KEY) === '1'
  let pending = null
  if (passwordRecovery) pending = { verifier: localStorage.getItem(PASSWORD_RECOVERY_VERIFIER_KEY) }
  else try { pending = JSON.parse(localStorage.getItem(OAUTH_KEY) || sessionStorage.getItem(OAUTH_KEY)) } catch { /* expired or malformed */ }
  if (!callbackUrl) cleanOAuthUrl()
  if (passwordRecovery) {
    localStorage.removeItem(PASSWORD_RECOVERY_FLOW_KEY)
    localStorage.removeItem(PASSWORD_RECOVERY_VERIFIER_KEY)
  } else clearOAuth()
  if (!pending?.verifier) {
    sessionStorage.removeItem(RECOVERY_KEY)
    localStorage.removeItem(PASSWORD_RECOVERY_FLOW_KEY)
    localStorage.removeItem(PASSWORD_RECOVERY_VERIFIER_KEY)
    throw new Error('The Google sign-in expired. Please try again.')
  }
  const session = await authRequest('token?grant_type=pkce', { auth_code: code, code_verifier: pending.verifier })
  if (passwordRecovery) {
    sessionStorage.setItem(PASSWORD_RECOVERY_KEY, '1')
  }
  return saveSession(session)
}

export async function createEmailAccount({ email, password, name, legalMetadata = {} }) {
  const redirectTo = `${window.location.origin}${window.location.pathname}`
  const data = await authRequest(`signup?redirect_to=${encodeURIComponent(redirectTo)}`, {
    email: email.trim(), password,
    data: { full_name: name.trim(), ...legalMetadata }
  })
  return data.access_token ? saveSession(data) : { confirmationRequired: true }
}

export async function updateAuthUserMetadata(metadata) {
  requireConfig()
  const session = await getAuthSession()
  if (!session?.access_token) throw new Error('Sign in again to save your registration details.')
  let response
  try {
    response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: 'PUT',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: metadata }),
      signal: timeoutSignal(15000),
    })
  } catch (error) { throw authTimeoutError(error) }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.msg || data.message || data.error_description || 'Could not save your registration details.')
  const updated = saveSession({ ...session, user: data.user || data })
  return updated.user
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
  const challenge = toBase64Url(await sha256(verifier))
  // The app may be backgrounded or recreated while the system browser is open.
  localStorage.setItem(OAUTH_KEY, JSON.stringify({ verifier }))
  savePendingRecoveryCode(recoveryCode)
  let redirectTo = `${window.location.origin}${window.location.pathname}`
  let native = false
  if (import.meta.env.VITE_MOBILE === '1') {
    const { Capacitor } = await import('@capacitor/core')
    native = Capacitor.isNativePlatform()
    if (native) redirectTo = NATIVE_OAUTH_REDIRECT
  }
  const params = new URLSearchParams({
    apikey: SUPABASE_KEY,
    provider: 'google',
    redirect_to: redirectTo,
    code_challenge: challenge,
    code_challenge_method: 's256'
  })
  const authorizeUrl = `${SUPABASE_URL}/auth/v1/authorize?${params}`
  if (native) {
    const { Browser } = await import('@capacitor/browser')
    await Browser.open({ url: authorizeUrl })
  } else window.location.assign(authorizeUrl)
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
  // Use the token already on this device: refreshing a near-expired session would add another
  // request to sign-out. The app's own session is revoked separately by its logout endpoint.
  const session = readSession()
  localStorage.removeItem(SESSION_KEY)
  if (session?.access_token) {
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/logout${global ? '?scope=global' : ''}`, {
        method: 'POST', headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${session.access_token}` },
        signal: timeoutSignal(3000),
      })
    } catch { /* Local sign-out still proceeds while offline. */ }
  }
}

export async function deleteSupabaseAccount() {
  requireConfig()
  const session = await getAuthSession()
  if (!session?.access_token) throw new Error('Sign in again before deleting your account.')
  let response
  try {
    response = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    })
  } catch {
    throw new Error('Could not reach the account deletion service. Check the internet connection and confirm the delete-account Supabase Function is deployed.')
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.error || data.message || `Could not delete the account (HTTP ${response.status}).`)
    error.details = data.details || ''
    throw error
  }
}
