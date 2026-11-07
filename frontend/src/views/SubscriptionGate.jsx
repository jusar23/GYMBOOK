import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { useStore } from '../store/useStore.js'
import { t } from '../lib/i18n.js'
import { clearPendingSubscriptionPlan, getPendingSubscriptionPlan, isPurchaseCancelled, presentNativePaywall, purchaseNativePackage, restoreNativePurchases } from '../lib/subscription.js'

const BENEFITS = [
  { icon: 'calendar', title: 'Training that fits your plan', copy: 'Build routines and take them into every session.' },
  { icon: 'dumbbell', title: 'Every set, clearly recorded', copy: 'Log weight, reps, RPE and rest as you train.' },
  { icon: 'chartLine', title: 'Progress you can follow', copy: 'See your training history and performance over time.' },
]

export default function SubscriptionGate({ user, status, refresh }) {
  const navigate = useNavigate()
  const signOut = useStore(s => s.signOut)
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const [selectedIdentifier, setSelectedIdentifier] = useState('')
  const autoPaywallFor = useRef('')
  const plans = [...(status.packages || [])].sort((a, b) => Number(b.annual) - Number(a.annual))
  const selectedPlan = plans.find(plan => plan.identifier === selectedIdentifier) || plans[0]

  useEffect(() => {
    const pending = getPendingSubscriptionPlan(user?.id)
    const savedPlan = plans.find(plan => plan.identifier === pending?.identifier
      || (pending?.productIdentifier && plan.productIdentifier === pending.productIdentifier))
    setSelectedIdentifier(current => plans.some(plan => plan.identifier === current) ? current : savedPlan?.identifier || plans[0]?.identifier || '')
  }, [status.packages, user?.id])

  useEffect(() => {
    if (!user?.id || status.granted || status.status !== 'inactive' || autoPaywallFor.current === user.id) return
    autoPaywallFor.current = user.id
    let current = true
    setBusy('paywall')
    setMessage('')
    void presentNativePaywall(user.id, { onlyIfNeeded: true })
      .then(result => {
        if (!current) return
        if (result.subscription?.granted) clearPendingSubscriptionPlan(user.id)
        return refresh()
      })
      .catch(error => { if (current && !isPurchaseCancelled(error)) setMessage(error.message || t('The subscription screen could not be opened. Choose a plan below or try again.')) })
      .finally(() => { if (current) setBusy('') })
    return () => { current = false }
  }, [user?.id, status.granted, status.status, refresh])

  const buy = async plan => {
    if (!plan) return
    setBusy(plan.identifier); setMessage('')
    try { await purchaseNativePackage(user.id, plan.identifier); clearPendingSubscriptionPlan(user.id); await refresh() }
    catch (error) { if (!isPurchaseCancelled(error)) setMessage(error.message || t('Purchase could not be completed. Check Google Play and try again.')) }
    finally { setBusy('') }
  }

  const restore = async () => {
    setBusy('restore'); setMessage('')
    try {
      const restored = await restoreNativePurchases(user.id)
      if (restored.granted) clearPendingSubscriptionPlan(user.id)
      await refresh()
    }
    catch (error) { setMessage(error.message || t('Could not restore purchases.')) }
    finally { setBusy('') }
  }

  const manage = async () => {
    setBusy('manage'); setMessage('')
    try {
      const result = await presentNativePaywall(user.id, { onlyIfNeeded: true })
      if (result.subscription?.granted) clearPendingSubscriptionPlan(user.id)
      await refresh()
    }
    catch (error) { if (!isPurchaseCancelled(error)) setMessage(error.message || t('Could not open subscription management.')) }
    finally { setBusy('') }
  }

  const selectedTerms = selectedPlan?.annual
    ? selectedPlan.introPrice
      ? t('{0} for the first year, then {1} per year. Automatically renews until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.', selectedPlan.introPrice, selectedPlan.price)
      : t('{0} per year, automatically renewing until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.', selectedPlan.price)
    : selectedPlan?.monthly
      ? t('{0} per month, automatically renewing until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.', selectedPlan.price)
      : ''

  const errorState = status.status === 'error'

  return <main className="subscription-lock" role="main">
    <section className="subscription-lock-card" aria-labelledby="premium-title">
      <div className="premium-glow" aria-hidden="true" />
      <div className="premium-brand">
        <span className="premium-brand-mark"><Icon name="dumbbell" /></span>
        <span>GYMBOOK <b>PREMIUM</b></span>
      </div>

      <header className="premium-intro">
        <span className="premium-eyebrow">{t('TRAIN WITH PURPOSE')}</span>
        <h1 id="premium-title">{errorState ? t('Let’s check your access.') : t('Keep your training going.')}</h1>
        <p>{errorState
          ? t('We could not verify your subscription. Check your connection, then try again.')
          : t('Your free access or subscription has ended. Choose a plan to continue using Gym Book Training. Your workouts remain saved on this phone.')}</p>
      </header>

      <div className="premium-benefits" aria-label={t('Included with Gymbook Premium')}>
        {BENEFITS.map(benefit => <article className="premium-benefit" key={benefit.title}>
          <span className="premium-benefit-icon"><Icon name={benefit.icon} /></span>
          <div><h2>{t(benefit.title)}</h2><p>{t(benefit.copy)}</p></div>
        </article>)}
      </div>

      {status.status === 'loading' ? <p className="subscription-note" role="status">{t('Checking your access…')}</p> : <>
        <div className="premium-plan-heading">
          <div><span className="premium-eyebrow">{t('YOUR TRAINING, YOUR CHOICE')}</span><h2>{t('Choose your plan')}</h2></div>
          <span className="premium-secure"><Icon name="shield" /> {t('Secure checkout')}</span>
        </div>

        {plans.length > 0 ? <div className="premium-plan-list" role="group" aria-label={t('Choose your plan')}>
          {plans.map(plan => <button
            type="button"
            className={`premium-plan${selectedPlan?.identifier === plan.identifier ? ' is-selected' : ''}`}
            key={plan.identifier}
            aria-pressed={selectedPlan?.identifier === plan.identifier}
            onClick={() => setSelectedIdentifier(plan.identifier)}
            disabled={!!busy}
          >
            <span className="premium-plan-select" aria-hidden="true"><span /></span>
            <span className="premium-plan-copy">
              <strong>{plan.annual ? t('Yearly plan') : plan.monthly ? t('Monthly plan') : plan.title}</strong>
              <small>{plan.annual ? t('Billed once a year') : plan.monthly ? t('Billed every month') : t('Subscription')}</small>
              {plan.annual && plan.introPrice && <small className="premium-intro-price">{plan.introPrice} {t('for the first year')}</small>}
            </span>
            <span className="premium-plan-price"><strong>{plan.price}</strong><small>{plan.annual ? t('per year') : plan.monthly ? t('per month') : ''}</small></span>
          </button>)}
        </div> : <div className="premium-unavailable">
          <p>{status.status === 'error' ? status.error || t('Subscription access could not be checked. Please try again.') : t('Subscription plans are not available yet. Please try again later.')}</p>
          <button className="subscription-link" onClick={refresh} disabled={!!busy}>{t('Check again')}</button>
        </div>}

        {selectedPlan && <>
          <button className="premium-cta" onClick={() => buy(selectedPlan)} disabled={!!busy}>
            {busy === selectedPlan.identifier ? t('Opening Google Play…') : t('Subscribe · {0}', selectedPlan.price)}
            {busy !== selectedPlan.identifier && <Icon name="chevronRight" />}
          </button>
          {selectedTerms && <p className="premium-terms">{selectedTerms}</p>}
          <p className="premium-renewal-note">{t('Subscriptions renew automatically until canceled. Manage or cancel in Google Play → Payments & subscriptions → Subscriptions. Canceling stops the next renewal; access continues to the end of the paid period. Removing the app does not cancel a subscription.')}</p>
        </>}

        {message && <p className="subscription-error" role="alert">{message}</p>}
        <nav className="premium-footer-actions" aria-label={t('Subscription help')}>
          <button className="subscription-link" onClick={restore} disabled={!!busy}>{busy === 'restore' ? t('Checking purchases…') : t('Restore purchases')}</button>
          <button className="subscription-link" onClick={manage} disabled={!!busy}>{busy === 'manage' ? t('Opening…') : t('Manage subscription')}</button>
        </nav>
        <button className="subscription-signout" onClick={() => signOut()}>{t('Sign out')}</button>
      </>}
      <button className="subscription-link subscription-settings-link" onClick={() => navigate('/settings')}><Icon name="gear" /> {t('Settings')}</button>
    </section>
  </main>
}
