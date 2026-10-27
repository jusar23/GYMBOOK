import { useEffect, useRef, useState } from 'react'

import { useLocation, useNavigate } from 'react-router-dom'

import { useStore, DEF, hasData } from '../store/useStore.js'

import { useUI } from '../store/useUI.js'

import { ACCENTS, todayISO, localTZ } from '../lib/format.js'

import { effortOf, fmtSec } from '../lib/history.js'

import { api, createAppSessionWithSupabase, webauthnOK, passkeyLogin, passkeyRegister, IS_ANDROID } from '../lib/api.js'

import { deleteSupabaseAccount, getAuthSession, updateAuthUserMetadata } from '../lib/supabaseAuth.js'
import { loadCloudBackup, saveCloudBackup, setCloudBackupConsent } from '../lib/supabaseBackup.js'
import { LEGAL_VERSION } from '../lib/legalConsent.js'
import { mergePlan } from '../lib/plan-share.js'
import { parseTrainingFile, trainingFileText } from '../lib/training-file.js'
import { openSubscriptionManagement } from '../lib/subscription.js'

import { pushSupported, enablePush, disablePush, sendTestPush } from '../lib/push.js'

import { wakeLockSupported } from '../lib/wakelock.js'
import { playTimerTone, TIMER_TONES } from '../lib/sound.js'

import { t, LANGS, INSTR_LANGS } from '../lib/i18n.js'

import { DEMO } from '../lib/demo.js'

import { ANDROID_APP, MOBILE, listenRestBubblePermission, requestRestBubblePermission, shareExport, syncReminder } from '../lib/mobile.js'

import { loadStarterPlan, confirmSheet, importFromApp } from '../sheets.jsx'
import Icon from '../components/Icon.jsx'
import { openTutorial } from '../components/Tutorial.jsx'

const ACCENT_TONES = [
  { id: 'vivid', label: 'Vivid' },
  { id: 'light-intense', label: 'Light intense' },
]

import { Section, Row, SelectRow, Switch, Segmented, Button, TextField } from '../components/ui.jsx'

import { DOCS } from './Legal.jsx'

const SOCIAL_LINKS = [
  { name: 'Facebook', icon: 'facebook', tint: '#1877f2', url: import.meta.env.VITE_SOCIAL_FACEBOOK_URL || '' },
  { name: 'X', icon: 'xSocial', tint: '#222222', url: import.meta.env.VITE_SOCIAL_X_URL || '' },
  { name: 'Instagram', icon: 'instagram', tint: '#c13584', url: import.meta.env.VITE_SOCIAL_INSTAGRAM_URL || '' },
  { name: 'Website', icon: 'globe', tint: '#3478f6', url: import.meta.env.VITE_PUBLIC_WEBSITE_URL || 'https://gymbooktraining.com/' },
]
const DOC_TINT = { privacy: 'var(--blue)', collection: 'var(--teal)', 'third-parties': 'var(--purple)', terms: 'var(--brown)' }

function openSocialLink(rawUrl) {
  try {
    const url = new URL(rawUrl)
    if (url.protocol === 'https:' || url.protocol === 'http:') window.open(url.href, '_blank', 'noopener,noreferrer')
  } catch { /* Ignore invalid public links rather than opening an unsafe URL. */ }
}



