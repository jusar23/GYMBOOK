export const LEGAL_VERSION = '1.7'

export function legalConsentMetadata({ dateOfBirth, countryCode, trainingDataAccepted = false }) {
  const acceptedAt = new Date().toISOString()
  return {
    date_of_birth: dateOfBirth,
    country_code: countryCode,
    gymbook_terms_version: LEGAL_VERSION,
    gymbook_privacy_version: LEGAL_VERSION,
    gymbook_accepted_at: acceptedAt,
    gymbook_sensitive_training_consent: trainingDataAccepted === true,
    gymbook_sensitive_training_consent_version: LEGAL_VERSION,
    gymbook_sensitive_training_consent_at: trainingDataAccepted ? acceptedAt : null,
    gymbook_sensitive_training_consent_text_version: LEGAL_VERSION,
  }
}

export function needsLegalSetup(user) {
  const metadata = user?.user_metadata || {}
  return !metadata.date_of_birth || !metadata.country_code
    || metadata.gymbook_terms_version !== LEGAL_VERSION
    || metadata.gymbook_privacy_version !== LEGAL_VERSION
}
