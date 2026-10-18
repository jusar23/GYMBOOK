import { Capacitor } from '@capacitor/core'
import { getAuthSession } from './supabaseAuth.js'

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '').replace(/\/rest\/v1$/i, '')
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
export const SUBSCRIPTION_ENTITLEMENT = import.meta.env.VITE_RC_ENTITLEMENT_ID || 'gymbook_premium'
const ANDROID_KEY = import.meta.env.VITE_RC_ANDROID_API_KEY || ''
const WEB_KEY = import.meta.env.VITE_RC_WEB_API_KEY || ''
const CACHE_PREFIX = 'gymbook_subscription_v1:'

let nativeConfigured = false
let nativeAppUserId = ''
let webPurchases = null
let webAppUserId = ''

export const nativeBillingConfigured = () => Capacitor.isNativePlatform() && !!ANDROID_KEY
export const webBillingConfigured = () => !!WEB_KEY

async function getNativePurchases(userId) {
  if (!nativeBillingConfigured()) return null
  const { Purchases } = await import('@revenuecat/purchases-capacitor')
  if (!nativeConfigured) {
    await Purchases.configure({ apiKey: ANDROID_KEY, appUserID: userId })
    nativeConfigured = true
    nativeAppUserId = userId
  } else if (nativeAppUserId !== userId) {
    await Purchases.logIn({ appUserID: userId })
    nativeAppUserId = userId
  }
  return Purchases
}

export async function getWebPurchases(userId) {
  if (!WEB_KEY) throw new Error('Web billing is not configured yet.')
  if (webPurchases) {
    if (webAppUserId !== userId) {
      await webPurchases.changeUser(userId)
      webAppUserId = userId
    }
    return webPurchases
  }
  const { Purchases } = await import('@revenuecat/purchases-js')
  webPurchases = Purchases.configure({ apiKey: WEB_KEY, appUserId: userId })
  webAppUserId = userId
  return webPurchases
}