export default function Settings() {

  const nav = useNavigate()
  const location = useLocation()

  const S = useStore(s => s.S)

  const user = useStore(s => s.user)

  const update = useStore(s => s.update)
  const replaceState = useStore(s => s.replaceState)
  const setUser = useStore(s => s.setUser)
  const setSigningIn = useStore(s => s.setSigningIn)
  const pullState = useStore(s => s.pullState)
  const pushState = useStore(s => s.pushState)
  const signOut = useStore(s => s.signOut)
  const signOutAll = useStore(s => s.signOutAll)
  const completeAccountDeletion = useStore(s => s.completeAccountDeletion)
  const resetDemo = useStore(s => s.resetDemo)

  const toast = useUI(s => s.toast)

  const fileRef = useRef(null)

  const importRef = useRef(null)

  const wakeOK = wakeLockSupported()
  const [cloudBusy, setCloudBusy] = useState(false)
  const [accountDeleting, setAccountDeleting] = useState(false)
  const [trainingConsentBusy, setTrainingConsentBusy] = useState(false)

  useEffect(() => {
    const scrollY = location.state?.restoreScrollY
    if (!Number.isFinite(scrollY)) return
    requestAnimationFrame(() => window.scrollTo(0, scrollY))
  }, [location.key, location.state?.restoreScrollY])

  useEffect(() => {
    if (!ANDROID_APP) return
    let mounted = true
    let listener = null
    listenRestBubblePermission(granted => {
      if (!mounted) return
      if (!granted && useStore.getState().S.restBubble) {
        update(s => { s.restBubble = false })
        toast(t('Allow Gymbook to display over other apps to use the rest bubble.'))
      }
    }).then(handle => {
      if (mounted) listener = handle
      else handle?.remove()
    })
    return () => { mounted = false; listener?.remove() }
  }, [update, toast])

  const saveTrainingDataConsent = async () => {
    const session = await getAuthSession()
    if (!session?.user) throw new Error(t('Sign in to use cloud backup.'))
    const metadata = session.user.user_metadata || {}
    const updated = await updateAuthUserMetadata({ ...metadata,
      gymbook_sensitive_training_consent: true,
      gymbook_sensitive_training_consent_version: LEGAL_VERSION,
      gymbook_sensitive_training_consent_text_version: LEGAL_VERSION,
      gymbook_sensitive_training_consent_at: new Date().toISOString(),
    })
    await setCloudBackupConsent(true)
    setUser({ ...user, email: updated.email, trainingDataConsent: true })
  }

  const requestTrainingDataConsent = onAccept => confirmSheet({
    title: t('Authorize workout data processing'),
    message: t('Optional: I explicitly authorize processing of my workout and body-weight data for progress tracking and server backups. Without this authorization, my workouts stay on this device and server backup and restore are unavailable.'),
    confirmText: t('Confirm'),
    onConfirm: onAccept,
  })

  const updateTrainingConsent = async (accepted, confirmed = false) => {
    if (MOBILE && accepted && !confirmed && user.trainingDataConsent !== true) {
      requestTrainingDataConsent(() => updateTrainingConsent(true, true))
      return
    }
    setTrainingConsentBusy(true)
    try {
      if (MOBILE) {
        if (!accepted) {
          confirmSheet({
            title: t('Turn off server backup?'),
            message: t('New uploads and access to the server copy will stop. The existing copy remains stored in Supabase until you request deletion or delete your account. Your data on this phone will stay here.'),
            confirmText: t('Turn off backup'), danger: true,
            onConfirm: async () => {
              setTrainingConsentBusy(true)
              try {
                await setCloudBackupConsent(false)
                const session = await getAuthSession()
                const metadata = session?.user?.user_metadata || {}
                const updated = await updateAuthUserMetadata({ ...metadata,
                  gymbook_sensitive_training_consent: false,
                  gymbook_sensitive_training_consent_version: LEGAL_VERSION,
                  gymbook_sensitive_training_consent_text_version: LEGAL_VERSION,
                  gymbook_sensitive_training_consent_revoked_at: new Date().toISOString(),
                })
                setUser({ ...user, email: updated.email, trainingDataConsent: false })
                toast(t('Server workout sync disabled'))
              } catch (e) { toast(e.message || t('Could not update server-sync consent')) }
              finally { setTrainingConsentBusy(false) }
            },
          })
          return
        }
        await saveTrainingDataConsent()
        toast(t('Server workout sync enabled'))
        return
      }
      const result = await api('/api/consent/training-data', {
        method: 'PUT', body: JSON.stringify({ accepted }),
      })
      setUser({ ...user, trainingDataConsent: result.accepted })
      if (result.accepted) await pullState(undefined, false, true)
      toast(result.accepted ? t('Server workout sync enabled') : t('Server workout sync disabled'))
    } catch (e) {
      toast(e.message || t('Could not update server-sync consent'))
    } finally { setTrainingConsentBusy(false) }
  }

  const showAccountNotice = (title, message, success = false) => useUI.getState().openSheet(close => (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', padding: 'max(24px, env(safe-area-inset-top)) 22px max(24px, env(safe-area-inset-bottom))' }}>
      <div className="sheet-full-head">
        <h3>{title}</h3>
        <button className="iconbtn" onClick={close} aria-label={t('Close')}><Icon name="xmark" /></button>
      </div>
      <div style={{ display: 'grid', placeItems: 'center', flex: 1, padding: '30px 0' }}>
        <div style={{ width: 68, height: 68, borderRadius: 34, display: 'grid', placeItems: 'center', color: success ? 'var(--green)' : 'var(--red)', background: success ? 'color-mix(in srgb, var(--green) 13%, transparent)' : 'color-mix(in srgb, var(--red) 13%, transparent)' }}>
          <Icon name={success ? 'checkCircle' : 'info'} size={34} />
        </div>
        <p style={{ textAlign: 'center', lineHeight: 1.55, whiteSpace: 'pre-wrap', marginTop: 22, maxWidth: 440 }}>{message}</p>
      </div>
      <Button variant="primary" onClick={close}>{t('Close')}</Button>
    </div>
  ), { kind: 'full', locked: true })

  const uploadCloudBackup = async ({ authorize = false } = {}) => {
    setCloudBusy(true)
    try {
      if (authorize) {
        setTrainingConsentBusy(true)
        await saveTrainingDataConsent()
      }
      await saveCloudBackup(S)
      toast(t('Cloud backup saved'))
    }
    catch (e) { toast(e.message || t('Cloud backup failed')) }
    finally { setCloudBusy(false); setTrainingConsentBusy(false) }
  }

  const backUpToCloud = () => {
    if (user?.trainingDataConsent !== true) {
      requestTrainingDataConsent(() => uploadCloudBackup({ authorize: true }))
      return
    }
    uploadCloudBackup()
  }

  const restoreCloudBackup = async () => {
    setCloudBusy(true)
    try {
      const backup = await loadCloudBackup()
      if (!backup) { toast(t('No cloud backup found')); return }
      if (!backup.state || typeof backup.state !== 'object' || Array.isArray(backup.state)) {
        throw new Error(t('The server backup is invalid or incomplete.'))
      }
      confirmSheet({
        title: t('Restore cloud backup?'),
        message: t('This replaces the progress on this phone with the backup from {0}.', new Date(backup.updatedAt).toLocaleString()),
        confirmText: t('Restore backup'), danger: true,
        onConfirm: () => {
          try {
            const restored = Object.assign(JSON.parse(JSON.stringify(DEF)), backup.state)
            replaceState(restored, false)
            toast(t('Server backup restored'))
          } catch (e) { toast(e.message || t('Cloud backup failed')) }
        },
      })
    } catch (e) { toast(e.message || t('Cloud backup failed')) }
    finally { setCloudBusy(false) }
  }

  const manageSubscription = async () => {
    try { await openSubscriptionManagement(user.id, { native: MOBILE }) }
    catch (error) { toast(error.message || t('Could not open subscription management.')) }
  }



  const doExport = async (kind = 'history') => {

    const json = trainingFileText(S, kind)

    const name = `Gym-Book-Training-${kind}-${todayISO()}.gbt.json`

    // WKWebView can't download blob URLs — the native build hands the file to the share sheet.

    if (MOBILE) {

      try { await shareExport(json, name); toast(t('Backup exported')) } catch (e) { /* share sheet dismissed */ }

      return

    }

    const blob = new Blob([json], { type: 'application/json' })

    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); URL.revokeObjectURL(a.href)

    toast(t('Backup exported'))

  }

  const confirmExport = (kind = 'history') => confirmSheet({

    title: kind === 'routines' ? t('Export routines?') : t('Export backup?'),

    message: kind === 'routines' ? t('This creates a small file with your routines and weekly schedule.') : t('This creates a JSON copy of your Gym Book Training data on this device.'),

    confirmText: t('Export backup'),

    onConfirm: () => doExport(kind),

  })

  const confirmStarterPlan = () => confirmSheet({

    title: t('Load starter plan?'),

    message: t('This adds three starter routines and assigns them to Monday, Wednesday and Friday. Existing assignments on those days will be replaced.'),

    confirmText: t('Load plan'),

    onConfirm: loadStarterPlan,

  })

  const doImport = ev => {

    const f = ev.target.files[0]; if (!f) return

    const rd = new FileReader()

    rd.onload = () => {

      try {

        const imported = parseTrainingFile(rd.result)
        const routinesOnly = imported.kind === 'routines'

        confirmSheet({
          title: routinesOnly ? t('Import routines?') : t('Import backup?'),
          message: routinesOnly ? t('This adds the routines from the file and keeps your current progress.') : t('This replaces all current data with the backup file.'),
          confirmText: t('Import'), danger: !routinesOnly,
          onConfirm: () => {
            if (routinesOnly) {
              const next = JSON.parse(JSON.stringify(S))
              mergePlan(next, imported.data, { schedule: true })
              replaceState(next, true)
            }
            else replaceState(Object.assign(JSON.parse(JSON.stringify(DEF)), imported.data), true)
            toast(t(routinesOnly ? 'Routines imported' : 'Backup imported'))
          },
        })

      } catch (e) { toast(t('Import failed: {0}', e.message)) }

    }

    rd.readAsText(f)

  }

  const signInHere = async () => {

    setSigningIn(true)

    try { const u = await passkeyLogin(); setUser(u); await pullState(); toast(t('Welcome back, {0}', u.name)) }

    catch (e) { if (e.name !== 'NotAllowedError' && e.name !== 'AbortError') toast(e.message || t('Sign-in failed')) }

    finally { setSigningIn(false) }

  }

  const registerHere = () => useUI.getState().openSheet(close => <RegisterInline close={close} setUser={setUser} setSigningIn={setSigningIn} pushState={pushState} pullState={pullState} toast={toast} />)

  const restoreProfile = () => useUI.getState().openSheet(close => <RestoreProfileInline close={close} user={user} setUser={setUser} replaceState={replaceState} pullState={pullState} toast={toast} />)

  // Ends the profile's sessions on every device — this one included, so on success it lands in

  // the same place as the plain sign-out above (home, local data cleared). On failure nothing

  // local is touched: still signed in here, and say so rather than leaving a half-signed-out app.

  const signOutEverywhere = () => confirmSheet({

    title: t('Sign out everywhere?'),

    message: t('Signs this profile out on every device, including this one. Your passkeys keep working — sign in with them again anytime.'),

    confirmText: t('Sign out everywhere'), danger: true,

    onConfirm: async () => {

      try { await signOutAll(); toast(t('Signed out on all devices')) }

      catch (e) { toast(t('Signed out on this device, but could not end sessions on other devices.')) }

      finally { nav('/home') }

    },

  })

  const deleteAccount = () => confirmSheet({
    title: t('Delete account?'),
    message: t('Delete account warning'),
    confirmText: t('Continue'), danger: true,
    onConfirm: () => confirmSheet({
      title: t('Delete account permanently?'),
      message: t('Delete account final confirmation'),
      confirmText: t('Delete my account'), danger: true,
      onConfirm: async () => {
        setAccountDeleting(true)
        try {
          await deleteSupabaseAccount()
          await completeAccountDeletion()
          nav('/login', { replace: true })
          showAccountNotice(t('Account deleted'), t('Account deleted confirmation'), true)
        } catch (e) {
          const message = t(e.message || 'Account deletion failed')
          const details = e.details ? `\n\n${t('Technical details')}: ${e.details}` : ''
          showAccountNotice(t('Account deletion failed'), `${message}${details}`)
        }
        finally { setAccountDeleting(false) }
      },
    }),
  })

  const confirmTutorial = () => confirmSheet({
    title: t('Open the tutorial?'),
    message: t('The usage guide will open so you can review the main parts of Gym Book Training.'),
    confirmText: t('Open tutorial'),
    onConfirm: openTutorial,
  })



  return <div className="narrow">

    <div className="hdr">

      <button className="iconbtn" onClick={() => nav('/home')} aria-label={t('Home')}><Icon name="chevronLeft" /></button>

      <div style={{ flex: 1, marginLeft: 10 }}><h1>{t('Settings')}</h1></div>

    </div>



    {/* ---------- general ---------- */}

    <Section title={t('General')} footer={t('Note: switching units only changes the label — logged numbers are not converted.')}>

      <SelectRow

        icon="globe" iconTint="var(--blue)" title={t('Language')}

        value={S.lang || 'en'} onChange={v => update(s => { s.lang = v })}

        options={Object.entries(LANGS).map(([k, name]) => ({

          value: k, label: name,

          subtitle: INSTR_LANGS.includes(k) ? null : t("Exercise instructions aren't available in this language yet — they stay in English."),

        }))}

      />

      <Row icon="moon" iconTint="var(--indigo)" title={t('Theme')}>

        <Segmented

          className="seg-inline"

          options={[{ value: 'dark', icon: 'moon', label: t('Dark') }, { value: 'light', icon: 'sun', label: t('Light') }]}

          value={S.theme === 'light' ? 'light' : 'dark'}

          onChange={v => update(s => { s.theme = v })}

        />

      </Row>

      <Row icon="scale" iconTint="var(--teal)" title={t('Weight unit')}>

        <Segmented className="seg-inline"

          options={[{ value: 'kg', label: 'kg' }, { value: 'lb', label: 'lb' }]}

          value={S.unit} onChange={v => update(s => { s.unit = v })} />

      </Row>

      <Row icon="volume" iconTint="var(--pink)" title={t('Sounds')}>
        <Switch checked={!!S.sound} onChange={v => update(s => { s.sound = v })} />
      </Row>

      {S.sound && <SelectRow icon="music" iconTint="var(--indigo)" title={t('Timer tones')}
        value={S.soundTone || 'classic'} options={TIMER_TONES.map(o => ({ ...o, label: t(o.label) }))}
        onChange={v => {
          update(s => { s.soundTone = v })
          playTimerTone(true, v, 'countdown')
        }} />}

      {ANDROID_APP && <Row icon="clock" iconTint="var(--teal)" title={t('Rest bubble over other apps')}
        subtitle={t('Show the movable rest timer when you switch to another app.')}>
        <Switch checked={!!S.restBubble} onChange={async enabled => {
          update(s => { s.restBubble = enabled })
          if (enabled) {
            await requestRestBubblePermission()
          }
        }} />
      </Row>}

      <Row icon="lightbulb" iconTint="var(--yellow)" title={t('Tutorial')}
        subtitle={t('Review the usage guide for Gym Book Training.')}
        accessory="chevron" onClick={confirmTutorial} />

    </Section>



    {/* ---------- during a workout ---------- */}

    <Section title={t('During a workout')} footer={wakeOK && S.keepAwake !== false ? t('The screen stays on while a workout is running, so you don’t have to unlock your phone between sets.') : null}>

      <SelectRow icon="timer" iconTint="var(--orange)" title={t('Rest timer')}

        value={S.restSec} onChange={v => update(s => { s.restSec = v })}

        options={Array.from({ length: 12 }, (_, i) => (i + 1) * 30).map(v => ({ value: v, label: fmtSec(v) }))} />

      <SelectRow icon="clock" iconTint="var(--teal)" title={t('Double-set rest')}
        value={S.sideRestSec ?? 30} onChange={v => update(s => { s.sideRestSec = v })}
        options={Array.from({ length: 6 }, (_, i) => (i + 1) * 30).map(v => ({ value: v, label: fmtSec(v) }))} />

      <Row icon="dumbbell" iconTint="var(--orange)" title={t('Approach set')}
        subtitle={t('Add a separate half-weight approach set to the first exercise of a workout.') }>
        <Switch checked={!!S.warmupEnabled} onChange={v => update(s => { s.warmupEnabled = v })} />
      </Row>

      {(wakeOK || !MOBILE) && (

        <Row icon="sun" iconTint="var(--yellow)" title={t('Keep screen awake')}

          subtitle={wakeOK ? null : t('Not supported in this browser.')}>

          <Switch checked={wakeOK && S.keepAwake !== false} disabled={!wakeOK}

            onChange={v => update(s => { s.keepAwake = v })} />

        </Row>

      )}

      {MOBILE && <Row icon="rotate" iconTint="var(--indigo)" title={t('Lock screen orientation')}
        subtitle={t('Keep the current screen direction while a workout is active.') }>
        <Switch checked={!!S.lockOrientation} onChange={v => update(s => { s.lockOrientation = v })} />
      </Row>}

      {/* Two names for the same judgement, so the column asks in the scale you already think in.

          The (i) sits before the control — you read it on the way to the choice, not after it. */}

	      <Row icon="flame" iconTint="var(--orange)" title={t('Effort per set')}>

        <button className="helpbtn" aria-label={t('What are RIR and RPE?')} onClick={effortHelpSheet}><Icon name="info" /></button>

        <Segmented className="seg-inline"

          options={[{ value: 'none', label: t('Off') }, { value: 'rir', label: t('RIR') }, { value: 'rpe', label: t('RPE') }]}

          value={effortOf(S)} onChange={v => update(s => { s.effort = v; delete s.showRir })} />

      </Row>

    </Section>



    {(user || MOBILE) && <NotificationsCard S={S} update={update} toast={toast} />}



    {/* ---------- appearance ---------- */}

    <Section title={t('Appearance')} footer={DEMO || MOBILE ? undefined : t('synced with your profile')}>

      {/* Purely how the muscle map is drawn — nothing else in the app reads this. */}

      <Row icon="figureStrength" iconTint="var(--teal)" title={t('Body diagram')}>

        <Segmented

          className="seg-inline"

          options={[{ value: 'male', label: t('Male') }, { value: 'female', label: t('Female') }]}

          value={S.body === 'female' ? 'female' : 'male'}

          onChange={v => update(s => { s.body = v })}

        />

      </Row>

      <div className="lrow" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12, paddingTop: 13, paddingBottom: 14 }}>

        <span className="lrow-t">{t('Accent color')}</span>

        {ACCENT_TONES.map(({ id, label }) => <div key={id} style={{ marginBottom: 10 }}>

          <div className="small dim" style={{ marginBottom: 8 }}>{t(label)}</div>

          <div className="swatches">

            {Object.entries(ACCENTS).filter(([, colors]) => colors.selectable !== false && colors.tone === id).map(([k, colors]) => {

              const selectedAccent = ACCENTS[S.accent]?.alias || (ACCENTS[S.accent] ? S.accent : 'lime')
              const labelText = `${t(colors.label)} · ${t(label)} · ${colors.color}`

              return <button key={k} className={'swatch' + (selectedAccent === k ? ' on' : '')}

                style={{ background: colors.swatch }} onClick={() => update(s => { s.accent = k })} aria-label={labelText} title={labelText} />

            })}

          </div>

        </div>)}

      </div>

    </Section>



    {/* ---------- account ---------- */}

    <Section title={MOBILE ? (user ? t('Account') : t('Your data')) : DEMO ? t('Demo') : t('Account')}>

      {MOBILE ? <>

        <Row icon={user ? 'personCircle' : 'phone'} iconTint={user ? 'var(--blue)' : 'var(--teal)'} title={user ? user.name : t('Local data on this phone')} subtitle={t('Workout data is stored on this phone. Finished workouts update an authorized server backup automatically.')} />
        {user
          ? <>
            <Row icon="sync" iconTint="var(--teal)" title={t('Server backup of workout data')}
              subtitle={t('Turning this off stops future uploads and blocks access to the existing server copy. The copy remains stored until you request deletion or delete your account.') }>
              <Switch checked={user.trainingDataConsent === true} disabled={trainingConsentBusy}
                onChange={updateTrainingConsent} />
            </Row>
            <Row icon="crown" iconTint="var(--yellow)" title={t('Manage subscription')} subtitle={t('View your plan, renewal date, payment method or cancellation options.')} accessory="chevron" onClick={manageSubscription} />
            <Row icon="signOut" iconTint="var(--red)" title={t('Sign out')} danger onClick={() => confirmSheet({ title: t('Sign out?'), message: t('Your progress stays on this phone. Cloud backup is not changed.'), confirmText: t('Sign out'), danger: true, onConfirm: async () => { await signOut(); nav('/home') } })} />
            <Row icon="trash" iconTint="var(--red)" title={t('Delete account')} subtitle={t('Permanently delete your account and its data.')} danger onClick={deleteAccount} />
          </>
          : <Row icon="person" iconTint="var(--blue)" title={t('Sign in')} subtitle={t('Sign in to back up or restore your progress manually.')} accessory="chevron" onClick={() => nav('/login')} />}

      </> : DEMO ? <>

    <Row icon="sparkles" iconTint="var(--yellow)" title={t('You’re in the demo')} subtitle={t('Example data, stored only in this browser — change anything you like.')} />

        <Row icon="reset" iconTint="var(--blue)" title={t('Reset demo data')} accessory="chevron"

          onClick={() => confirmSheet({ title: t('Reset demo data?'), message: t('Puts the example plan, workouts and weigh-ins back the way they started.'), confirmText: t('Reset'), onConfirm: () => { resetDemo(); nav('/home'); toast(t('Demo data reset')) } })} />

      </> : user ? <>

        <Row icon="personCircle" iconTint="var(--blue)" title={user.name}
          subtitle={user.trainingDataConsent === true
            ? t('Your profile and workout progress sync across devices.')
            : t('Workout data stays on this device until you enable server sync.')} />

        <Row icon="sync" iconTint="var(--teal)" title={t('Server sync of workout data')}
          subtitle={t('Authorize workout and body-weight data to sync with your Gymbook server. Turning this off stops sync and server restore.') }>
          <Switch checked={user.trainingDataConsent === true} disabled={trainingConsentBusy}
            onChange={updateTrainingConsent} />
        </Row>

        {user.admin && <Row icon="wrench" iconTint="var(--indigo)" title={t('Admin dashboard')} accessory="chevron" onClick={() => nav('/admin')} />}

        <Row icon="signOut" iconTint="var(--red)" title={t('Sign out')} danger onClick={() => confirmSheet({ title: t('Sign out?'), message: t('Your data is synced to your profile first, then cleared from this device.'), confirmText: t('Sign out'), danger: true, onConfirm: async () => { await signOut(); nav('/home') } })} />

        <Row icon="signOut" iconTint="var(--red)" title={t('Sign out everywhere')} subtitle={t('Ends this profile’s sessions on all your devices.')} danger onClick={signOutEverywhere} />
        <Row icon="trash" iconTint="var(--red)" title={t('Delete account')} subtitle={t('Permanently delete your account and its data.')} danger onClick={deleteAccount} />
      
      </> : (
        <Row
          icon="person"
          iconTint="var(--blue)"
          title={t('Sign in')}
          subtitle={t('Open the sign-in menu to access your profile.')}
          accessory="chevron"
          onClick={() => nav('/login')}
        />
      )}
    </Section>

    {!user && !DEMO && !MOBILE && <p className="sect-f" style={{ marginTop: -18, marginBottom: 22 }}>{t('Guest mode — data lives only in this browser.')}</p>}



    {/* ---------- data: fill it, bring things over, back it up, wipe it ---------- */}

    <Section title={t('Data')}>

      {MOBILE && user && <>
        <Row icon="upload" iconTint="var(--blue)" title={t('Back up to server')} subtitle={t('Save a copy now. Finished workouts also update it automatically.')} accessory={cloudBusy ? undefined : 'chevron'} onClick={cloudBusy ? undefined : backUpToCloud} />
        <Row icon="download" iconTint="var(--blue)" title={t('Restore from server')} subtitle={t('Replace this phone’s progress with your last server backup.')} accessory={cloudBusy ? undefined : 'chevron'} onClick={cloudBusy ? undefined : restoreCloudBackup} />
        <details className="data-more">
          <summary className="data-more-summary">
            <span className="lrow-i" style={{ '--tint': 'var(--label-2)' }}><Icon name="list" /></span>
            <span className="lrow-m"><span className="lrow-t">{t('More data options')}</span></span>
            <Icon name="chevronDown" className="data-more-chevron" />
          </summary>
          <div className="data-more-content">
            <Row icon="dumbbell" iconTint="var(--orange)" title={t('Load starter plan (PPL)')} accessory="chevron" onClick={confirmStarterPlan} />
            <Row icon="download" iconTint="var(--teal)" title={t('Import from another app')} subtitle={t('FitNotes, Strong, Hevy — or body weight from Apple Health')} accessory="chevron" onClick={() => importRef.current.click()} />
            <Row icon="download" iconTint="var(--blue)" title={t('Import backup')} accessory="chevron" onClick={() => fileRef.current.click()} />
            <Row icon="download" iconTint="var(--blue)" title={t('Export routines only')} accessory="chevron" onClick={() => confirmExport('routines')} />
            <Row icon="download" iconTint="var(--blue)" title={t('Export backup (JSON)')} accessory="chevron" onClick={confirmExport} />
            <Row icon="trash" iconTint="var(--red)" title={t('Reset everything')} danger onClick={() => confirmSheet({ title: t('Reset everything?'), message: t('Deletes your plan, workouts and body weight on this device. This cannot be undone.'), confirmText: t('Delete everything'), danger: true, onConfirm: () => { replaceState(JSON.parse(JSON.stringify(DEF)), true); nav('/home'); toast(t('All data reset')) } })} />
          </div>
        </details>
      </>}

      {!MOBILE && user && <Row icon="reset" iconTint="var(--blue)" title={t('Restore an imported profile')} subtitle={t('Use a one-time code from your previous Gym Book Training installation.')} accessory="chevron" onClick={restoreProfile} />}

      {!MOBILE && <Row icon="dumbbell" iconTint="var(--orange)" title={t('Load starter plan (PPL)')} accessory="chevron" onClick={confirmStarterPlan} />}

      {!MOBILE && <Row icon="download" iconTint="var(--teal)" title={t('Import from another app')}

        subtitle={t('FitNotes, Strong, Hevy — or body weight from Apple Health')}

        accessory="chevron" onClick={() => importRef.current.click()} />}

      {!MOBILE && <Row icon="download" iconTint="var(--blue)" title={t('Import backup')} accessory="chevron" onClick={() => fileRef.current.click()} />}

      {!MOBILE && <Row icon="download" iconTint="var(--blue)" title={t('Export routines only')} accessory="chevron" onClick={() => confirmExport('routines')} />}

      {!MOBILE && <Row icon="download" iconTint="var(--blue)" title={t('Export backup (JSON)')} accessory="chevron" onClick={confirmExport} />}

      {!MOBILE && <Row icon="trash" iconTint="var(--red)" title={t('Reset everything')} danger onClick={() => confirmSheet({ title: t('Reset everything?'), message: t('Deletes your plan, workouts and body weight on this device. This cannot be undone.'), confirmText: t('Delete everything'), danger: true, onConfirm: () => { replaceState(JSON.parse(JSON.stringify(DEF)), true); nav('/home'); toast(t('All data reset')) } })} />}

    </Section>

    <Section title={t('Social')}>
      {SOCIAL_LINKS.map(({ name, icon, tint, url }) => <Row key={name} icon={icon}
        iconTint={tint} title={t(name)}
        subtitle={url || t('Coming soon')}
        accessory={url ? 'chevron' : 'none'} onClick={url ? () => openSocialLink(url) : undefined} />)}
    </Section>

    <Section title={t('Legal')}>

      {DOCS.map(doc => <Row key={doc.id} icon={doc.icon} iconTint={DOC_TINT[doc.id]} title={t(doc.title)} accessory="chevron"

        onClick={() => nav(`/legal/${doc.id}`, { state: { from: '/settings', returnState: { restoreScrollY: window.scrollY } } })} />)}

    </Section>

    <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={doImport} />

    {/* Reset after reading so picking the same file twice still fires onChange. */}

    <input ref={importRef} type="file" accept=".csv,.xml,text/csv,text/xml" style={{ display: 'none' }}

      onChange={ev => { const f = ev.target.files[0]; if (f) importFromApp(f); ev.target.value = '' }} />



    {/* "Add to Home screen" makes no sense inside the native app */}

    {!MOBILE && <Section title={t('Tip')}>

      <Row icon="lightbulb" iconTint="var(--yellow)"

        title={IS_ANDROID ? t('In Chrome: ⋮ menu → Add to Home screen') : t('In Safari: Share → Add to Home Screen')}

        subtitle={t('to install Gym Book Training as a full-screen app.') + ' ' + (user ? t('Your data syncs with your profile — sign in anywhere to see it.') : t('Guest data stays on this device — export a backup now and then!'))} />

    </Section>}



    {cloudBusy && <div className="app-loading-overlay">
      <div className="loading-mark" role="status" aria-label={t('Loading data...')}>
        <Icon name="dumbbell" />
        <div className="loading-label">{t('Loading data...')}</div>
      </div>
    </div>}

    {accountDeleting && <div className="app-loading-overlay">
      <div className="loading-mark" role="status" aria-label={t('Deleting account...')}>
        <Icon name="dumbbell" />
        <div className="loading-label">{t('Deleting account...')}</div>
      </div>
    </div>}

    <div className="dim small" style={{ textAlign: 'center', marginTop: 4, lineHeight: 1.6 }}>

      Gym Book Training · {t('Your workouts are stored on this device')}<br />

      exercise data: hasaneyldrm/exercises-dataset (CC)

    </div>

  </div>

}



