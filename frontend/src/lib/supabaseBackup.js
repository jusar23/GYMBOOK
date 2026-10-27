import { getAuthSession } from './supabaseAuth.js'
import { LEGAL_VERSION } from './legalConsent.js'

const URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '').replace(/\/rest\/v1$/i, '')
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const TABLE = 'gymbook_backups'

async function rpc(name, body, activeSession = null) {
  if (!URL || !KEY) throw new Error('Supabase is not configured in this mobile build.')
  const session = activeSession || await getAuthSession()
  if (!session?.access_token || !session.user?.id) throw new Error('Sign in to use cloud backup.')
  const response = await fetch(`${URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const result = await response.json().catch(() => null)
  if (!response.ok) throw new Error(result?.message || result?.hint || 'Could not update cloud-backup authorization. Apply the latest Supabase migration.')
  return { session, result }
}

export async function setCloudBackupConsent(accepted, activeSession = null) {
  const { result } = await rpc('gymbook_set_backup_consent', { p_accepted: accepted, p_version: LEGAL_VERSION }, activeSession)
  return result
}

export async function getCloudBackupConsent(activeSession = null) {
  const { session, result } = await rpc('gymbook_get_backup_consent', {}, activeSession)
  const row = Array.isArray(result) ? result[0] : result
  if (row) return row.accepted === true && row.consent_version === LEGAL_VERSION
  const metadata = session.user.user_metadata || {}
  const accepted = metadata.gymbook_sensitive_training_consent === true
    && metadata.gymbook_sensitive_training_consent_version === LEGAL_VERSION
    && metadata.gymbook_sensitive_training_consent_text_version === LEGAL_VERSION
  if (!accepted) return { accepted: false, consent_version: null }
  await setCloudBackupConsent(true, session)
  return { accepted: true, consent_version: LEGAL_VERSION }
}

async function request(path, options = {}, activeSession = null) {
  if (!URL || !KEY) throw new Error('Supabase is not configured in this mobile build.')
  const session = activeSession || await getAuthSession()
  if (!session?.access_token || !session.user?.id) throw new Error('Sign in to use cloud backup.')
  const metadata = session.user.user_metadata || {}
  if (metadata.gymbook_sensitive_training_consent !== true
    || metadata.gymbook_sensitive_training_consent_version !== LEGAL_VERSION
    || metadata.gymbook_sensitive_training_consent_text_version !== LEGAL_VERSION) {
    throw new Error('Authorize workout-data processing before using server backups.')
  }
  const consent = await getCloudBackupConsent(session)
  if (!consent.accepted) throw new Error('Authorize workout-data processing before using server backups.')
  const response = await fetch(`${URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}))
    throw new Error(detail.message || detail.hint || 'Could not access the cloud backup. Check the Supabase backup table setup.')
  }
  return { session, response }
}

export async function saveCloudBackup(state, { skipWithoutConsent = false } = {}) {
  const session = await getAuthSession()
  const row = { user_id: session?.user?.id, state, updated_at: new Date().toISOString() }
  if (!row.user_id) throw new Error('Sign in to use cloud backup.')
  const metadata = session.user.user_metadata || {}
  const consentGiven = metadata.gymbook_sensitive_training_consent === true
    && metadata.gymbook_sensitive_training_consent_version === LEGAL_VERSION
    && metadata.gymbook_sensitive_training_consent_text_version === LEGAL_VERSION
  if (!consentGiven && skipWithoutConsent) return { skipped: true }
  await request(`${TABLE}?on_conflict=user_id`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(row),
  }, session)
  return { saved: true }
}

export async function loadCloudBackup() {
  const session = await getAuthSession()
  if (!session?.user?.id) throw new Error('Sign in to use cloud backup.')
  const { response } = await request(`${TABLE}?select=state,updated_at&user_id=eq.${encodeURIComponent(session.user.id)}&limit=1`, {}, session)
  const rows = await response.json()
  if (!rows.length) return null
  return { state: rows[0].state, updatedAt: rows[0].updated_at, userId: session.user.id }
}
