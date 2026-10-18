import { useStore, hasData } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { passkeyRegister, api, BIO, createAppSessionWithSupabase } from '../lib/api.js'
import { cancelPasswordRecovery, clearPendingRecoveryCode, createEmailAccount, getPendingRecoveryCode, isPasswordRecovery, requestPasswordReset, signInWithEmail, signInWithGoogle, supabaseAuthConfigured, updateAuthUserMetadata, updateRecoveredPassword } from '../lib/supabaseAuth.js'
import { t } from '../lib/i18n.js'
import { countryOptions } from '../lib/countries.js'
import { legalConsentMetadata, needsLegalSetup } from '../lib/legalConsent.js'
import { LegalContent } from './Legal.jsx'
import { DEMO } from '../lib/demo.js'
import { MOBILE } from '../lib/mobile.js'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { Button, Check } from '../components/ui.jsx'

function ofAdultAge(dateValue) {
  if (!dateValue) return false
  const dob = new Date(`${dateValue}T00:00:00`)
  if (Number.isNaN(dob.getTime()) || dob > new Date()) return false
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) age--
  return age > 18
}

function maxBirthDate() {
  const limit = new Date()
  limit.setFullYear(limit.getFullYear() - 18)
  limit.setDate(limit.getDate() - 1)
  const pad = value => String(value).padStart(2, '0')
  return `${limit.getFullYear()}-${pad(limit.getMonth() + 1)}-${pad(limit.getDate())}`
}

function LegalPreview({ close, ids, title }) {
  return <div style={{ padding: 'max(18px, env(safe-area-inset-top)) 18px max(22px, env(safe-area-inset-bottom))' }}>
    <div className="sheet-full-head">
      <h3 style={{ flex: 1 }}>{title}</h3>
      <button type="button" className="iconbtn" onClick={close} aria-label={t('Close')}><Icon name="xmark" /></button>
    </div>
    <LegalContent ids={ids} />
    <Button variant="primary" onClick={close}>{t('Close')}</Button>
  </div>
}

function authErrorText(error) {
  const message = String(error?.message || '')
  if (/invalid login credentials/i.test(message)) return t('Email or password is incorrect.')
  if (/user already registered|already been registered/i.test(message)) return t('An account already uses this email. Sign in instead.')
  if (/email not confirmed/i.test(message)) return t('Confirm your email from the link we sent you, then sign in.')
  if (/authentication request timed out/i.test(message)) return t('Authentication request timed out. Check your connection and try again.')
  if (/recovery code/i.test(message)) return t('That recovery code is invalid, already used, or belongs to another profile.')
  if (/already linked to another account/i.test(message)) return t('That imported profile is already linked to another account.')
  if (/supabase auth is not configured/i.test(message)) return t('Online sign-in is not configured yet. Add the Supabase Auth settings to the app.')
  return message || t('Authentication failed. Please try again.')
}

function RegisterSheet({ close }) {
  const setUser = useStore(s => s.setUser)
  const pushState = useStore(s => s.pushState)
  const pullState = useStore(s => s.pullState)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [inviteOnly, setInviteOnly] = useState(false)
  const ref = useRef(null)
  useEffect(() => { setTimeout(() => ref.current?.focus(), 250) }, [])
  useEffect(() => { if (!MOBILE) api('/api/config').then(c => setInviteOnly(!!c.invite_only)).catch(() => {}) }, [])
  const go = async () => {
    const n = name.trim()
    if (!n) { useUI.getState().toast(t('Enter a name')); return }
    if (inviteOnly && !code.trim()) { useUI.getState().toast(t('An invite code is required')); return }
    try {
      const u = await passkeyRegister(n, code.trim())
      setUser(u); close()
      if (hasData(useStore.getState().S)) { await pushState(true); useUI.getState().toast(t('Profile created — data from this device moved into it')) }
      else { await pullState(); useUI.getState().toast(t('Welcome, {0}', u.name)) }
    } catch (e) { if (e.name !== 'NotAllowedError' && e.name !== 'AbortError') useUI.getState().toast(e.message || t('Registration failed')) }
  }
  return <>
    <h3>{t('Create a passkey profile')}</h3>
    <div className="muted small" style={{ marginBottom: 14 }}>{t('Pick a name, then confirm with {0}. The passkey is saved in your device — no password needed.', BIO)}</div>
    <input ref={ref} className="input" placeholder={t('Your name')} maxLength={40} value={name} onChange={e => setName(e.target.value)} />
    {inviteOnly && <>
      <div style={{ height: 10 }} />
      <input className="input" placeholder={t('Invite code')} maxLength={40} value={code}
        onChange={e => setCode(e.target.value.toUpperCase())} style={{ letterSpacing: '.14em', fontWeight: 600, textAlign: 'center' }} />
      <div className="dim small" style={{ marginTop: 6 }}>{t('This app is invite-only — enter the code you were given.')}</div>
    </>}
    <div style={{ height: 12 }} />
    <Button variant="primary" onClick={go}>{t('Create passkey')}</Button>
  </>
}