// The whole point is that the two scales are one judgement counted from opposite ends, and a

// paragraph is a bad way to say that — the conversion table shows it in one look. Reading down

// a column is the answer to "what do I put here", so the numbers get their own aligned columns.

const EFFORT_ROWS = [

  ['0', '10', 'No more reps possible with good form — muscular failure'],

  ['1', '9', 'Could do 1 more rep'],

  ['2', '8', 'Could do 2 more reps'],

  ['3', '7', 'Could do 3 more reps'],

  ['4+', '≤6', 'Could do 4 or more reps; light effort'],

]

// RIR 2 / RPE 8: the row a working set usually lands on — the anchor the others are read

// against. Not where the stepper starts; + walks up from the bottom of the scale.

const EFFORT_TYPICAL = 2



function effortHelpSheet() {

  useUI.getState().openSheet(close => <>

    <h3>{t('Effort per set')}</h3>

    <div className="muted small" style={{ lineHeight: 1.5 }}>

      {t('After a set, note how it ended: how many more reps you could do (RIR), or how hard it felt (RPE).')}

    </div>

    <div className="efftbl">

      <div className="r hd"><span className="n">{t('RIR')}</span><span className="n">{t('RPE')}</span><span className="f">{t('What it means')}</span></div>

      {EFFORT_ROWS.map(([rir, rpe, feel], i) => (

        <div key={rir} className={'r' + (i === EFFORT_TYPICAL ? ' on' : '')}>

          <span className="n">{rir}</span><span className="n">{rpe}</span><span className="f">{t(feel)}</span>

        </div>

      ))}

    </div>

    <div className="dim small" style={{ lineHeight: 1.5, display: 'grid', gap: 8 }}>

      <div>{t('RIR (reps in reserve) estimates how many more reps you could do before muscular failure. RPE (rate of perceived exertion) rates how hard the set felt from 1 to 10: RPE 10 is maximum effort, and RPE 8 means you could do about 2 more reps. For example, that set can be logged as RIR 2 or RPE 8.')}</div>

      <div>{t('The highlighted row is where most working sets land. Sets you have already logged keep their own scale, and nothing else reads the value — progression and estimated 1RM are unaffected.')}</div>

    </div>

    <div style={{ height: 8 }} />

  </>)

}



