export const LEGAL_VERSION = '1.9'
// Workout-data consent has its own release cycle and is enforced by the deployed
// Supabase RPCs and API server. Keep it separate from the terms/privacy version.
export const TRAINING_DATA_CONSENT_VERSION = '1.7'

export function hasTrainingDataConsent(metadata = {}) {
  if (metadata.gymbook_sensitive_training_consent !== true) return false
  const version = metadata.gymbook_sensitive_training_consent_version
  const textVersion = metadata.gymbook_sensitive_training_consent_text_version
  const current = version === TRAINING_DATA_CONSENT_VERSION && textVersion === TRAINING_DATA_CONSENT_VERSION
  // Compatibility for the app build that incorrectly used LEGAL_VERSION (1.9) for
  // workout-data consent. It still represents an explicit, timestamped opt-in.
  const legacy = version === LEGAL_VERSION && textVersion === LEGAL_VERSION
  return (current || legacy)
    && typeof metadata.gymbook_sensitive_training_consent_at === 'string'
    && Number.isFinite(Date.parse(metadata.gymbook_sensitive_training_consent_at))
}

export function legalConsentMetadata({ dateOfBirth, countryCode, trainingDataAccepted = false, language = 'en' }) {
  const acceptedAt = new Date().toISOString()
  return {
    date_of_birth: dateOfBirth,
    country_code: countryCode,
    gymbook_language: language,
    gymbook_terms_version: LEGAL_VERSION,
    gymbook_privacy_version: LEGAL_VERSION,
    gymbook_accepted_at: acceptedAt,
    gymbook_sensitive_training_consent: trainingDataAccepted === true,
    gymbook_sensitive_training_consent_version: TRAINING_DATA_CONSENT_VERSION,
    gymbook_sensitive_training_consent_at: trainingDataAccepted ? acceptedAt : null,
    gymbook_sensitive_training_consent_text_version: TRAINING_DATA_CONSENT_VERSION,
  }
}

export function needsLegalSetup(user) {
  const metadata = user?.user_metadata || {}
  return !metadata.date_of_birth || !metadata.country_code
    || metadata.gymbook_terms_version !== LEGAL_VERSION
    || metadata.gymbook_privacy_version !== LEGAL_VERSION
}
