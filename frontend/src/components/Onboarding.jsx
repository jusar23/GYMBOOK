import { useMemo, useState } from 'react'
import { EXDB } from '../lib/exercises.js'
import { makeRecommendedPlan } from '../lib/routine-recommendation.js'
import { t } from '../lib/i18n.js'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { Button } from './ui.jsx'
import Icon from './Icon.jsx'
import { openTutorial, tutorialSeenKey } from './Tutorial.jsx'

const STEPS = [
  { title: 'Which days can you train?', subtitle: 'Choose the days you want to set aside for exercise.', icon: 'calendar' },
  { title: 'How long is each workout?', subtitle: 'Pick the time you usually have for one session.', icon: 'clock' },
  { title: 'What is your main goal?', subtitle: 'We will shape the workout mix around what matters to you.', icon: 'target' },
  { title: 'What equipment do you have?', subtitle: 'Choose everything you can use. Bodyweight exercises are always included.', icon: 'dumbbell' },
  { title: 'Your profile', subtitle: 'We use your age to set a sensible starting volume.', icon: 'figureStrength' },
  { title: 'Your recommended plan', subtitle: 'We will save these routines and place them on your selected days.', icon: 'sparkles' },
]

const DAY_OPTIONS = [
  { day: 1, label: 'L', title: 'Monday' }, { day: 2, label: 'M', title: 'Tuesday' },
  { day: 3, label: 'M', title: 'Wednesday' }, { day: 4, label: 'J', title: 'Thursday' },
  { day: 5, label: 'V', title: 'Friday' }, { day: 6, label: 'S', title: 'Saturday' },
  { day: 0, label: 'D', title: 'Sunday' },
]

const GOALS = [
  { value: 'lose', icon: 'figureRun', title: 'Lose weight', description: 'Strength work with a little more conditioning.' },
  { value: 'gain', icon: 'dumbbell', title: 'Build muscle', description: 'Focus on steady strength and muscle growth.' },
  { value: 'both', icon: 'target', title: 'Both', description: 'A balanced mix of strength and conditioning.' },
]

const EQUIPMENT = [
  { value: 'dumbbells', title: 'Dumbbells', icon: 'dumbbell' },
  { value: 'barbell', title: 'Barbell', icon: 'barbell' },
  { value: 'bands', title: 'Resistance bands', icon: 'figureStrength' },
  { value: 'machines', title: 'Machines and cables', icon: 'machine' },
  { value: 'kettlebells', title: 'Kettlebells', icon: 'kettlebell' },
]

export const onboardingSeenKey = userId => `gymbook_onboarding_v1_${userId}`

export function openOnboarding() {
  return useUI.getState().openSheet(close => <Onboarding close={close} />, { kind: 'full', locked: true })
}

function ChoiceButton({ active, icon, children, onClick, className = '', ...props }) {
  return <button type="button" className={`setup-choice${active ? ' selected' : ''}${className ? ` ${className}` : ''}`} aria-pressed={active} onClick={onClick} {...props}>
    {icon && <span className="setup-choice-icon"><Icon name={icon} /></span>}
    <span className="setup-choice-copy">{children}</span>
    {active && <Icon name="check" className="setup-choice-check" />}
  </button>
}