function NotificationsCard({ S, update, toast }) {

  if (MOBILE) return <MobileReminderCard S={S} update={update} toast={toast} />

  return <PushCard S={S} update={update} toast={toast} />

}



// Mobile build: the reminder is a native local notification scheduled on planned weekdays —

// no push server involved. The store resyncs only when schedule inputs change;

// this card only owns the OS permission prompt when the switch turns on.

function MobileReminderCard({ S, update, toast }) {

  const setReminder = patch => update(s => { s.reminder = { ...(s.reminder || DEF.reminder), ...patch, tz: localTZ() } })

  const toggle = async () => {

    const on = !S.reminder?.on

    if (on) {

      const ok = await syncReminder({ ...S, reminder: { ...(S.reminder || DEF.reminder), on: true } }, true)

      if (!ok) { toast(t('Could not change notification settings')); return }

    }

    setReminder({ on })

  }

  return (

    <Section title={t('Notifications')}

      footer={S.reminder?.on ? t('Reminds you at this time on days that have a routine planned.') : null}>

      <Row icon="calendar" iconTint="var(--orange)" title={t('Workout day reminder')}>

        <Switch checked={!!S.reminder?.on} onChange={toggle} />

      </Row>

      {S.reminder?.on && (

        <Row icon="clock" iconTint="var(--purple)" title={t('Reminder time')}>

          <input type="time" className="timef" value={S.reminder?.time || DEF.reminder.time}

            onChange={e => setReminder({ time: e.target.value })} />

        </Row>

      )}

    </Section>

  )

}



