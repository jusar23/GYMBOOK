import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { dateLocale, t } from '../lib/i18n.js'
import {
  clearPendingSubscriptionPlan,
  isPurchaseCancelled,
  purchaseNativePackage,
  restoreNativePurchases,
} from '../lib/subscription.js'

const BENEFITS = [
  { icon: 'bolt', text: 'Organized routines for every session.' },
  { icon: 'calendar', text: 'Log weight, reps, RPE, RIR and rest times.' },
  { icon: 'chartLine', text: 'Review your history and track your progress.' },
]

function monthlyEquivalent(plan) {
  const product = plan?.package?.product
  const price = Number(product?.price)
  if (!Number.isFinite(price) || price <= 0 || !product?.currencyCode) return ''
  try {
    const perMonth = new Intl.NumberFormat(dateLocale(), {
      style: 'currency', currency: product.currencyCode,
      maximumFractionDigits: 2,
    }).format(price / 12)
    return t('Just {0}/mo', perMonth)
  } catch { return '' }
}

function savingsPercent(annual, monthly) {
  const annualPrice = Number(annual?.package?.product?.price)
  const monthlyPrice = Number(monthly?.package?.product?.price)
  if (!(annualPrice > 0) || !(monthlyPrice > 0)) return 0
  return Math.round((1 - annualPrice / (monthlyPrice * 12)) * 100)
}

function planPrice(plan) {
  return plan?.introPrice || plan?.price || ''
}

function planTerms(plan) {
  if (!plan) return ''
  if (plan.annual && plan.introPrice) {
    return t('{0} for the first year, then {1} per year. Automatically renews until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.', plan.introPrice, plan.price)
  }
  if (plan.annual) return t('{0} per year, automatically renewing until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.', plan.price)
  if (plan.monthly) return t('{0} per month, automatically renewing until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.', plan.price)
  return ''
}