export default function Login({ legalSetup = false }) {
  const navigate = useNavigate()
  const setUser = useStore(s => s.setUser)
  const pullState = useStore(s => s.pullState)
  const setSigningIn = useStore(s => s.setSigningIn)
  const [mode, setMode] = useState('signin')
  const [recoveryMode, setRecoveryMode] = useState(isPasswordRecovery)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [trainingDataAccepted, setTrainingDataAccepted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const authReady = supabaseAuthConfigured()

  useEffect(() => {
    const message = localStorage.getItem('gym_auth_error')
    if (message) { setError(message); localStorage.removeItem('gym_auth_error') }
  }, [])

  // Google returns to this same Login component for accounts that still need legal setup.
  // Clear the OAuth launch spinner so the user can submit the required registration details.
  useEffect(() => {
    if (legalSetup) { setBusy(false); setSigningIn(false) }
  }, [legalSetup])

  const finishLogin = async session => {
    if (!session?.access_token) throw new Error(t('Check your email to confirm your account, then sign in.'))
    if (MOBILE) {
      const authUser = session.user || {}
      const needsSetup = needsLegalSetup(authUser)
      setUser({
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Gym Book Training user',
        needsLegalSetup: needsSetup,
      })
      clearPendingRecoveryCode()
      if (!needsSetup) useUI.getState().toast(t('Signed in. Your workout data stays on this phone.'))
      return
    }
    if (needsLegalSetup(session.user)) {
      const authUser = session.user
      setUser({
        id: authUser.id, email: authUser.email,
        name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Gym Book Training user',
        needsLegalSetup: true,
      })
      clearPendingRecoveryCode()
      return
    }
    const result = await createAppSessionWithSupabase(session.access_token, getPendingRecoveryCode())
    clearPendingRecoveryCode()
    const { user, state } = result
    setUser(user)
    try { await pullState(state, Object.hasOwn(result, 'state'), true) }
    catch (e) {
      setUser(null)
      localStorage.setItem('gym_auth_error', e.message || t('Could not load your profile data.'))
      throw e
    }
    useUI.getState().toast(t('Welcome, {0}', user.name))
  }

  const submit = async e => {
    e.preventDefault()
    const loadingApp = mode !== 'forgot' && !recoveryMode
    setError(''); setNotice(''); setBusy(true)
    if (loadingApp) setSigningIn(true)
    try {
      if (recoveryMode) {
        if (password !== confirmPassword) throw new Error(t('Passwords do not match.'))
        await updateRecoveredPassword(password)
        setRecoveryMode(false); setMode('signin'); setPassword(''); setConfirmPassword('')
        setNotice(t('Your password has been changed. Sign in with your new password.'))
      } else if (mode === 'forgot') {
        await requestPasswordReset(email)
        setNotice(t('If an account exists for that email, we sent a password reset link. Check your inbox.'))
      } else if (mode === 'signup') {
        if (!name.trim()) throw new Error(t('Enter a name'))
        const legalMetadata = validatedLegalMetadata()
        const result = await createEmailAccount({ name, email, password, legalMetadata })
        if (result.confirmationRequired) setNotice(t('Account created. Check your email for a confirmation link before signing in.'))
        else await finishLogin(result)
      } else if (legalSetup) {
        const legalMetadata = validatedLegalMetadata()
        const authUser = await updateAuthUserMetadata(legalMetadata)
        const currentUser = useStore.getState().user
        setUser({ ...currentUser, needsLegalSetup: needsLegalSetup(authUser) })
        navigate('/home', { replace: true })
      } else {
        await finishLogin(await signInWithEmail({ email, password }))
      }
    } catch (e) { setError(authErrorText(e)) }
    finally { setBusy(false); if (loadingApp) setSigningIn(false) }
  }

  const validatedLegalMetadata = () => {
    if (!ofAdultAge(dateOfBirth)) throw new Error(t('You must be over 18 years old to create an account.'))
    if (!countryCode) throw new Error(t('Select your country.'))
    if (!termsAccepted) throw new Error(t('Accept the terms and privacy notice to continue.'))
    return legalConsentMetadata({ dateOfBirth, countryCode, trainingDataAccepted })
  }

  const openLegal = (ids, title) => useUI.getState().openSheet(close => <LegalPreview close={close} ids={ids} title={title} />, { kind: 'full', locked: true })

  const legalFields = () => <>
    <label className="signup-field-label" htmlFor="gymbook-dob">{t('Date of birth')}</label>
    <input id="gymbook-dob" className="input" type="date" autoComplete="bday" max={maxBirthDate()} value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} required />
    <label className="signup-field-label" htmlFor="gymbook-country">{t('Country of residence')}</label>
    <select id="gymbook-country" className="input" value={countryCode} onChange={e => setCountryCode(e.target.value)} required>
      <option value="" disabled>{t('Select your country')}</option>
      {countryOptions().map(country => <option key={country.code} value={country.code}>{country.name}</option>)}
    </select>
    <div className="signup-consent">
      <Check checked={termsAccepted} onChange={setTermsAccepted} aria-label={t('Accept the terms and privacy notice')} />
      <div>{t('I accept the')} <button type="button" className="signup-legal-link" onClick={() => openLegal(['terms'], t('Terms and conditions'))}>{t('Terms and conditions')}</button> {t('and the')} <button type="button" className="signup-legal-link" onClick={() => openLegal(['privacy'], t('Privacy policy'))}>{t('Privacy policy')}</button>.</div>
    </div>
    <div className="signup-consent">
      <Check checked={trainingDataAccepted} onChange={setTrainingDataAccepted} aria-label={t('Authorize workout data processing')} />
      <div>{t('Optional: I explicitly authorize processing of my workout and body-weight data for progress tracking and server backups. Without this authorization, my workouts stay on this device and server backup and restore are unavailable.')}</div>
    </div>
  </>

  const google = async () => {
    setError(''); setNotice(''); setBusy(true); setSigningIn(true)
    try { await signInWithGoogle() }
    catch (e) { setError(authErrorText(e)) }
    finally { setBusy(false); setSigningIn(false) }
  }

  const head = <>
    <div style={{ fontSize: 54, display: 'flex', justifyContent: 'center', color: 'var(--acc)' }}><Icon name="bookTraining" /></div>
    <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-.035em', margin: '10px 0 4px' }}>Gym Book Training</h1>
    <div style={{ color: 'var(--acc)', fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Your training, in your pocket</div>
  </>
  const wrap = { display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '78vh', textAlign: 'center' }

  if (DEMO) return (
    <div className="narrow" style={wrap}>
      {head}
      <div className="muted" style={{ marginBottom: 30 }}>{t('Live demo — everything stays in this browser.')}</div>
      {!MOBILE && <Button variant="primary" icon="sparkles" onClick={() => useStore.getState().setGuest(true)}>{t('Start the demo')}</Button>}
      <div className="card small muted" style={{ textAlign: 'left', marginTop: 16 }}>
        {t('This demo runs entirely in your browser on example data — nothing is sent anywhere. Your own profile and workout data are available after you create an account or sign in.')}
      </div>
    </div>
  )

  return (
    <div className="narrow login-screen" style={{ ...wrap, padding: '24px 0' }}>
      {head}
      <div className="login-panel">
      <div className="login-price-notice">
        {t('Planned subscription prices: USD 1 per month, or an eligible new subscriber offer of USD 9 for the first year then USD 12 per year. Local price and cancellation terms appear before checkout; no charge is made unless a plan is displayed and you confirm it.')}
        <button type="button" className="login-legal-link" onClick={() => navigate('/legal/subscription')}>{t('Subscription terms')}</button>
      </div>

      {authReady ? legalSetup ? <>
        <h2 style={{ textAlign: 'left', margin: '10px 0' }}>{t('Complete your account')}</h2>
        <div className="muted small" style={{ textAlign: 'left', marginBottom: 12 }}>{t('Before using a signed-in account, add your age and country and accept the current legal documents.')}</div>
        <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
          {legalFields()}
          <Button variant="primary" type="submit" disabled={busy}>{busy ? t('Please wait…') : t('Save and continue')}</Button>
        </form>
        {error && <div role="alert" className="small" style={{ color: 'var(--red)', textAlign: 'left', marginTop: 12 }}>{error}</div>}
        <Button variant="ghost" className="dim" onClick={async () => { await useStore.getState().signOut(); navigate('/login', { replace: true }) }}>{t('Sign out')}</Button>
      </> : recoveryMode ? <>
        <div className="muted small" style={{ margin: '12px 0' }}>{t('Choose a new password for your Gym Book Training account.')}</div>
        <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
          <div className="password-field">
            <input className="input" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder={t('New password')} minLength={6} value={password} onChange={e => setPassword(e.target.value)} required />
            <button className="password-visibility-toggle" type="button" onClick={() => setShowPassword(visible => !visible)} aria-label={showPassword ? t('Hide password') : t('Show password')} aria-pressed={showPassword} title={showPassword ? t('Hide password') : t('Show password')}><Icon name={showPassword ? 'eyeOff' : 'eye'} size={20} /></button>
          </div>
          <div className="password-field">
            <input className="input" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder={t('Confirm new password')} minLength={6} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            <button className="password-visibility-toggle" type="button" onClick={() => setShowPassword(visible => !visible)} aria-label={showPassword ? t('Hide password') : t('Show password')} aria-pressed={showPassword} title={showPassword ? t('Hide password') : t('Show password')}><Icon name={showPassword ? 'eyeOff' : 'eye'} size={20} /></button>
          </div>
          <Button variant="primary" type="submit" disabled={busy}>{busy ? t('Please wait…') : t('Save new password')}</Button>
        </form>
        {error && <div role="alert" className="small" style={{ color: 'var(--red)', textAlign: 'left', marginTop: 12 }}>{error}</div>}
        <Button variant="ghost" className="dim" onClick={() => { cancelPasswordRecovery(); setRecoveryMode(false); setPassword(''); setConfirmPassword(''); setError('') }}>{t('Back to sign in')}</Button>
      </> : <>
        {mode !== 'forgot' && <>
        <Button className="google-btn" onClick={google} disabled={busy} aria-label="Continue with Google">
          <span>Continue with</span><span className="google-word" aria-hidden="true"><b className="google-blue">G</b><b className="google-red">o</b><b className="google-yellow">o</b><b className="google-blue">g</b><b className="google-green">l</b><b className="google-red">e</b></span>
        </Button>
        <div className="dim small" style={{ margin: '16px 0' }}>{t('or use email')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          <Button className={'login-choice ' + (mode === 'signin' ? 'tinted' : 'plain')} onClick={() => { setMode('signin'); setError(''); setNotice('') }}>{t('Sign in')}</Button>
          <Button className={'login-choice ' + (mode === 'signup' ? 'tinted' : 'plain')} onClick={() => { setMode('signup'); setError(''); setNotice('') }}>{t('Create account')}</Button>
        </div>
        </>}
        <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
          {mode === 'signup' && <input className="input" autoComplete="name" placeholder={t('Your name')} maxLength={40} value={name} onChange={e => setName(e.target.value)} required />}
          <input className="input" type="email" autoComplete="email" placeholder={t('Email')} value={email} onChange={e => setEmail(e.target.value)} required />
          {mode !== 'forgot' && <div className="password-field">
            <input className="input" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder={t('Password')} minLength={6} value={password} onChange={e => setPassword(e.target.value)} required />
            <button className="password-visibility-toggle" type="button" onClick={() => setShowPassword(visible => !visible)} aria-label={showPassword ? t('Hide password') : t('Show password')} aria-pressed={showPassword} title={showPassword ? t('Hide password') : t('Show password')}>
              <Icon name={showPassword ? 'eyeOff' : 'eye'} size={20} />
            </button>
          </div>}
          {mode === 'signup' && legalFields()}
          <Button variant="primary" type="submit" disabled={busy}>{busy ? t('Please wait…') : mode === 'forgot' ? t('Send reset link') : mode === 'signup' ? t('Create account') : t('Sign in')}</Button>
        </form>
        {error && <div role="alert" className="small" style={{ color: 'var(--red)', textAlign: 'left', marginTop: 12 }}>{error}</div>}
        {notice && <div role="status" className="card small muted" style={{ textAlign: 'left', marginTop: 12 }}>{notice}</div>}
        {mode === 'signin' && <Button variant="ghost" className="dim" onClick={() => { setMode('forgot'); setError(''); setNotice('') }}>{t('Forgot password?')}</Button>}
        {mode === 'forgot' && <Button variant="ghost" className="dim" onClick={() => { setMode('signin'); setError(''); setNotice('') }}>{t('Back to sign in')}</Button>}
      </> : <div className="card small muted" style={{ textAlign: 'left' }}>{t('Online sign-in is not configured yet. Add the Supabase Auth settings to the app.')}</div>}

      {!MOBILE && <>
        <Button variant="ghost" className="dim" onClick={() => useStore.getState().setGuest(true)}>{t('Continue as a guest')}</Button>
        <div className="dim small" style={{ marginTop: 12, lineHeight: 1.5 }}>{t('Guest progress stays on this device and is not synced.')}</div>
      </>}
      {authReady && <div className="dim small" style={{ marginTop: 16, lineHeight: 1.5 }}>{t('Your account keeps your profile and workout progress synced across devices.')}</div>}
      <button className="login-legal-link" onClick={() => navigate('/legal', { state: { from: '/' } })}>{t('Legal & privacy')}</button>
      </div>
    </div>
  )
}