function PushCard({ S, update, toast }) {

  const [on, setOn] = useState(false)

  const [busy, setBusy] = useState(false)

  const supported = pushSupported()



  useEffect(() => {

    if (!supported) return

    navigator.serviceWorker.ready.then(reg => reg.pushManager.getSubscription()).then(sub => setOn(!!sub)).catch(() => {})

  }, [supported])



  const toggle = async v => {

    setBusy(true)

    try {

      if (!v) { await disablePush(); setOn(false); toast(t('Notifications off')) }

      else { await enablePush(); setOn(true); toast(t('Notifications on')) }

    } catch (e) { toast(e.message || t('Could not change notification settings')) }

    setBusy(false)

  }

  const test = async () => {

    try { await sendTestPush(); toast(t('Test sent — should arrive any second')) }

    catch (e) { toast(e.message || t('Test failed')) }

  }



  if (!supported) return (

    <Section title={t('Notifications')}>

      <Row icon="bellSlash" iconTint="var(--grey)" title={t('Not supported in this browser.')} />

    </Section>

  )



  return <>

    <Section

      title={t('Notifications')}

      footer={on && S.reminder?.on

        ? t("Only sent on days you have a routine planned and haven't logged a workout yet.") +

          (S.reminder?.tz ? ' ' + t('Timezone: {0} (auto-detected, updates if you travel).', S.reminder.tz) : '')

        : null}

    >

      <Row icon="bell" iconTint="var(--blue)" title={t('Push notifications')} subtitle={t('Rest-timer alerts, even if Gym Book Training is closed.')}>

        <Switch checked={on} disabled={busy} onChange={toggle} />

      </Row>

      {on && (

        <Row icon="calendar" iconTint="var(--orange)" title={t('Workout day reminder')}>

          <Switch checked={!!S.reminder?.on} onChange={() => update(s => { s.reminder = { ...(s.reminder || DEF.reminder), on: !s.reminder?.on, tz: localTZ() } })} />

        </Row>

      )}

      {on && S.reminder?.on && (

        <Row icon="clock" iconTint="var(--purple)" title={t('Reminder time')}>

          <input type="time" className="timef" value={S.reminder?.time || DEF.reminder.time}

            onChange={e => update(s => { s.reminder = { ...(s.reminder || DEF.reminder), time: e.target.value, tz: localTZ() } })} />

        </Row>

      )}

    </Section>

    {on && <div style={{ marginTop: -12, marginBottom: 22 }}><Button size="sm" icon="bell" onClick={test}>{t('Send test notification')}</Button></div>}

  </>

}



