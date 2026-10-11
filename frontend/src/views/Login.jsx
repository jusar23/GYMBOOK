import { useStore, hasData } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { passkeyRegister, api, BIO, createAppSessionWithSupabase } from '../lib/api.js'
import { cancelPasswordRecovery, clearPendingRecoveryCode, createEmailAccount, getPendingRecoveryCode, isPasswordRecovery, requestPasswordReset, signInWithEmail, signInWithGoogle, supabaseAuthConfigured, updateRecoveredPassword } from '../lib/supabaseAuth.js'
import { t } from '../lib/i18n.js'
import { DEMO, REPO } from '../lib/demo.js'
import { useState, useRef, useEffect } from 'react'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'

function authErrorText(error) {
  const message = String(error?.message || '')
  if (/invalid login credentials/i.test(message)) return t('Email or password is incorrect.')
  if (/user already registered|already been registered/i.test(message)) return t('An account already uses this email. Sign in instead.')
  if (/email not confirmed/i.test(message)) return t('Confirm your email from the link we sent you, then sign in.')
  if (/recovery code/i.test(message)) return t('That recovery code is invalid, already used, or belongs to another profile.')
  if (/already linked to another account/i.test(message)) return t('That imported profile is already linked to another account.')
  if (/supabase auth is not configured/i.test(message)) return t('Online sign-in is not configured yet. Add the Supabase Auth settings to the app and server environment.')
  return message || t('Authentication failed. Please try again.')
}

function GuestWarning({ close }) {
  const setGuest = useStore(s => s.setGuest)
  return <>
    <h3>{t('Continue as a guest?')}</h3>
    <div className="card small muted" style={{ lineHeight: 1.55, margin: '12px 0 16px' }}>
      {t('Your progress will stay only on this device and will not sync. You may lose it if you clear app data, uninstall GYMBOOK or change devices.')}
    </div>
    <Button variant="primary" onClick={() => { close(); setGuest(true) }}>{t('Continue as guest')}</Button>
    <Button variant="ghost" onClick={close}>{t('Go back')}</Button>
  </>
}

