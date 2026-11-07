export function freeTrialEndsAt(createdAt) {
  const start = new Date(createdAt)
  if (!createdAt || Number.isNaN(start.getTime())) return null
  return new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000)
}

export function hasFreeTrialAccess(createdAt, now = Date.now()) {
  const end = freeTrialEndsAt(createdAt)
  return !!end && now < end.getTime()
}