function RestoreProfileInline({ close, user, setUser, replaceState, pullState, toast }) {

  const [code, setCode] = useState('')

  const [busy, setBusy] = useState(false)

  const [confirming, setConfirming] = useState(false)

  const restore = async () => {

    const recoveryCode = code.trim().toUpperCase()

    if (!recoveryCode) { toast(t('Enter your one-time recovery code')); return }

    setBusy(true)

    try {

      const session = await getAuthSession()

      if (!session?.access_token) throw new Error(t('Please sign in again, then retry profile recovery.'))

      // Preserve the currently signed-in profile on the server before switching its mapping.

      await api('/api/data', { method: 'PUT', body: JSON.stringify({ state: useStore.getState().S }) })

      localStorage.removeItem('gym_dirty')

      const result = await createAppSessionWithSupabase(session.access_token, recoveryCode)

      const { user: recoveredUser, state } = result

      localStorage.removeItem('gym_dirty')

      setUser(recoveredUser)

      replaceState(JSON.parse(JSON.stringify(DEF)), false)

      await pullState(state, Object.hasOwn(result, 'state'), true)

      close()

      toast(t('Previous profile restored'))

    } catch (e) {

      toast(e.message || t('Could not restore this profile. Check the code and try again.'))

    } finally { setBusy(false) }

  }

  return <>

    <h3>{t('Restore an imported profile')}</h3>

    <div className="muted small" style={{ lineHeight: 1.55, margin: '12px 0 16px' }}>

      {t('Enter the one-time code created when your previous Gym Book Training data was imported. This switches {0} to that profile. Your current profile and its data remain saved.', user?.name || t('this account'))}

    </div>

    <TextField type="password" autoComplete="off" placeholder={t('One-time recovery code')} maxLength={40} value={code}

      onChange={e => setCode(e.target.value.toUpperCase())} aria-label={t('One-time recovery code')} />

    <div style={{ height: 12 }} />

    {confirming && <div className="muted small" style={{ lineHeight: 1.5, margin: '0 0 12px' }}>

      {t('Your current profile is saved before switching to the imported profile.')}

    </div>}

    <Button variant="primary" disabled={busy} onClick={confirming ? restore : () => setConfirming(true)}>

      {busy ? t('Please wait…') : confirming ? t('Confirm restore') : t('Restore profile')}

    </Button>

    <Button variant="ghost" disabled={busy} onClick={confirming ? () => setConfirming(false) : close}>{confirming ? t('Back') : t('Cancel')}</Button>

  </>

}