function RegisterSheet({ close }) {
  const { setUser, pushState, pullState } = useStore()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [inviteOnly, setInviteOnly] = useState(false)
  const ref = useRef(null)
  useEffect(() => { setTimeout(() => ref.current?.focus(), 250) }, [])
  useEffect(() => { api('/api/config').then(c => setInviteOnly(!!c.invite_only)).catch(() => {}) }, [])
  const go = async () => {
    const n = name.trim()
    if (!n) { useUI.getState().toast(t('Enter a name')); return }
    if (inviteOnly && !code.trim()) { useUI.getState().toast(t('An invite code is required')); return }
    try {
      const u = await passkeyRegister(n, code.trim())
      setUser(u); close()
      if (hasData(useStore.getState().S)) { await pushState(); useUI.getState().toast(t('Profile created — data from this device moved into it')) }
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

export default function Login() {
  const { setUser, pullState, setGuest, setSigningIn } = useStore()
  const [mode, setMode] = useState('signin')
  const [recoveryMode, setRecoveryMode] = useState(isPasswordRecovery)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const authReady = supabaseAuthConfigured()

  useEffect(() => {
    const message = localStorage.getItem('gym_auth_error')
    if (message) { setError(message); localStorage.removeItem('gym_auth_error') }
  }, [])

  const finishLogin = async session => {
    if (!session?.access_token) throw new Error(t('Check your email to confirm your account, then sign in.'))
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
        const result = await createEmailAccount({ name, email, password })
        if (result.confirmationRequired) setNotice(t('Account created. Check your email for a confirmation link before signing in.'))
        else await finishLogin(result)
      } else {
        await finishLogin(await signInWithEmail({ email, password }))
      }
    } catch (e) { setError(authErrorText(e)) }
    finally { setBusy(false); if (loadingApp) setSigningIn(false) }
  }

  const google = async () => {
    setError(''); setNotice(''); setBusy(true); setSigningIn(true)
    try { await signInWithGoogle() }
    catch (e) { setError(authErrorText(e)); setBusy(false); setSigningIn(false) }
  }

  const head = <>
    <div style={{ fontSize: 54, display: 'flex', justifyContent: 'center', color: 'var(--acc)' }}><Icon name="dumbbell" /></div>
    <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-.028em', margin: '10px 0 4px' }}>GYMBOOK</h1>
    <div style={{ color: 'var(--acc)', fontSize: 16, fontWeight: 600, marginBottom: 6 }}>your personal trainer</div>
  </>
  const wrap = { display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '78vh', textAlign: 'center' }

  if (DEMO) return (
    <div className="narrow" style={wrap}>
      {head}
      <div className="muted" style={{ marginBottom: 30 }}>{t('Live demo — everything stays in this browser.')}</div>
      <Button variant="primary" icon="sparkles" onClick={() => setGuest(true)}>{t('Start the demo')}</Button>
      <div className="card small muted" style={{ textAlign: 'left', marginTop: 16 }}>
        {t('This demo runs entirely in your browser on example data — nothing is sent anywhere. Passkey sign-in and sync across your devices come with the GYMBOOK server, which you get by self-hosting it.')}
      </div>
      <div className="dim small" style={{ marginTop: 22, lineHeight: 1.6 }}><a href={REPO} target="_blank" rel="noopener">{t('Self-host it in a minute →')}</a></div>
    </div>
  )

  return (
    <div className="narrow login-screen" style={{ ...wrap, padding: '24px 0' }}>
      {head}
      <div className="login-price-notice">{t('30 days free, then $1/month')}</div>

      {authReady ? recoveryMode ? <>
        <div className="muted small" style={{ margin: '12px 0' }}>{t('Choose a new password for your GYMBOOK account.')}</div>
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
        <Button className="google-btn" onClick={google} disabled={busy}>Continue with Google</Button>
        <div className="dim small" style={{ margin: '16px 0' }}>{t('or use email')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          <Button className={mode === 'signin' ? 'tinted' : 'plain'} onClick={() => { setMode('signin'); setError(''); setNotice('') }}>{t('Sign in')}</Button>
          <Button className={mode === 'signup' ? 'tinted' : 'plain'} onClick={() => { setMode('signup'); setError(''); setNotice('') }}>{t('Create account')}</Button>
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
          <Button variant="primary" type="submit" disabled={busy}>{busy ? t('Please wait…') : mode === 'forgot' ? t('Send reset link') : mode === 'signup' ? t('Create account') : t('Sign in')}</Button>
        </form>
        {error && <div role="alert" className="small" style={{ color: 'var(--red)', textAlign: 'left', marginTop: 12 }}>{error}</div>}
        {notice && <div role="status" className="card small muted" style={{ textAlign: 'left', marginTop: 12 }}>{notice}</div>}
        {mode === 'signin' && <Button variant="ghost" className="dim" onClick={() => { setMode('forgot'); setError(''); setNotice('') }}>{t('Forgot password?')}</Button>}
        {mode === 'forgot' && <Button variant="ghost" className="dim" onClick={() => { setMode('signin'); setError(''); setNotice('') }}>{t('Back to sign in')}</Button>}
      </> : <div className="card small muted" style={{ textAlign: 'left' }}>{t('Online sign-in is not configured yet. Add the Supabase Auth settings to the app and server environment.')}</div>}

      <Button variant="ghost" className="dim" onClick={() => useUI.getState().openSheet(close => <GuestWarning close={close} />)}>{t('Continue as a guest')}</Button>
      <div className="dim small" style={{ marginTop: 12, lineHeight: 1.5 }}>{t('Guest progress stays on this device and is not synced.')}</div>
      {authReady && <div className="dim small" style={{ marginTop: 16, lineHeight: 1.5 }}>{t('Your account keeps your profile and workout progress synced across devices.')}</div>}
    </div>
  )
}
