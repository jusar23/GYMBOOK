import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import { useStore } from '../store/useStore.js'
import { t } from '../lib/i18n.js'

export default function SubscriptionCheck({ refresh }) {
  const signOut = useStore(state => state.signOut)
  const [checking, setChecking] = useState(false)

  const checkAgain = async () => {
    if (checking) return
    setChecking(true)
    try { await refresh() }
    finally { setChecking(false) }
  }

  return <main className="subscription-check-screen" role="alert">
    <section className="subscription-check-card">
      <span className="subscription-check-mark"><Icon name="dumbbell" /></span>
      <h1>{t('Let’s check your access.')}</h1>
      <p>{t('We could not verify your subscription. Check your connection, then try again.')}</p>
      <button className="subscription-check-retry" onClick={checkAgain} disabled={checking}>
        {checking ? t('Checking your access…') : t('Check again')}
      </button>
      <button className="subscription-check-signout" onClick={() => signOut()}>{t('Sign out')}</button>
    </section>
  </main>
}
