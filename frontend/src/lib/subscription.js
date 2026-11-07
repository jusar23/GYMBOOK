import { Capacitor } from '@capacitor/core'
import { getAuthSession, invalidateSupabaseSession } from './supabaseAuth.js'

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '').replace(/\/rest\/v1$/i, '')
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
export const SUBSCRIPTION_ENTITLEMENT = import.meta.env.VITE_RC_ENTITLEMENT_ID || 'gymbook_training_premium'
const ANDROID_KEY = import.meta.env.VITE_RC_ANDROID_API_KEY || ''
const WEB_KEY = import.meta.env.VITE_RC_WEB_API_KEY || ''
const CACHE_PREFIX = 'gymbook_subscription_v1:'
const PENDING_PLAN_PREFIX = 'gymbook_pending_subscription_plan_v1:'
const OFFERINGS_CACHE_MS = 60 * 1000

let nativeConfigured = false
let nativeAppUserId = ''
let nativeSetupPromise = null
let nativeSetupUserId = ''
const nativeOfferingsCache = new Map()
const nativeOfferingsRequests = new Map()
let webPurchases = null
let webAppUserId = ''

function withTimeout(promise, ms, message) {
  let timeout
  return Promise.race([
    promise,
    new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error(message)), ms) }),
  ]).finally(() => clearTimeout(timeout))
}

export const nativeBillingConfigured = () => Capacitor.isNativePlatform() && !!ANDROID_KEY
export const webBillingConfigured = () => !!WEB_KEY

export function savePendingSubscriptionPlan(userId, plan) {
  if (!userId || !plan?.identifier) return false
  try {
    localStorage.setItem(PENDING_PLAN_PREFIX + userId, JSON.stringify({
      identifier: plan.identifier,
      productIdentifier: plan.productIdentifier || '',
      savedAt: Date.now(),
    }))
    return true
  } catch { return false }
}

export function getPendingSubscriptionPlan(userId) {
  if (!userId) return null
  try {
    const value = JSON.parse(localStorage.getItem(PENDING_PLAN_PREFIX + userId) || 'null')
    return value?.identifier ? value : null
  } catch { return null }
}

export function clearPendingSubscriptionPlan(userId) {
  if (!userId) return
  try { localStorage.removeItem(PENDING_PLAN_PREFIX + userId) } catch { /* private mode */ }
}

async function getNativePurchases(userId) {
  if (!nativeBillingConfigured()) return null
  const { Purchases, LOG_LEVEL } = await import('@revenuecat/purchases-capacitor')
  if (nativeConfigured && nativeAppUserId === userId) return { Purchases }
  if (nativeSetupPromise) {
    if (nativeSetupUserId === userId) return nativeSetupPromise
    await nativeSetupPromise.catch(() => {})
    return getNativePurchases(userId)
  }

  const setup = (async () => {
    if (!nativeConfigured) {
      if (ANDROID_KEY.startsWith('test_')) await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG })
      await withTimeout(Purchases.configure({ apiKey: ANDROID_KEY, appUserID: userId }), 12000, 'RevenueCat took too long to initialize.')
      nativeConfigured = true
    } else if (nativeAppUserId !== userId) {
      await withTimeout(Purchases.logIn({ appUserID: userId }), 12000, 'RevenueCat took too long to switch accounts.')
    }
    nativeAppUserId = userId
    // Capacitor plugin proxies expose a non-thenable placeholder. Returning the
    // proxy itself from this async function makes Promise assimilation call
    // `Purchases.then()` and the native bridge reports that it is unimplemented.
    return { Purchases }
  })()
  nativeSetupPromise = setup
  nativeSetupUserId = userId
  try { return await setup }
  finally {
    if (nativeSetupPromise === setup) {
      nativeSetupPromise = null
      nativeSetupUserId = ''
    }
  }
}