async function readExemption(userId) {
  const session = await getAuthSession()
  if (!session?.access_token || session.user?.id !== userId) throw new Error('Sign in again to verify subscription access.')
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase configuration is missing.')
  const response = await fetch(`${SUPABASE_URL}/rest/v1/gymbook_subscription_exemptions?select=expires_at&user_id=eq.${encodeURIComponent(userId)}&limit=1`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${session.access_token}` },
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || data.hint || `Could not verify access (HTTP ${response.status}).`)
  }
  const [row] = await response.json()
  if (!row) return null
  if (row.expires_at && Date.parse(row.expires_at) <= Date.now()) return null
  return { expiresAt: row.expires_at || null }
}

function activeEntitlement(customerInfo) {
  const entitlement = customerInfo?.entitlements?.active?.[SUBSCRIPTION_ENTITLEMENT]
  if (!entitlement?.isActive) return null
  if (entitlement.expirationDate && Date.parse(entitlement.expirationDate) <= Date.now()) return null
  return entitlement
}

function cacheFor(userId, data) {
  try { localStorage.setItem(CACHE_PREFIX + userId, JSON.stringify({ ...data, cachedAt: Date.now() })) } catch { /* private mode */ }
}

function cachedAccess(userId) {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_PREFIX + userId) || 'null')
    if (!cached?.granted || !cached.cachedAt) return null
    if (cached.expiresAt && Date.parse(cached.expiresAt) <= Date.now()) return null
    if (Date.now() - cached.cachedAt > 7 * 24 * 60 * 60 * 1000) return null
    return { ...cached, source: 'cached' }
  } catch { return null }
}

function packageDetails(packages) {
  return (packages || []).map(item => {
    const product = item.product || {}
    const type = String(item.packageType || item.identifier || '').toLowerCase()
    const period = product.subscriptionPeriod || product.normalPeriodDuration || product.period?.iso8601 || ''
    const annual = type.includes('annual') || type.includes('year') || /P1Y/i.test(period)
    const monthly = type.includes('month') || /P1M/i.test(period)
    return {
      identifier: item.identifier,
      package: item,
      title: annual ? 'Annual plan' : monthly ? 'Monthly plan' : (product.title || 'Subscription'),
      price: product.priceString || product.price?.formattedPrice || '',
      introPrice: product.introPrice?.priceString || product.introPricePhase?.price?.formattedPrice || '',
      period: annual ? 'year' : monthly ? 'month' : '',
      annual,
      monthly,
    }
  })
}

function termsFor(packages) {
  const terms = []
  for (const item of packages || []) {
    const product = item.product || {}
    const type = String(item.packageType || item.identifier || '').toLowerCase()
    const period = product.subscriptionPeriod || product.normalPeriodDuration || product.period?.iso8601 || ''
    const annual = type.includes('annual') || type.includes('year') || /P1Y/i.test(period)
    const monthly = type.includes('month') || /P1M/i.test(period)
    const basePrice = product.priceString || product.price?.formattedPrice || ''
    if (annual) terms.push(`Annual plan: ${product.introPrice?.priceString || product.introPricePhase?.price?.formattedPrice || basePrice} for the first year, then ${basePrice} per year, automatically renewing until canceled.`)
    else if (monthly) terms.push(`Monthly plan: ${basePrice} per month, automatically renewing until canceled.`)
  }
  return terms
}

export async function refreshNativeSubscription(userId) {
  if (!nativeBillingConfigured()) return { configured: false, granted: true, status: 'unconfigured', packages: [], terms: [] }
  try {
    const Purchases = await getNativePurchases(userId)
    const [exemptionResult, customerResult, offeringResult] = await Promise.allSettled([
      readExemption(userId), Purchases.getCustomerInfo(), Purchases.getOfferings(),
    ])
    const exemption = exemptionResult.status === 'fulfilled' ? exemptionResult.value : null
    if (customerResult.status === 'rejected' && exemption) {
      const details = { configured: true, granted: true, status: 'exempt', expiresAt: exemption.expiresAt, packages: [], terms: [], managementURL: null }
      cacheFor(userId, details)
      return details
    }
    if (customerResult.status === 'rejected') throw customerResult.reason
    const customerInfo = customerResult.value.customerInfo
    const entitlement = activeEntitlement(customerInfo)
    const offer = offeringResult.status === 'fulfilled' ? offeringResult.value.current : null
    const granted = !!(exemption || entitlement)
    const expiresAt = exemption?.expiresAt || entitlement?.expirationDate || null
    const packages = packageDetails(offer?.availablePackages || [])
    const status = exemption ? 'exempt' : entitlement ? 'active' : exemptionResult.status === 'rejected' ? 'error' : 'inactive'
    const details = { configured: true, granted, status, expiresAt, packages, terms: termsFor(offer?.availablePackages || []), managementURL: customerInfo.managementURL || null, error: status === 'error' ? (exemptionResult.reason?.message || 'Could not verify complimentary access.') : undefined }
    cacheFor(userId, { ...details, packages: packages.map(({ package: _package, ...item }) => item) })
    return details
  } catch (error) {
    const cached = cachedAccess(userId)
    if (cached) return { ...cached, configured: true, packages: [], terms: [], warning: 'Using the last verified subscription status while offline.' }
    return { configured: true, granted: false, status: 'error', error: error.message || 'Could not verify subscription access.', packages: [], terms: [] }
  }
}

export async function refreshWebSubscription(userId) {
  if (!WEB_KEY) return { configured: false, granted: true, status: 'unconfigured', packages: [], terms: [] }
  const purchases = await getWebPurchases(userId)
  const [exemptionResult, customerResult, offeringResult] = await Promise.allSettled([
    readExemption(userId), purchases.getCustomerInfo(), purchases.getOfferings(),
  ])
  const exemption = exemptionResult.status === 'fulfilled' ? exemptionResult.value : null
  if (customerResult.status === 'rejected' && exemption) {
    return { configured: true, granted: true, status: 'exempt', expiresAt: exemption.expiresAt, packages: [], terms: [], managementURL: null }
  }
  if (customerResult.status === 'rejected') throw customerResult.reason
  if (offeringResult.status === 'rejected') throw offeringResult.reason
  const customerInfo = customerResult.value
  const entitlement = customerInfo.entitlements?.active?.[SUBSCRIPTION_ENTITLEMENT]
  const active = !!entitlement?.isActive && (!entitlement.expirationDate || Date.parse(entitlement.expirationDate) > Date.now())
  const packages = packageDetails(offeringResult.current?.availablePackages || [])
  return {
    configured: true,
    granted: !!(exemption || active),
    status: exemption ? 'exempt' : active ? 'active' : exemptionResult.status === 'rejected' ? 'error' : 'inactive',
    expiresAt: exemption?.expiresAt || entitlement?.expirationDate?.toISOString?.() || null,
    packages,
    terms: termsFor(offeringResult.current?.availablePackages || []),
    managementURL: customerInfo.managementURL || null,
    error: exemptionResult.status === 'rejected' && !active ? exemptionResult.reason?.message || 'Could not verify complimentary access.' : undefined,
    customerInfo,
  }
}

export async function purchaseNativePackage(userId, identifier) {
  const Purchases = await getNativePurchases(userId)
  if (!Purchases) throw new Error('Google Play billing is not configured yet.')
  const { current } = await Purchases.getOfferings()
  const selected = current?.availablePackages?.find(item => item.identifier === identifier)
  if (!selected) throw new Error('That subscription plan is no longer available. Refresh and try again.')
  await Purchases.purchasePackage({ aPackage: selected })
  return refreshNativeSubscription(userId)
}

export async function purchaseWebPackage(userId, rcPackage, email) {
  const purchases = await getWebPurchases(userId)
  await purchases.purchase({ rcPackage, customerEmail: email || undefined })
  return refreshWebSubscription(userId)
}

export async function restoreNativePurchases(userId) {
  const Purchases = await getNativePurchases(userId)
  if (!Purchases) throw new Error('Google Play billing is not configured yet.')
  await Purchases.restorePurchases()
  return refreshNativeSubscription(userId)
}

export async function openSubscriptionManagement(userId, { native = Capacitor.isNativePlatform() } = {}) {
  let url
  if (native) {
    const Purchases = await getNativePurchases(userId)
    if (!Purchases) throw new Error('Google Play billing is not configured yet.')
    const { customerInfo } = await Purchases.getCustomerInfo()
    url = customerInfo.managementURL
  } else {
    const purchases = await getWebPurchases(userId)
    const customerInfo = await purchases.getCustomerInfo()
    url = customerInfo.managementURL
  }
  if (!url) throw new Error('No active subscription management page was returned. Sign in with the account that made the purchase, or use Restore purchases.')
  if (native) {
    const { Browser } = await import('@capacitor/browser')
    await Browser.open({ url })
  } else window.location.assign(url)
}