// The same registration as the sign-in screen's, reached from Settings instead. It asks for

// the invite code on the same terms: an invite-only instance rejects a registration without

// one, so a form that cannot collect it is a form that cannot succeed.

function RegisterInline({ close, setUser, setSigningIn, pushState, pullState, toast }) {

  const nameRef = useRef(null)

  const [code, setCode] = useState('')

  const [inviteOnly, setInviteOnly] = useState(false)

  useEffect(() => { if (!MOBILE) api('/api/config').then(c => setInviteOnly(!!c.invite_only)).catch(() => {}) }, [])

  const go = async () => {

    const n = (nameRef.current.value || '').trim()

    if (!n) { toast(t('Enter a name')); return }

    if (inviteOnly && !code.trim()) { toast(t('An invite code is required')); return }

    setSigningIn(true)

    try {

      const u = await passkeyRegister(n, code.trim()); setUser(u); close()

      if (hasData(useStore.getState().S)) { await pushState(true); toast(t('Profile created — data moved into it')) }

      else { await pullState(); toast(t('Welcome, {0}', u.name)) }

    } catch (e) { if (e.name !== 'NotAllowedError' && e.name !== 'AbortError') toast(e.message || t('Registration failed')) }

    finally { setSigningIn(false) }

  }

  return <>

    <h3>{t('Create your profile')}</h3>

    <div className="muted small" style={{ marginBottom: 14 }}>{t('Pick a name, then confirm with your device.')}</div>

    <TextField ref={nameRef} placeholder={t('Your name')} maxLength={40} />

    {inviteOnly && <>

      <div style={{ height: 10 }} />

      <input className="input" placeholder={t('Invite code')} maxLength={40} value={code}

        onChange={e => setCode(e.target.value.toUpperCase())} style={{ letterSpacing: '.14em', fontWeight: 600, textAlign: 'center' }} />

      <div className="dim small" style={{ marginTop: 6 }}>{t('This app is invite-only — enter the code you were given.')}</div>

    </>}

    <div style={{ height: 12 }} /><Button variant="primary" onClick={go}>{t('Create passkey')}</Button>

  </>

}