async function getNativeOfferings(userId) {
  const cached = nativeOfferingsCache.get(userId)
  if (cached && Date.now() - cached.cachedAt < OFFERINGS_CACHE_MS) return cached.value
  if (nativeOfferingsRequests.has(userId)) return nativeOfferingsRequests.get(userId)

  const request = (async () => {
    const native = await getNativePurchases(userId)
    const Purchases = native?.Purchases
    if (!Purchases) throw new Error('Google Play billing is not configured yet.')
    let value
    try { value = await withTimeout(Purchases.getOfferings(), 10000, 'RevenueCat took too long to load subscription plans.') }
    catch (error) { throw billingAvailabilityError(error) }
    nativeOfferingsCache.set(userId, { value, cachedAt: Date.now() })
    return value
  })()
  nativeOfferingsRequests.set(userId, request)
  try { return await request }
  finally { if (nativeOfferingsRequests.get(userId) === request) nativeOfferingsRequests.delete(userId) }
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
    signal: typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
      ? AbortSignal.timeout(10000)
      : undefined,
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const error = new Error(data.message || data.hint || `Could not verify access (HTTP ${response.status}).`)
    error.status = response.status
    error.code = data.code || data.error_code || ''
    invalidateSupabaseSession(error, session)
    throw error
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

function activeSubscriptionDetails(customerInfo, entitlement, packages = []) {
  const subscriptions = customerInfo?.subscriptionsByProductIdentifier || {}
  const activeProducts = new Set(customerInfo?.activeSubscriptions || [])
  const records = Object.values(subscriptions).filter(item => item?.isActive || activeProducts.has(item?.productIdentifier))
  const record = records.find(item => item.productIdentifier === entitlement?.productIdentifier) || records[0] || null
  const productIdentifier = entitlement?.productIdentifier || record?.productIdentifier || [...activeProducts][0] || ''
  if (!productIdentifier && !entitlement) return null

  const productPlanIdentifier = record?.productPlanIdentifier || entitlement?.productPlanIdentifier || ''
  const product = packages.find(item => item.productIdentifier === productIdentifier)
  const type = `${productIdentifier} ${productPlanIdentifier} ${record?.displayName || ''}`.toLowerCase()
  const annual = product?.annual ?? /annual|year|yearly/.test(type)
  const monthly = product?.monthly ?? /month/.test(type)
  const planName = product?.title || (annual ? 'Yearly plan' : monthly ? 'Monthly plan' : record?.displayName || productIdentifier)
  return {
    isActive: !!entitlement || !!record || activeProducts.has(productIdentifier),
    productIdentifier,
    productPlanIdentifier,
    planName,
    price: product?.price || '',
    purchaseDate: record?.purchaseDate || entitlement?.latestPurchaseDate || null,
    expiresAt: entitlement?.expirationDate || record?.expiresDate || null,
    willRenew: entitlement?.willRenew ?? record?.willRenew ?? null,
    store: entitlement?.store || record?.store || '',
    managementURL: customerInfo?.managementURL || record?.managementURL || null,
  }
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
    const type = [item.packageType, item.identifier, product.identifier].filter(Boolean).join(' ').toLowerCase()
    const period = product.subscriptionPeriod || product.normalPeriodDuration || product.period?.iso8601 || ''
    const annual = type.includes('annual') || type.includes('year') || /P(?:1Y|12M)/i.test(period)
    const monthly = type.includes('month') || /P1M/i.test(period)
    return {
      identifier: item.identifier,
      productIdentifier: product.identifier || '',
      package: item,
      title: annual ? 'Yearly plan' : monthly ? 'Monthly plan' : (product.title || 'Subscription'),
      price: product.priceString || product.price?.formattedPrice || '',
      introPrice: product.introPrice?.priceString || product.introPricePhase?.price?.formattedPrice || '',
      period: annual ? 'year' : monthly ? 'month' : '',
      annual,
      monthly,
    }
  })
}

function selectedOffering(offerings) {
  if (offerings?.current) return offerings.current
  const all = offerings?.all || {}
  return all.default || Object.values(all).find(offering => offering?.availablePackages?.length) || null
}

function billingAvailabilityError(error) {
  const details = [error?.message, error?.underlyingErrorMessage, error?.data?.underlyingErrorMessage].filter(Boolean).join(' ')
  if (String(error?.code ?? '') === '3' || /BILLING_UNAVAILABLE|billing service unavailable/i.test(details)) {
    return new Error('Google Play Billing is unavailable on this device. Sign in to the Play Store with a licensed tester account and install the app from a Google Play test track.')
  }
  return error
}

function termsFor(packages) {
  const terms = []
  for (const item of packages || []) {
    const product = item.product || {}
    const type = [item.packageType, item.identifier, product.identifier].filter(Boolean).join(' ').toLowerCase()
    const period = product.subscriptionPeriod || product.normalPeriodDuration || product.period?.iso8601 || ''
    const annual = type.includes('annual') || type.includes('year') || /P(?:1Y|12M)/i.test(period)
    const monthly = type.includes('month') || /P1M/i.test(period)
    const basePrice = product.priceString || product.price?.formattedPrice || ''
    if (annual) terms.push(`Yearly plan: ${product.introPrice?.priceString || product.introPricePhase?.price?.formattedPrice || basePrice} for the first year, then ${basePrice} per year, automatically renewing until canceled.`)
    else if (monthly) terms.push(`Monthly plan: ${basePrice} per month, automatically renewing until canceled.`)
  }
  return terms
}