export default function SubscriptionPaywall({ user, status, refresh, close, fullScreen = false, onSettings, onSignOut }) {
  const navigate = useNavigate()
  const plans = useMemo(() => [...(status?.packages || [])].sort((a, b) => Number(b.annual) - Number(a.annual)), [status?.packages])
  const annualPlan = plans.find(plan => plan.annual)
  const monthlyPlan = plans.find(plan => plan.monthly)
  const [selectedId, setSelectedId] = useState(() => annualPlan?.identifier || plans[0]?.identifier || '')
  const selectedPlan = plans.find(plan => plan.identifier === selectedId) || annualPlan || plans[0]
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const savings = annualPlan && monthlyPlan ? savingsPercent(annualPlan, monthlyPlan) : 0

  const finishIfGranted = async result => {
    const access = result?.granted ? result : await refresh?.()
    if (access?.granted) {
      clearPendingSubscriptionPlan(user?.id)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gymbook:subscription-updated', { detail: access }))
      }
      close?.()
    }
  }

  const buy = async () => {
    if (!selectedPlan || busy) return
    setBusy('purchase'); setMessage('')
    try { await finishIfGranted(await purchaseNativePackage(user.id, selectedPlan.identifier)) }
    catch (error) {
      if (!isPurchaseCancelled(error)) setMessage(error.message || t('Purchase could not be completed. Check Google Play and try again.'))
    } finally { setBusy('') }
  }

  const restore = async () => {
    if (busy) return
    setBusy('restore'); setMessage('')
    try { await finishIfGranted(await restoreNativePurchases(user.id)) }
    catch (error) { setMessage(error.message || t('Could not restore purchases.')) }
    finally { setBusy('') }
  }

  return <main className={`rc-paywall${fullScreen ? ' rc-paywall-full' : ' rc-paywall-sheet'}`} role="main" aria-labelledby="rc-paywall-title">
    <div className="rc-paywall-scroll">
      <header className="rc-paywall-hero">
        <img className="rc-paywall-hero-image" src="/paywall-hero.jpg" alt="" />
        <div className="rc-paywall-hero-shade" />
        {close && <button className="rc-paywall-close" onClick={close} aria-label={t('Close')} disabled={!!busy}><Icon name="xmark" /></button>}
        <div className="rc-paywall-copy">
          <div className="rc-paywall-brand">GYMBOOK <b>PREMIUM</b></div>
          <h1 id="rc-paywall-title">{t('Train with purpose.')}</h1>
          <p>{t('Your routines, every set and your progress, all in one place.')}</p>
          <ul className="rc-paywall-benefits">
            {BENEFITS.map(benefit => <li key={benefit.text}>
              <Icon name={benefit.icon} /><span>{t(benefit.text)}</span>
            </li>)}
          </ul>
        </div>
      </header>
      {status?.status === 'error' && <div className="rc-paywall-alert" role="alert">
        <span>{status.error || t('We could not verify your subscription. Check your connection, then try again.')}</span>
        <button onClick={() => { setBusy('refresh'); Promise.resolve(refresh?.()).catch(() => {}).finally(() => setBusy('')) }} disabled={!!busy}>{t('Try again')}</button>
      </div>}
      {plans.length === 0 ? <div className="rc-paywall-empty" role="status">
        <p>{status?.offeringsError || t('Subscription plans are not available yet. Please try again later.')}</p>
        <button onClick={() => { setBusy('refresh'); Promise.resolve(refresh?.()).finally(() => setBusy('')) }} disabled={!!busy}>{t('Try again')}</button>
      </div> : <div className="rc-paywall-purchase">
        <div className="rc-paywall-plans" role="group" aria-label={t('Choose your plan')}>
          {plans.map(plan => {
            const isSelected = selectedPlan?.identifier === plan.identifier
            const monthlyDetail = plan.annual ? monthlyEquivalent(plan) : t('No commitment')
            const discount = plan.annual && savings > 0 ? savings : 0
            return <button
              className={`rc-paywall-plan${isSelected ? ' is-selected' : ''}`}
              type="button" key={plan.identifier} aria-pressed={isSelected}
              onClick={() => setSelectedId(plan.identifier)} disabled={!!busy}
            >
              {discount > 0 && <span className="rc-paywall-save">{t('SAVE {0}%', discount)}</span>}
              <strong>{plan.annual ? t('Annual plan') : plan.monthly ? t('Monthly plan') : t(plan.title)}</strong>
              <span className="rc-paywall-plan-price">{planPrice(plan)}{plan.annual ? t('/yr') : plan.monthly ? t('/mo') : ''}</span>
              <small>{plan.annual ? monthlyDetail : t('No commitment')}</small>
            </button>
          })}
        </div>
        <button className="rc-paywall-continue" onClick={buy} disabled={!selectedPlan || !!busy}>
          {busy === 'purchase' ? t('Opening Google Play…') : t('Continue')}
        </button>
        {selectedPlan && <p className="rc-paywall-terms">{planTerms(selectedPlan)}</p>}
        {message && <p className="rc-paywall-error" role="alert">{message}</p>}
        <div className="rc-paywall-links">
          <span>{t('Already subscribed?')}</span>
          <button onClick={restore} disabled={!!busy}>{busy === 'restore' ? t('Checking purchases…') : t('Restore purchases')}</button>
          <div>
            <button onClick={() => { close?.(); navigate('/legal/subscription') }}>{t('Terms of Subscription')}</button>
            <span aria-hidden="true">·</span>
            <button onClick={() => { close?.(); navigate('/legal/privacy') }}>{t('Privacy Policy')}</button>
          </div>
          {(onSettings || onSignOut) && <div className="rc-paywall-account-links">
            {onSettings && <button onClick={onSettings}>{t('Settings')}</button>}
            {onSettings && onSignOut && <span aria-hidden="true">·</span>}
            {onSignOut && <button onClick={onSignOut}>{t('Sign out')}</button>}
          </div>}
        </div>
      </div>}
    </div>
  </main>
}