function Onboarding({ close }) {
  const user = useStore(state => state.user)
  const S = useStore(state => state.S)
  const update = useStore(state => state.update)
  const [stepIndex, setStepIndex] = useState(0)
  const [days, setDays] = useState([1, 3, 5])
  const [minutes, setMinutes] = useState(45)
  const [goal, setGoal] = useState('both')
  const [equipment, setEquipment] = useState([])
  const [body, setBody] = useState(S.body === 'female' ? 'female' : 'male')
  const [saving, setSaving] = useState(false)
  const age = user?.age ?? null
  const currentStep = STEPS[stepIndex]
  const plan = useMemo(() => makeRecommendedPlan({
    days, minutes, goal, equipment, age, userId: user?.id || '',
  }), [days, minutes, goal, equipment, age, user?.id])

  const toggleDay = day => setDays(current => current.includes(day)
    ? current.filter(value => value !== day)
    : [...current, day])
  const toggleEquipment = value => setEquipment(current => current.includes(value)
    ? current.filter(item => item !== value)
    : [...current, value])
  const closeWithTour = () => {
    close()
    const user = useStore.getState().user
    const seen = user?.tutorialSeenAt || (user?.id && localStorage.getItem(tutorialSeenKey(user.id)))
    if (!seen) window.setTimeout(() => openTutorial(), 180)
  }
  const skip = () => {
    if (user?.id) localStorage.setItem(onboardingSeenKey(user.id), 'skipped')
    closeWithTour()
  }
  const savePlan = () => {
    if (!user?.id || !plan.routines.length || saving) return
    setSaving(true)
    try {
      update(state => {
        state.routines.push(...plan.routines)
        state.week = { ...state.week, ...plan.week }
        state.body = body
      })
      localStorage.setItem(onboardingSeenKey(user.id), 'completed')
      useUI.getState().toast(t('Your plan is ready. You can edit it any time from Plan.'))
      closeWithTour()
    } catch {
      useUI.getState().toast(t('Could not save your plan. Please try again.'))
      setSaving(false)
    }
  }

  return <div className="setup-shell">
    <header className="setup-header">
      <div className="setup-brand"><span className="setup-brand-icon"><Icon name="dumbbell" /></span><span>GYMBOOK</span></div>
      <button type="button" className="iconbtn setup-close" onClick={close} aria-label={t('Close setup')}><Icon name="xmark" /></button>
    </header>

    <div className="setup-progress" aria-label={t('Setup {0} of {1}', stepIndex + 1, STEPS.length)}>
      <span style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }} />
    </div>

    <main className="setup-content">
      <div className="setup-step-count">{t('SETUP')} · {t('Step {0} of {1}', stepIndex + 1, STEPS.length)}</div>
      <div className="setup-heading-icon"><Icon name={currentStep.icon} /></div>
      <h1>{t(currentStep.title)}</h1>
      <p className="setup-subtitle">{t(currentStep.subtitle)}</p>

      {stepIndex === 0 && <>
        <div className="setup-weekdays" role="group" aria-label={t('Training days')}>
          {DAY_OPTIONS.map(option => {
            const active = days.includes(option.day)
            return <button key={option.day} type="button" className={`setup-weekday${active ? ' selected' : ''}`}
              aria-pressed={active} aria-label={t(option.title)} title={t(option.title)} onClick={() => toggleDay(option.day)}>
              <span>{option.label}</span><small>{t(option.title).slice(0, 3)}</small>
            </button>
          })}
        </div>
        <div className="setup-selection-note">{t('Days selected: {0}', days.length)}</div>
      </>}

      {stepIndex === 1 && <div className="setup-duration-picker">
        <div className="setup-duration-current"><Icon name="clock" /><div><strong>{t('{0} min each', minutes)}</strong><small>{t('minutes per workout')}</small></div></div>
        <input className="setup-duration-range" type="range" min="15" max="180" step="15" value={minutes}
          style={{ '--duration-progress': `${((minutes - 15) / 165) * 100}%` }}
          aria-label={t('How long is each workout?')} onChange={event => setMinutes(Number(event.target.value))} />
        <div className="setup-duration-scale"><span>{t('{0} min each', 15)}</span><span>{t('Up to 3 hours')}</span></div>
      </div>}

      {stepIndex === 2 && <div className="setup-choice-list">
        {GOALS.map(option => <ChoiceButton key={option.value} active={goal === option.value} icon={option.icon} onClick={() => setGoal(option.value)}>
          <strong>{t(option.title)}</strong><small>{t(option.description)}</small>
        </ChoiceButton>)}
      </div>}

      {stepIndex === 3 && <div className="setup-equipment-grid">
        <ChoiceButton active={equipment.length === 0} icon="figureStrength" className="setup-equipment" onClick={() => setEquipment([])}>
          <strong>{t('No equipment')}</strong><small>{t('Bodyweight only')}</small>
        </ChoiceButton>
        {EQUIPMENT.map(option => <ChoiceButton key={option.value} active={equipment.includes(option.value)} icon={option.icon} className="setup-equipment" onClick={() => toggleEquipment(option.value)}>
          <strong>{t(option.title)}</strong>
        </ChoiceButton>)}
      </div>}

      {stepIndex === 4 && <div className="setup-profile">
        <div className="setup-age-card">
          <Icon name="calendar" />
          <div><strong>{age ? t('Age: {0}', age) : t('Age unavailable')}</strong><small>{t(age ? 'Age adjusts the starting number of sets.' : 'We will use a general starting volume for this plan.')}</small></div>
        </div>
        <div className="setup-profile-label">{t('Are you male or female?')}</div>
        <div className="setup-profile-options">
          {['male', 'female'].map(value => <button type="button" key={value} className={`setup-profile-option${body === value ? ' selected' : ''}`}
            aria-pressed={body === value} onClick={() => setBody(value)}>
            <span className="setup-profile-figure"><Icon name={value === 'female' ? 'figureStrength' : 'arm'} /></span>
            <strong>{t(value === 'female' ? 'Female' : 'Male')}</strong>
            {body === value && <Icon name="check" className="setup-choice-check" />}
          </button>)}
        </div>
        <div className="setup-profile-note">{t('This setting also selects matching exercise demonstrations.')}</div>
      </div>}

      {stepIndex === 5 && <div className="setup-plan-preview">
        <div className="setup-summary-tags">
          <span><Icon name="calendar" />{t('{0} days / week', days.length)}</span>
          <span><Icon name="clock" />{t('{0} min each', minutes)}</span>
          <span><Icon name="target" />{t(GOALS.find(option => option.value === goal)?.title || 'Both')}</span>
        </div>
        {days.length === 7 && <div className="setup-recovery-note"><Icon name="info" />{t('Your seventh session is lighter to leave room for recovery.')}</div>}
        <div className="setup-routine-list">
          {plan.routines.map(routine => <section className="setup-routine-card" key={routine.id}>
            <div className="setup-routine-head"><span><Icon name={routine.emoji} /></span><strong>{t(routine.name)}</strong><small>{t('{0} exercises', routine.ex.length)}</small></div>
            <ul>{routine.ex.slice(0, 5).map((exercise, index) => <li key={`${routine.id}-${exercise.id}-${index}`}>
              <span>{tExerciseName(exercise.id)}</span><small>{exercise.sets} × {exercise.reps || exercise.min + ' min'}</small>
            </li>)}</ul>
          </section>)}
        </div>
        <div className="setup-save-note"><Icon name="checkCircle" /><span>{t('The routines will be saved to Plan and assigned to your selected days')} {t('After this, a short tour will explain each section of the app.')}</span></div>
      </div>}
    </main>

    <footer className="setup-footer">
      <Button variant="ghost" className="setup-skip" onClick={skip}>{t('Skip setup')}</Button>
      <div className="setup-footer-actions">
        {stepIndex > 0 && <Button variant="ghost" icon="chevronLeft" onClick={() => setStepIndex(index => index - 1)}>{t('Back')}</Button>}
        {stepIndex < STEPS.length - 1
          ? <Button variant="primary" trailingIcon="chevronRight" disabled={stepIndex === 0 && days.length === 0} onClick={() => setStepIndex(index => index + 1)}>{t('Continue')}</Button>
          : <Button variant="primary" icon="check" disabled={!plan.routines.length || saving} onClick={savePlan}>{t('Create my plan')}</Button>}
      </div>
    </footer>
  </div>
}

const exerciseNames = Object.fromEntries(EXDB.map(exercise => [exercise.id, exercise.n]))

function tExerciseName(id) {
  const plan = useStore.getState().S
  const exercise = plan.customEx?.find(item => item.id === id)
  if (exercise?.n) return exercise.n
  return exerciseNames[id] || t('Exercise')
}

export default Onboarding