export async function refreshNativeSubscription(userId) {
  if (!nativeBillingConfigured()) return { configured: false, granted: true, status: 'unconfigured', packages: [], terms: [] }
  try {
    // Complimentary SQL access must not depend on RevenueCat being reachable or
    // configured correctly. Resolve it first so an exempt user never loses access.
    // Start the account check and RevenueCat initialization together to avoid
    // making the user wait for two network round trips in sequence.
    const [exemptionResult, purchasesResult] = await Promise.allSettled([
      readExemption(userId),
      getNativePurchases(userId),
    ])
    if (exemptionResult.status === 'rejected') throw exemptionResult.reason
    const exemption = exemptionResult.value
    if (exemption) {
      // Still load the catalog for the Settings plan picker. A missing RevenueCat
      // response must not revoke the exemption, so catalog errors are ignored here.
      let packages = []
      let terms = []
      let offeringsError
      let customerInfo
      try {
        if (purchasesResult.status === 'rejected') throw purchasesResult.reason
        const Purchases = purchasesResult.value?.Purchases
        const [offeringResult, customerResult] = await Promise.allSettled([
          getNativeOfferings(userId),
          withTimeout(Purchases.getCustomerInfo(), 10000, 'RevenueCat took too long to check your subscription.'),
        ])
        if (offeringResult.status === 'fulfilled') {
          const offering = selectedOffering(offeringResult.value)
          packages = packageDetails(offering?.availablePackages || [])
          terms = termsFor(offering?.availablePackages || [])
        } else offeringsError = billingAvailabilityError(offeringResult.reason).message
        if (customerResult.status === 'fulfilled') customerInfo = customerResult.value.customerInfo
        else if (!offeringsError) offeringsError = customerResult.reason?.message
      } catch (error) {
        offeringsError = error.message || undefined
        /* An exempt account remains authorized when billing is unavailable. */
      }
      const entitlement = activeEntitlement(customerInfo)
      const subscriptionInfo = activeSubscriptionDetails(customerInfo, entitlement, packages)
      const details = {
        configured: true,
        granted: true,
        status: subscriptionInfo?.isActive ? 'active' : 'exempt',
        expiresAt: subscriptionInfo?.expiresAt || exemption.expiresAt,
        packages,
        terms,
        offeringsError,
        subscriptionInfo,
        managementURL: customerInfo?.managementURL || subscriptionInfo?.managementURL || null,
      }
      cacheFor(userId, details)
      return details
    }

    if (purchasesResult.status === 'rejected') throw purchasesResult.reason
    const Purchases = purchasesResult.value?.Purchases
    const [customerResult, offeringResult] = await Promise.allSettled([
      withTimeout(Purchases.getCustomerInfo(), 10000, 'RevenueCat took too long to check your subscription.'),
      getNativeOfferings(userId),
    ])
    if (customerResult.status === 'rejected') throw customerResult.reason
    const customerInfo = customerResult.value.customerInfo
    const entitlement = activeEntitlement(customerInfo)
    const offer = offeringResult.status === 'fulfilled' ? selectedOffering(offeringResult.value) : null
    const packages = packageDetails(offer?.availablePackages || [])
    const subscriptionInfo = activeSubscriptionDetails(customerInfo, entitlement, packages)
    const granted = !!entitlement || !!subscriptionInfo?.isActive
    const expiresAt = entitlement?.expirationDate || subscriptionInfo?.expiresAt || null
    const status = granted ? 'active' : 'inactive'
    const offeringsError = offeringResult.status === 'rejected' ? billingAvailabilityError(offeringResult.reason).message : undefined
    const details = { configured: true, granted, status, expiresAt, packages, terms: termsFor(offer?.availablePackages || []), offeringsError, subscriptionInfo, managementURL: customerInfo.managementURL || subscriptionInfo?.managementURL || null }
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
  const exemption = await readExemption(userId)
  if (exemption) return { configured: true, granted: true, status: 'exempt', expiresAt: exemption.expiresAt, packages: [], terms: [], managementURL: null }
  const purchases = await getWebPurchases(userId)
  const [customerResult, offeringResult] = await Promise.allSettled([
    purchases.getCustomerInfo(), purchases.getOfferings(),
  ])
  if (customerResult.status === 'rejected') throw customerResult.reason
  if (offeringResult.status === 'rejected') throw offeringResult.reason
  const customerInfo = customerResult.value
  const entitlement = customerInfo.entitlements?.active?.[SUBSCRIPTION_ENTITLEMENT]
  const active = !!entitlement?.isActive && (!entitlement.expirationDate || Date.parse(entitlement.expirationDate) > Date.now())
  const offer = selectedOffering(offeringResult)
  const packages = packageDetails(offer?.availablePackages || [])
  return {
    configured: true,
    granted: !!active,
    status: active ? 'active' : 'inactive',
    expiresAt: entitlement?.expirationDate?.toISOString?.() || null,
    packages,
    terms: termsFor(offer?.availablePackages || []),
    managementURL: customerInfo.managementURL || null,
    customerInfo,
  }
}

export async function purchaseNativePackage(userId, identifier) {
  const native = await getNativePurchases(userId)
  const Purchases = native?.Purchases
  if (!Purchases) throw new Error('Google Play billing is not configured yet.')
  const offering = selectedOffering(await getNativeOfferings(userId))
  const selected = offering?.availablePackages?.find(item => item.identifier === identifier)
  if (!selected) throw new Error('That subscription plan is no longer available. Refresh and try again.')
  await Purchases.purchasePackage({ aPackage: selected })
  return refreshNativeSubscription(userId)
}

export function isPurchaseCancelled(error) {
  return error?.userCancelled === true || String(error?.code ?? '') === '1'
}

export async function presentNativePaywall(userId, { onlyIfNeeded = false, displayCloseButton = false } = {}) {
  const native = await getNativePurchases(userId)
  const Purchases = native?.Purchases
  if (!Purchases) throw new Error('Google Play billing is not configured yet.')
  const { RevenueCatUI } = await import('@revenuecat/purchases-capacitor-ui')
  let offering = null
  try { offering = selectedOffering(await getNativeOfferings(userId)) }
  catch { /* Let RevenueCatUI try its current offering and native cache as a fallback. */ }
  const options = { displayCloseButton, ...(offering ? { offering } : {}) }
  let result
  try {
    result = onlyIfNeeded
      ? await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: SUBSCRIPTION_ENTITLEMENT,
        ...options,
      })
      : await RevenueCatUI.presentPaywall(options)
  } catch (error) { throw billingAvailabilityError(error) }
  const subscription = await refreshNativeSubscription(userId)
  return { ...result, subscription }
}

