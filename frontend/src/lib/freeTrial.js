export function freeTrialEndsAt(createdAt) {
  const start = new Date(createdAt)
  if (!createdAt || Number.isNaN(start.getTime())) return null

  // Add one calendar month, clamping month-end dates (for example, Jan 31 → Feb 28).
  const end = new Date(start)
  const day = end.getUTCDate()
  end.setUTCDate(1)
  end.setUTCMonth(end.getUTCMonth() + 1)
  const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate()
  end.setUTCDate(Math.min(day, lastDay))
  return end
}

export function hasFreeTrialAccess(createdAt, now = Date.now()) {
  const end = freeTrialEndsAt(createdAt)
  return !!end && now < end.getTime()
}
