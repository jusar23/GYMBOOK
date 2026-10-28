import { useState } from 'react'
import { t } from '../lib/i18n.js'
import { useUI } from '../store/useUI.js'
import { Button } from './ui.jsx'
import Icon from './Icon.jsx'

const GUIDE = [
  { icon: 'house', nav: 'Home', title: 'guide.home.title', text: 'guide.home.text', hint: 'guide.home.hint' },
  { icon: 'calendar', nav: 'Plan', title: 'guide.plan.title', text: 'guide.plan.text', hint: 'guide.plan.hint' },
  { icon: 'list', nav: 'Exercises', title: 'guide.exercises.title', text: 'guide.exercises.text', hint: 'guide.exercises.hint' },
  { icon: 'dumbbell', nav: 'Start', title: 'guide.start.title', text: 'guide.start.text', hint: 'guide.start.hint' },
  { icon: 'plus', nav: 'Add exercise', title: 'guide.add.title', text: 'guide.add.text', hint: 'guide.add.hint' },
  { icon: 'checkCircle', nav: 'Reps', title: 'guide.log.title', text: 'guide.log.text', hint: 'guide.log.hint' },
  { icon: 'check', nav: 'Finish workout', title: 'guide.finish.title', text: 'guide.finish.text', hint: 'guide.finish.hint' },
  { icon: 'chart', nav: 'Stats', title: 'guide.stats.title', text: 'guide.stats.text', hint: 'guide.stats.hint' },
  { icon: 'history', nav: 'History', title: 'guide.history.title', text: 'guide.history.text', hint: 'guide.history.hint' },
  { icon: 'gear', nav: 'Settings', title: 'guide.settings.title', text: 'guide.settings.text', hint: 'guide.settings.hint' },
]

export const tutorialSeenKey = userId => `gymbook_tutorial_seen_v1_${userId}`

export function openTutorial() {
  return useUI.getState().openSheet(close => <Tutorial close={close} />, { kind: 'full', locked: true })
}

export default function Tutorial({ close }) {
  const [index, setIndex] = useState(0)
  const step = GUIDE[index]
  return <div className="tutorial-shell">
    <div className="sheet-full-head tutorial-header">
      <div className="tutorial-title-wrap">
        <div className="tutorial-kicker">{t('USAGE GUIDE')}</div>
        <h3 className="tutorial-heading">{t('Get to know Gym Book Training')}</h3>
      </div>
      <button type="button" className="iconbtn tutorial-close" onClick={close} aria-label={t('Close tutorial')}><Icon name="xmark" /></button>
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
        : <Button variant="primary" icon="check" onClick={close}>{t('Got it')}</Button>}
    </div>
  </div>
}