export async function presentNativeCustomerCenter(userId) {
  const native = await getNativePurchases(userId)
  const Purchases = native?.Purchases
  if (!Purchases) throw new Error('Google Play billing is not configured yet.')
  const { RevenueCatUI } = await import('@revenuecat/purchases-capacitor-ui')
  await withTimeout(RevenueCatUI.presentCustomerCenter(), 12000, 'RevenueCat Customer Center took too long to open.')
  void refreshNativeSubscription(userId).catch(() => {})
  return true
}

export async function purchaseWebPackage(userId, rcPackage, email) {
  const purchases = await getWebPurchases(userId)
  await purchases.purchase({ rcPackage, customerEmail: email || undefined })
  return refreshWebSubscription(userId)
}

export async function restoreNativePurchases(userId) {
  const native = await getNativePurchases(userId)
  const Purchases = native?.Purchases
  if (!Purchases) throw new Error('Google Play billing is not configured yet.')
  await Purchases.restorePurchases()
  return refreshNativeSubscription(userId)
}

export async function openSubscriptionManagement(userId, { native = Capacitor.isNativePlatform() } = {}) {
  let url
  if (native) {
    try {
      if (nativeConfigured && nativeAppUserId === userId) {
        const { Purchases } = await import('@revenuecat/purchases-capacitor')
        const { customerInfo } = await Purchases.getCustomerInfo()
        url = customerInfo.managementURL
      }
    } catch { /* Open Google Play's subscriptions page even if RevenueCat is offline. */ }
  } else {
    const purchases = await getWebPurchases(userId)
    const customerInfo = await purchases.getCustomerInfo()
    url = customerInfo.managementURL
  }
  if (native) {
    const { Browser } = await import('@capacitor/browser')
    await Browser.open({ url: url || 'https://play.google.com/store/account/subscriptions?package=com.jusar23.gymbook' })
  } else if (url) window.location.assign(url)
  else throw new Error('No active subscription management page was returned. Sign in with the account that made the purchase, or use Restore purchases.')
}
