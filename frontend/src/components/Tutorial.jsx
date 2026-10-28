import { useState } from 'react'
import { t } from '../lib/i18n.js'
import { useUI } from '../store/useUI.js'
import { useStore } from '../store/useStore.js'
import { getAuthSession, updateAuthUserMetadata } from '../lib/supabaseAuth.js'
import { api } from '../lib/api.js'
import { Button } from './ui.jsx'
import Icon from './Icon.jsx'

const GUIDE = [
  { icon: 'house', nav: 'Home', title: 'Start on Home', text: 'Home is your dashboard. The next-workout card shows what you planned for today. Tap it to begin, or use the bottom bar to move around.', hint: 'Your weekly schedule and routines are under Plan.' },
  { icon: 'calendar', nav: 'Plan', title: 'Build your weekly plan', text: 'In Plan, create a routine, add exercises, then assign it to one or more days. Your scheduled workout will appear on Home.', hint: 'Use Load starter plan if you want a ready-made example to edit.' },
  { icon: 'list', nav: 'Exercises', title: 'Find and choose exercises', text: 'In Library, search by name or filter by muscle and equipment. Tap the star to save a favorite, or add an exercise to a routine.', hint: 'You can also create your own exercise from the Library screen.' },
  { icon: 'dumbbell', nav: 'Start', title: 'Start and log a workout', text: 'Tap the center button marked Start. Choose today’s planned routine or a free workout. In the session, adjust weight and reps, then tap a set’s circle when you finish it.', hint: 'Completing a set starts the rest timer. Timed and cardio exercises show their own timer fields.' },
  { icon: 'chart', nav: 'Stats', title: 'Save your session and track progress', text: 'Tap Finish workout to save the session. Stats shows your progress and records; History opens the details of past workouts.', hint: 'Settings lets you change language, units, appearance and training options. Reopen this guide there any time.' },
]

export const tutorialSeenKey = userId => `gymbook_tutorial_seen_v1_${userId}`

export function openTutorial() {
  return useUI.getState().openSheet(close => <Tutorial close={close} />, { kind: 'full', locked: true })
}

export default function Tutorial({ close }) {
  const [index, setIndex] = useState(0)
  const step = GUIDE[index]
  const finish = () => {
    const user = useStore.getState().user
    const seenAt = user?.tutorialSeenAt || new Date().toISOString()
    if (user?.id) localStorage.setItem(tutorialSeenKey(user.id), seenAt)
    if (user) useStore.getState().setUser({ ...user, tutorialSeenAt: seenAt })
    close()
    if (!user?.id) return
    void (async () => {
      const session = await getAuthSession()
      if (session?.user) {
        const metadata = session.user.user_metadata || {}
        if (!metadata.gymbook_tutorial_seen_at) {
          await updateAuthUserMetadata({ ...metadata, gymbook_tutorial_seen_at: seenAt })
        }
        return
      }
      await api('/api/tutorial/seen', { method: 'PUT', body: '{}' })
    })().catch(() => {})
  }
  return <div className="tutorial-shell">
    <div className="sheet-full-head tutorial-header">
      <div className="tutorial-title-wrap">
        <div className="tutorial-kicker">{t('USAGE GUIDE')}</div>
        <h3 className="tutorial-heading">{t('Get to know Gym Book Training')}</h3>
      </div>
      <button type="button" className="iconbtn tutorial-close" onClick={finish} aria-label={t('Close tutorial')}><Icon name="xmark" /></button>
    </div>

    <div className="tutorial-content">
      <div className="tutorial-counter">{t('Guide {0} of {1}', index + 1, GUIDE.length)}</div>
      <div className="tutorial-route">
        <span className="tutorial-route-icon"><Icon name={step.icon} /></span>
        <span>{t('In this part')}</span>
        <strong>{t(step.nav)}</strong>
      </div>
      <div className="tutorial-info-card">
        <div className="tutorial-step-icon"><Icon name={step.icon} size={30} /></div>
        <h2>{t(step.title)}</h2>
        <p>{t(step.text)}</p>
        <div className="tutorial-hint"><Icon name="info" size={16} /><span>{t(step.hint)}</span></div>
      </div>
      <div className="tutorial-dots" aria-label={t('Guide {0} of {1}', index + 1, GUIDE.length)}>
        {GUIDE.map((item, i) => <span key={item.title} className={i === index ? 'active' : i < index ? 'done' : ''} />)}
      </div>
    </div>

    <div className="tutorial-footer">
      {index > 0 ? <Button variant="ghost" icon="chevronLeft" onClick={() => setIndex(i => i - 1)}>{t('Previous')}</Button> : <span />}
      {index < GUIDE.length - 1
        ? <Button variant="primary" trailingIcon="chevronRight" onClick={() => setIndex(i => i + 1)}>{t('Next')}</Button>
        : <Button variant="primary" icon="check" onClick={finish}>{t('Got it')}</Button>}
    </div>
  </div>
}
