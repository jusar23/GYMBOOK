import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import { useStore } from '../store/useStore.js'
import { t } from '../lib/i18n.js'
import { openSubscriptionManagement, purchaseNativePackage, restoreNativePurchases } from '../lib/subscription.js'

export default function SubscriptionGate({ user, status, refresh }) {
  const signOut = useStore(s => s.signOut)
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')

  const buy = async plan => {
    setBusy(plan.identifier); setMessage('')
    try { await purchaseNativePackage(user.id, plan.identifier); await refresh() }
    catch (error) { setMessage(error.message || t('Purchase could not be completed. Check Google Play and try again.')) }
    finally { setBusy('') }
  }
  const restore = async () => {
    setBusy('restore'); setMessage('')
    try { await restoreNativePurchases(user.id); await refresh() }
    catch (error) { setMessage(error.message || t('Could not restore purchases.')) }
    finally { setBusy('') }
  }
  const manage = async () => {
    try { await openSubscriptionManagement(user.id, { native: true }) }
    catch (error) { setMessage(error.message || t('Could not open subscription management.')) }
  }
  const errorState = status.status === 'error'

  return <main className="subscription-lock" role="main">
    <div className="subscription-lock-card">
      <div className="subscription-lock-mark"><Icon name="lock" /></div>
      <span className="site-eyebrow">GYM BOOK TRAINING</span>
      <h1>{errorState ? t('Check your subscription') : t('Keep your training going.')}</h1>
      <p className="subscription-lead">{errorState
        ? t('We could not verify your subscription or complimentary access. Reconnect and try again.')
        : t('Your free access or subscription has ended. Choose a plan to continue using Gym Book Training. Your workouts remain saved on this phone.')}</p>

      {status.status === 'loading' ? <p className="subscription-note">{t('Checking your access…')}</p> : <>
        {status.packages?.length > 0 ? <div className="subscription-plans">
          {status.packages.map(plan => <article className="subscription-plan" key={plan.identifier}>
            <div className="subscription-plan-heading"><h2>{plan.title}</h2><strong>{plan.price}</strong></div>
            {plan.annual && plan.introPrice
              ? <p>{t('{0} for the first year, then {1} per year. Automatically renews until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.', plan.introPrice, plan.price)}</p>
              : plan.annual
                ? <p>{t('{0} per year, automatically renewing until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.', plan.price)}</p>
                : plan.monthly
                  ? <p>{t('{0} per month, automatically renewing until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.', plan.price)}</p>
                  : <p>{t('{0} · automatic renewal until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.', plan.price)}</p>}
            <button className="btn primary" onClick={() => buy(plan)} disabled={!!busy || !plan.price}>
              {busy === plan.identifier ? t('Opening Google Play…') : t('Subscribe · {0}', plan.price)}
            </button>
          </article>)}
        </div> : <div className="subscription-note">{status.packages?.length === 0 && status.status !== 'error'
          ? t('Subscription plans are not available yet. Please try again later.')
          : status.error || t('Subscription access could not be checked. Please try again.')}</div>}

        {status.terms?.map(term => <p className="subscription-note" key={term}>{term}</p>)}
        <p className="subscription-note">{t('Subscriptions renew automatically until canceled. Manage or cancel in Google Play → Payments & subscriptions → Subscriptions. Canceling stops the next renewal; access continues to the end of the paid period. Removing the app does not cancel a subscription.')}</p>
        {message && <p className="subscription-error" role="alert">{message}</p>}
        <div className="subscription-actions">
          <button className="subscription-link" onClick={restore} disabled={!!busy}>{busy === 'restore' ? t('Checking purchases…') : t('Restore purchases')}</button>
          <button className="subscription-link" onClick={manage}>{t('Manage subscription')}</button>
          <button className="subscription-link" onClick={refresh} disabled={!!busy}>{t('Check again')}</button>
        </div>
        <button className="subscription-signout" onClick={() => signOut()}>{t('Sign out')}</button>
      </>}
    </div>
  </main>
}
