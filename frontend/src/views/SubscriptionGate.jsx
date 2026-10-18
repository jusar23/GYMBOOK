import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import { useStore } from '../store/useStore.js'
import { openSubscriptionManagement, purchaseNativePackage, restoreNativePurchases } from '../lib/subscription.js'

export default function SubscriptionGate({ user, status, refresh }) {
  const signOut = useStore(s => s.signOut)
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')

  const buy = async plan => {
    setBusy(plan.identifier); setMessage('')
    try { await purchaseNativePackage(user.id, plan.identifier); await refresh() }
    catch (error) { setMessage(error.message || 'Purchase could not be completed. Check Google Play and try again.') }
    finally { setBusy('') }
  }
  const restore = async () => {
    setBusy('restore'); setMessage('')
    try { await restoreNativePurchases(user.id); await refresh() }
    catch (error) { setMessage(error.message || 'Could not restore purchases.') }
    finally { setBusy('') }
  }
  const manage = async () => {
    try { await openSubscriptionManagement(user.id, { native: true }) }
    catch (error) { setMessage(error.message || 'Could not open subscription management.') }
  }
  const errorState = status.status === 'error'

  return <main className="subscription-lock" role="main">
    <div className="subscription-lock-card">
      <div className="subscription-lock-mark"><Icon name="lock" /></div>
      <span className="site-eyebrow">GYM BOOK TRAINING</span>
      <h1>{errorState ? 'Check your subscription' : 'Keep your training going.'}</h1>
      <p className="subscription-lead">{errorState
        ? 'We could not verify your subscription or complimentary access. Reconnect and try again.'
        : 'Your subscription has ended. Choose a plan to continue using Gym Book Training. Your workouts remain saved on this phone.'}</p>

      {status.status === 'loading' ? <p className="subscription-note">Checking your access…</p> : <>
        {status.packages?.length > 0 ? <div className="subscription-plans">
          {status.packages.map(plan => <article className="subscription-plan" key={plan.identifier}>
            <div className="subscription-plan-heading"><h2>{plan.title}</h2><strong>{plan.price}</strong></div>
            {plan.annual && plan.introPrice
              ? <p>{plan.introPrice} for the first year, then {plan.price} per year. Automatically renews until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.</p>
              : plan.annual
                ? <p>{plan.price} per year, automatically renewing until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.</p>
                : plan.monthly
                  ? <p>{plan.price} per month, automatically renewing until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.</p>
                  : <p>{plan.price} · automatic renewal until canceled. Cancel in Google Play Subscriptions; access continues through the paid period.</p>}
            <button className="btn primary" onClick={() => buy(plan)} disabled={!!busy || !plan.price}>
              {busy === plan.identifier ? 'Opening Google Play…' : `Subscribe · ${plan.price}`}
            </button>
          </article>)}
        </div> : <div className="subscription-note">{status.packages?.length === 0 && status.status !== 'error'
          ? 'Subscription plans are not available yet. Please try again later.'
          : status.error}</div>}

        {status.terms?.map(term => <p className="subscription-note" key={term}>{term}</p>)}
        <p className="subscription-note">Subscriptions renew automatically until canceled. Manage or cancel in Google Play → Payments & subscriptions → Subscriptions. Canceling stops the next renewal; access continues to the end of the paid period. Removing the app does not cancel a subscription.</p>
        {message && <p className="subscription-error" role="alert">{message}</p>}
        <div className="subscription-actions">
          <button className="subscription-link" onClick={restore} disabled={!!busy}>{busy === 'restore' ? 'Checking purchases…' : 'Restore purchases'}</button>
          <button className="subscription-link" onClick={manage}>Manage subscription</button>
          <button className="subscription-link" onClick={refresh} disabled={!!busy}>Check again</button>
        </div>
        <button className="subscription-signout" onClick={() => signOut()}>Sign out</button>
      </>}
    </div>
  </main>
}
