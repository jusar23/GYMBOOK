import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { getLang, LANGS, setLang, useLang } from '../lib/i18n.js'
import { DEF } from '../store/useStore.js'
import { getAuthSession, processOAuthCallback, signInWithEmail, signInWithGoogle, signOutSupabase, updateAuthUserMetadata } from '../lib/supabaseAuth.js'
import { LEGAL_VERSION, legalConsentMetadata, needsLegalSetup } from '../lib/legalConsent.js'
import { loadCloudBackup, saveCloudBackup } from '../lib/supabaseBackup.js'
import { mergePlan } from '../lib/plan-share.js'
import { createTrainingFile, parseTrainingFile, trainingFileText, TRAINING_FILE_MAX_BYTES } from '../lib/training-file.js'
import { DOCS } from './Legal.jsx'
import { openSubscriptionManagement, purchaseWebPackage, refreshWebSubscription, webBillingConfigured } from '../lib/subscription.js'
import './Website.css'

const clone = value => JSON.parse(JSON.stringify(value))

function saveJson(text, name) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

export default function AccountPortal() {
  const navigate = useNavigate()
  const languageVersion = useLang()
  const language = getLang()
  const L = (en, es) => language === 'es' ? es : en
  const inputRef = useRef(null)
  const [session, setSession] = useState(null)
  const [state, setState] = useState(null)
  const [billing, setBilling] = useState({ configured: false, granted: true, status: 'unconfigured', packages: [] })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(true)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(null)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptTrainingData, setAcceptTrainingData] = useState(false)
  const [billingBusy, setBillingBusy] = useState(false)

  const refreshBackup = async activeSession => {
    try {
      const backup = await loadCloudBackup()
      setState(backup?.state ? Object.assign(clone(DEF), backup.state, { active: null }) : clone(DEF))
      setMessage(backup ? `Server copy updated ${new Date(backup.updatedAt).toLocaleString()}.` : 'No server copy exists yet. Import a Gym Book Training file to create one.')
    } catch (error) {
      setState(null)
      setMessage(error.message || 'Could not load your server copy.')
    }
    if (activeSession?.user?.id && webBillingConfigured()) {
      try { setBilling(await refreshWebSubscription(activeSession.user.id)) }
      catch (error) { setBilling({ configured: true, granted: false, status: 'error', packages: [], error: error.message || 'Could not verify the subscription.' }) }
    } else setBilling({ configured: false, granted: true, status: 'unconfigured', packages: [] })
    setSession(activeSession)
  }

  useEffect(() => {
    let current = true
    ;(async () => {
      try {
        const oauth = await processOAuthCallback()
        const active = oauth || await getAuthSession()
        if (current && active) await refreshBackup(active)
        else if (current) setBusy(false)
      } catch (error) { if (current) setMessage(error.message || 'Sign-in failed.') }
      finally { if (current) setBusy(false) }
    })()
    return () => { current = false }
  }, [])

  const doSignIn = async event => {
    event.preventDefault()
    setBusy(true); setMessage('')
    try { await refreshBackup(await signInWithEmail({ email, password })) }
    catch (error) { setMessage(error.message || 'Sign-in failed.') }
    finally { setBusy(false) }
  }

  const doGoogle = async () => {
    setBusy(true); setMessage('')
    try { await signInWithGoogle() }
    catch (error) { setMessage(error.message || 'Google sign-in failed.'); setBusy(false) }
  }

  const doSignOut = async () => {
    setBusy(true)
    try { await signOutSupabase(); setSession(null); setState(null); setPending(null); setMessage('You are signed out.') }
    catch (error) { setMessage(error.message || 'Could not sign out.') }
    finally { setBusy(false) }
  }

  const acceptCurrentTerms = async () => {
    const metadata = session?.user?.user_metadata || {}
    if (!acceptTerms) { setMessage('Accept the current Terms and Conditions and Privacy Policy to continue.'); return }
    if (!metadata.date_of_birth || !metadata.country_code) { setMessage('Complete your date of birth and country in the app before managing the server copy.'); return }
    setBusy(true)
    try {
      const updated = await updateAuthUserMetadata(legalConsentMetadata({
        dateOfBirth: metadata.date_of_birth,
        countryCode: metadata.country_code,
        trainingDataAccepted: acceptTrainingData,
      }))
      const next = await getAuthSession()
      setAcceptTerms(false); setAcceptTrainingData(false)
      await refreshBackup({ ...next, user: updated })
    } catch (error) { setMessage(error.message || 'Could not save your consent.') }
    finally { setBusy(false) }
  }

  const acceptBackupConsent = async () => {
    if (!acceptTrainingData) { setMessage('Choose whether to authorize workout-data processing for server backups.'); return }
    const metadata = session?.user?.user_metadata || {}
    setBusy(true)
    try {
      const updated = await updateAuthUserMetadata({ ...metadata,
        gymbook_sensitive_training_consent: true,
        gymbook_sensitive_training_consent_version: LEGAL_VERSION,
        gymbook_sensitive_training_consent_text_version: LEGAL_VERSION,
        gymbook_sensitive_training_consent_at: new Date().toISOString(),
      })
      setSession({ ...session, user: updated })
      setAcceptTrainingData(false)
      await refreshBackup({ ...session, user: updated })
    } catch (error) { setMessage(error.message || 'Could not save your authorization.') }
    finally { setBusy(false) }
  }

  const importFile = event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > TRAINING_FILE_MAX_BYTES) { setMessage('Files must be 10 MB or smaller.'); return }
    if (!file.name.toLowerCase().endsWith('.gbt.json')) { setMessage('Choose a .gbt.json file exported by Gym Book Training.'); return }
    const reader = new FileReader()
    reader.onload = () => {
      try { setPending(parseTrainingFile(String(reader.result), { allowLegacy: false })); setMessage('Review the file type before importing.') }
      catch (error) { setPending(null); setMessage(error.message || 'This file is not supported.') }
    }
    reader.onerror = () => setMessage('Could not read this file.')
    reader.readAsText(file)
  }

  const commitImport = async () => {
    if (!pending || !state) return
    setBusy(true)
    try {
      let next
      if (pending.kind === 'routines') {
        next = clone(state)
        mergePlan(next, pending.data, { schedule: true })
      } else next = Object.assign(clone(DEF), pending.data, { active: null })
      await saveCloudBackup(next)
      setState(next); setPending(null); setMessage('Your server copy was updated.')
    } catch (error) { setMessage(error.message || 'Could not save the imported file.') }
    finally { setBusy(false) }
  }

  const exportFile = kind => {
    try {
      const value = kind === 'routines' ? JSON.stringify(createTrainingFile(state || DEF, 'routines'), null, 2) : trainingFileText(state || DEF, 'history')
      saveJson(value, `Gym-Book-Training-${kind}-${new Date().toISOString().slice(0, 10)}.gbt.json`)
    } catch (error) { setMessage(error.message || 'Could not export this copy.') }
  }

  const buyWebPlan = async plan => {
    setBillingBusy(true); setMessage('')
    try {
      const next = await purchaseWebPackage(user.id, plan.package, user.email)
      setBilling(next)
      setMessage('Purchase completed. Your subscription is active.')
    } catch (error) { setMessage(error.message || 'The purchase could not be completed.') }
    finally { setBillingBusy(false) }
  }

  const manageWebPlan = async () => {
    setBillingBusy(true)
    try { await openSubscriptionManagement(user.id, { native: false }) }
    catch (error) { setMessage(error.message || 'Could not open subscription management.') }
    finally { setBillingBusy(false) }
  }

  const user = session?.user
  const metadata = user?.user_metadata || {}
  const currentTerms = !needsLegalSetup(user)
  const hasBackupConsent = metadata.gymbook_sensitive_training_consent === true
    && metadata.gymbook_sensitive_training_consent_version === LEGAL_VERSION

  return <main className="account-page" key={languageVersion}>
    <div className="account-top-actions"><button className="account-back" onClick={() => navigate('/')}><Icon name="chevronLeft" /> {L('Back to Gym Book Training', 'Volver a Gym Book Training')}</button><label className="account-language"><Icon name="globe" /><select aria-label={L('Language', 'Idioma')} value={language} onChange={event => { localStorage.setItem('gymbook_site_lang', event.target.value); void setLang(event.target.value) }}>{Object.entries(LANGS).map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label></div>
    <header className="account-heading"><span className="site-eyebrow">{L('YOUR GYM BOOK TRAINING ACCOUNT', 'TU CUENTA DE GYM BOOK TRAINING')}</span><h1>{L('Training data', 'Tus datos')}<br /><span>{L('on your terms.', 'a tu manera.')}</span></h1><p>{L('Sign in to move your routines and training history between the app and your account.', 'Inicia sesión para transferir rutinas e historial de entrenamiento entre la app y tu cuenta.')}</p></header>
    {busy && <div className="account-card account-status">{L('Loading your account…', 'Cargando tu cuenta…')}</div>}
    {!busy && !user && <section className="account-card">
      <h2>{L('Sign in', 'Iniciar sesión')}</h2><p className="account-muted">{L('Use the account you created in the app.', 'Usa la cuenta que creaste en la app.')}</p>
      <form onSubmit={doSignIn} className="account-form">
        <label>{L('Email', 'Correo electrónico')}<input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required /></label>
        <label>{L('Password', 'Contraseña')}<input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required /></label>
        <button className="site-button primary" disabled={busy}>{L('Sign in', 'Iniciar sesión')}</button>
      </form>
      <button className="account-google" onClick={doGoogle}><Icon name="key" /> {L('Continue with Google', 'Continuar con Google')}</button>
    </section>}
    {!busy && user && <>
      <section className="account-card">
        <div className="account-user"><div><h2>{metadata.full_name || user.email}</h2><p className="account-muted">{user.email}</p></div><button className="account-text-button" onClick={doSignOut}>{L('Sign out', 'Cerrar sesión')}</button></div>
        <section className="account-billing" aria-labelledby="account-billing-title">
          <div className="account-billing-heading"><div><span className="site-eyebrow">GYM BOOK TRAINING</span><h2 id="account-billing-title">{L('Subscription', 'Suscripción')}</h2></div>{billing.status === 'active' || billing.status === 'exempt' ? <span className="account-plan-status">{billing.status === 'exempt' ? L('Complimentary access', 'Acceso gratuito') : L('Active', 'Activa')}</span> : null}</div>
          {billing.status === 'active' || billing.status === 'exempt'
            ? <><p className="account-muted">{billing.status === 'exempt' ? L('Your account has complimentary access.', 'Tu cuenta tiene acceso gratuito.') : billing.expiresAt ? L(`Access through ${new Date(billing.expiresAt).toLocaleDateString()}. Your provider manages renewal and cancellation.`, `Tienes acceso hasta el ${new Date(billing.expiresAt).toLocaleDateString()}. Tu proveedor gestiona la renovación y cancelación.`) : L('Your subscription is active. Your provider manages renewal and cancellation.', 'Tu suscripción está activa. Tu proveedor gestiona la renovación y cancelación.')}</p>{billing.managementURL && <button className="site-button primary" onClick={manageWebPlan} disabled={billingBusy}>{billingBusy ? L('Opening…', 'Abriendo…') : L('Manage subscription', 'Gestionar suscripción')}</button>}</>
            : <>
              <p className="account-muted">{L('Choose a recurring plan. The amount and currency shown by checkout can vary by country.', 'Elige un plan recurrente. El importe y la moneda del pago pueden variar según el país.')}</p>
              <div className="account-web-plans">
                {billing.packages?.length ? billing.packages.map(plan => <article className="account-web-plan" key={plan.identifier}>
                  <div className="account-web-plan-head"><strong>{plan.title}</strong><b>{plan.price || 'Price shown at checkout'}</b></div>
                  <p>{plan.annual
                    ? plan.introPrice ? L(`${plan.introPrice} for the first year, then ${plan.price} per year, automatically renewing until canceled. Cancel in the Paddle customer portal; access continues through the paid period.`, `${plan.introPrice} el primer año y luego ${plan.price} al año, con renovación automática hasta que canceles. Cancela desde el portal de clientes de Paddle; tendrás acceso hasta el fin del periodo pagado.`) : L(`${plan.price} per year, automatically renewing until canceled. Cancel in the Paddle customer portal; access continues through the paid period.`, `${plan.price} al año, con renovación automática hasta que canceles. Cancela desde el portal de clientes de Paddle; tendrás acceso hasta el fin del periodo pagado.`)
                    : plan.monthly ? L(`${plan.price} per month, automatically renewing until canceled. Cancel in the Paddle customer portal; access continues through the paid period.`, `${plan.price} al mes, con renovación automática hasta que canceles. Cancela desde el portal de clientes de Paddle; tendrás acceso hasta el fin del periodo pagado.`) : L(`${plan.price} · automatically renews until canceled. Cancel in the Paddle customer portal.`, `${plan.price} · se renueva automáticamente hasta que canceles. Cancela desde el portal de clientes de Paddle.`)}</p>
                  <button className="site-button primary" onClick={() => buyWebPlan(plan)} disabled={billingBusy || !plan.price || !currentTerms}>{billingBusy ? L('Opening checkout…', 'Abriendo el pago…') : L(`Subscribe · ${plan.price || 'Unavailable'}`, `Suscribirme · ${plan.price || 'No disponible'}`)}</button>
                </article>) : <div className="account-web-plan account-web-prices">
                  <strong>{L('Monthly · USD 1/month', 'Mensual · USD 1/mes')}</strong><p>{L('Automatically renews each month until canceled.', 'Se renueva automáticamente cada mes hasta que canceles.')}</p>
                  <strong>{L('Eligible annual offer · USD 9 for the first year', 'Oferta anual para usuarios elegibles · USD 9 el primer año')}</strong><p>{L('Then renews at USD 12 per year until canceled.', 'Después se renueva a USD 12 al año hasta que canceles.')}</p>
                  <button className="site-button primary" disabled>{billing.configured ? L('Plans are being set up', 'Estamos configurando los planes') : L('Payments are being set up', 'Estamos configurando los pagos')}</button>
                </div>}
              </div>
              <p className="account-billing-terms">{L('Automatic renewal continues until canceled. Cancel website purchases from the Paddle customer portal; cancellation stops the next renewal and access continues to the end of the paid term. Taxes and the final localized charge are shown before payment. For subscriptions purchased in Google Play, use Play Store → Payments & subscriptions → Subscriptions.', 'La renovación automática continúa hasta que canceles. Cancela las compras web desde el portal de clientes de Paddle; la cancelación detiene la siguiente renovación y el acceso permanece hasta que termine el periodo pagado. Los impuestos y el importe final en moneda local se muestran antes del pago. Las compras de Google Play se cancelan desde Play Store → Pagos y suscripciones → Suscripciones.')}</p>
              {billing.status === 'error' && <p className="account-billing-error" role="alert">{billing.error}</p>}
            </>}
        </section>
        {!currentTerms && <div className="account-consent">
          <h3>{L('Review the current legal terms', 'Revisa las condiciones legales vigentes')}</h3><p>{L('Accept the current terms to manage the server copy. Your workout-data authorization remains optional.', 'Acepta las condiciones vigentes para gestionar la copia del servidor. La autorización de datos de entrenamiento sigue siendo opcional.')}</p>
          <div className="account-links">{DOCS.filter(doc => ['terms', 'privacy'].includes(doc.id)).map(doc => <a key={doc.id} href={`/#/legal/${doc.id}`}>{language === 'es' ? doc.es : doc.title}</a>)}</div>
          <label className="account-check"><input type="checkbox" checked={acceptTerms} onChange={event => setAcceptTerms(event.target.checked)} /> {L('I accept the current Terms and Conditions and Privacy Policy.', 'Acepto los Términos y condiciones y la Política de privacidad vigentes.')}</label>
          <label className="account-check"><input type="checkbox" checked={acceptTrainingData} onChange={event => setAcceptTrainingData(event.target.checked)} /> {L('I separately authorize processing workout and body-weight data for server backups. This is optional.', 'Autorizo por separado el tratamiento de datos de entrenamiento y peso para copias en el servidor. Es opcional.')}</label>
          <button className="site-button primary" onClick={acceptCurrentTerms} disabled={busy}>{L('Save choices', 'Guardar opciones')}</button>
        </div>}
        {currentTerms && !hasBackupConsent && <div className="account-consent">
          <h3>{L('Optional server-copy authorization', 'Autorización opcional de copia en el servidor')}</h3><p>{L('Your training history can remain on your device. To import, export, or update a copy on the server, separately authorize processing of workout and body-weight data.', 'Tu historial puede permanecer en tu dispositivo. Para importar, exportar o actualizar una copia en el servidor, autoriza por separado el tratamiento de los datos de entrenamiento y peso.')}</p>
          <label className="account-check"><input type="checkbox" checked={acceptTrainingData} onChange={event => setAcceptTrainingData(event.target.checked)} /> {L('I authorize processing workout and body-weight data for my server copy.', 'Autorizo el tratamiento de datos de entrenamiento y peso para mi copia del servidor.')}</label>
          <button className="site-button primary" onClick={acceptBackupConsent} disabled={busy}>{L('Authorize server copy', 'Autorizar copia del servidor')}</button>
        </div>}
        {currentTerms && hasBackupConsent && <>
          {state === null ? <div className="account-status" role="alert">{message}<div style={{ marginTop: 12 }}><button className="site-button primary" onClick={() => window.location.reload()}>Retry</button></div></div> : <>
          <div className="account-status">{message || L('Your private server copy is ready.', 'Tu copia privada en el servidor está lista.')}</div>
          <div className="account-tools">
            <button className="account-tool" onClick={() => exportFile('routines')}><Icon name="download" /><span><strong>{L('Export routines only', 'Exportar solo rutinas')}</strong><small>{L('A small file with routines and the weekly plan.', 'Un archivo pequeño con rutinas y el plan semanal.')}</small></span></button>
            <button className="account-tool" onClick={() => exportFile('history')}><Icon name="download" /><span><strong>{L('Export complete history', 'Exportar todo el historial')}</strong><small>{L('Routines, workouts, weights, favorites and settings.', 'Rutinas, entrenamientos, pesos, favoritos y ajustes.')}</small></span></button>
            <button className="account-tool" onClick={() => inputRef.current?.click()}><Icon name="upload" /><span><strong>{L('Import a Gym Book Training file', 'Importar archivo de Gym Book Training')}</strong><small>{L('Only versioned .gbt.json files up to 10 MB are accepted.', 'Solo se aceptan archivos .gbt.json versionados de hasta 10 MB.')}</small></span></button>
          </div>
          {pending && <div className="account-import-review"><h3>{pending.kind === 'routines' ? L('Import routines?', '¿Importar rutinas?') : L('Import complete history?', '¿Importar todo el historial?')}</h3><p>{pending.kind === 'routines' ? L('These routines will be added and the weekly schedule replaced. Existing workout history stays intact.', 'Se agregarán estas rutinas y se reemplazará el plan semanal. El historial actual se conservará.') : L('This replaces the current server copy, including its routines and training history.', 'Esto reemplazará la copia actual del servidor, incluidas las rutinas y el historial.')}</p><button className="site-button primary" onClick={commitImport} disabled={busy}>{L('Confirm import', 'Confirmar importación')}</button><button className="account-text-button" onClick={() => setPending(null)}>{L('Cancel', 'Cancelar')}</button></div>}
          <input ref={inputRef} type="file" accept=".gbt.json,application/json" hidden onChange={importFile} />
          </>}
        </>}
      </section>
    </>}
    {message && !user && <p className="account-message" role="status">{message}</p>}
  </main>
}
