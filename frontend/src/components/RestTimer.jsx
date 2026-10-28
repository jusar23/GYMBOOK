import { useEffect } from 'react'
import { useUI } from '../store/useUI.js'
import { useStore } from '../store/useStore.js'
import { listenRestNotificationEvents } from '../lib/mobile.js'
import { playTimerTone } from '../lib/sound.js'
import { t } from '../lib/i18n.js'
import { Button, NumberField } from './ui.jsx'
import { modeOf, effortOf, EFFORT, capEffort, stepEffort, isBw, usesPairedSides } from '../lib/history.js'
import { convertWeight } from '../lib/units.js'
import { fmtNum } from '../lib/format.js'
import { EXIDX } from '../lib/exercises.js'
import Icon from './Icon.jsx'

const clock = sec => Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0')

function RecentSetMetrics() {
  const recent = useUI(s => s.recentSet)
  const active = useStore(s => s.S.active)
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const entry = recent && active?.entries[recent.entryIdx]
  const set = entry?.sets[recent.setIdx]
  if (!entry || !set || !set.done) return null
  const cfg = { ...(entry.target || {}), id: entry.id }
  const mode = modeOf(cfg)
  const effort = effortOf(S)
  const fields = mode === 'cardio'
    ? [{ key: 'min', label: t('Duration (min)'), decimal: false, step: 1 }, { key: 'speed', label: t('Speed (km/h)'), decimal: true, step: 0.5 }]
    : mode === 'time'
      ? [{ key: 'sec', label: t('Seconds'), decimal: false, step: 5 }, { key: 'w', label: t(isBw(cfg) ? 'Added / assistance ({0})' : 'Weight ({0})', entry.weightUnit || S.unit), decimal: true, step: (entry.weightUnit || S.unit) === 'lb' ? 5 : 2.5 }]
      : [
        { key: 'w', label: t(isBw(cfg) ? 'Added / assistance ({0})' : 'Weight ({0})', entry.weightUnit || S.unit), decimal: true, step: (entry.weightUnit || S.unit) === 'lb' ? 5 : 2.5 },
        { key: 'r', label: t(usesPairedSides(cfg) ? 'Reps per side' : 'Reps'), decimal: false, step: 1 },
        ...(effort ? [{ key: EFFORT[effort].f, label: EFFORT[effort].hd, decimal: effort !== 'rpe', step: EFFORT[effort].step }] : []),
      ]
  const change = (key, value) => update(state => {
    const target = state.active?.entries[recent.entryIdx]?.sets[recent.setIdx]
    if (!target) return
    const next = key === 'rpe' ? capEffort('rpe', value) : value
    if (next == null) delete target[key]
    else target[key] = key === 'w' ? convertWeight(next, entry.weightUnit || S.unit, S.unit) : next
  }, true)
  const bump = (field, direction) => {
    if (field.key === 'rir' || field.key === 'rpe') { change(field.key, stepEffort(field.key, set[field.key], direction)); return }
    const current = field.key === 'w'
      ? convertWeight(Number(set.w) || 0, S.unit, entry.weightUnit || S.unit)
      : Number(set[field.key]) || 0
    const next = Math.round((current + direction * field.step) * 100) / 100
    change(field.key, field.key === 'w' && isBw(cfg) ? next : Math.max(0, next))
  }
  const value = (key) => key === 'w' ? fmtNum(convertWeight(set.w || 0, S.unit, entry.weightUnit || S.unit)) : set[key] ?? ''
  return <div className="recent-set-metrics" aria-label={t('Edit last set')}>
    <div className="recent-set-title">{t('Last set')}: <span>{EXIDX[entry.id]?.n || entry.id}</span></div>
    <div className={'recent-set-fields' + (fields.length > 2 ? ' three' : '')}>{fields.map(field => <label className="recent-set-metric" key={field.key}>
      <span className="recent-set-label">{field.label}</span>
      <div className="stp">
        <button aria-label={t('Decrease')} onClick={() => bump(field, -1)}><Icon name="minus" /></button>
        <span className="val"><NumberField decimal={field.decimal} nullable={field.key === 'rir' || field.key === 'rpe'} allowNegative={field.key === 'w' && isBw(cfg)} value={value(field.key)}
          onChange={next => change(field.key, next)} aria-label={field.label} /></span>
        <button aria-label={t('Increase')} onClick={() => bump(field, 1)}><Icon name="plus" /></button>
      </div>
    </label>)}</div>
  </div>
}

// One bar, two meanings: the rest countdown between sets, and the work countdown during a
// timed set (issue #16). They are mutually exclusive by construction — startWork() stops any
// running rest — so the bar can never have to show both, and a work set gets its own colour
// plus a "Done" that logs the time actually held.
export default function RestTimer() {
  const timer = useUI(s => s.timer)
  const work = useUI(s => s.work)
  const addRest = useUI(s => s.addRest)
  const finishRestEarly = useUI(s => s.finishRestEarly)
  const finishWorkEarly = useUI(s => s.finishWorkEarly)
  const stopWork = useUI(s => s.stopWork)
  const on = work || timer
  // The bar is fixed above the tab bar and floats over whatever is beneath it — during a
  // rest that was the next set's row. Extra bottom padding lets the page scroll clear.
  useEffect(() => {
    document.body.classList.toggle('resting', !!on)
    return () => document.body.classList.remove('resting')
  }, [!!on])
  useEffect(() => {
    let mounted = true
    let listener = null
    listenRestNotificationEvents(
      event => {
        const ui = useUI.getState()
        if (ui.timer) {
          const settings = useStore.getState().S
          if (!event?.soundPlayed && document.visibilityState === 'visible') {
            playTimerTone(settings.sound, settings.soundTone || 'classic', 'finish', true)
          }
          ui.stopRest()
          ui.toast(t('Rest over — next set!'))
        }
      },
    ).then(handle => {
      if (mounted) listener = handle
      else handle?.remove()
    })
    return () => { mounted = false; listener?.remove() }
  }, [])
  if (!on) return null
  const pct = (on.left / on.total) * 100

  if (work) return (
    <div id="timer" className="working">
      <div className="t">{clock(work.left)}</div>
      <div className="grow">
        {work.label && <div className="lbl">{work.label}</div>}
        <div className="bar"><i style={{ width: pct + '%' }} /></div>
      </div>
      <Button size="sm" onClick={stopWork}>{t('Cancel')}</Button>
      <Button size="sm" variant="primary" icon="check" onClick={finishWorkEarly}>{t('Done')}</Button>
    </div>
  )
  // Three controls plus the clock don't fit one line on a phone — at 360px the bar is left
  // with about 30px and stops saying anything. So the rest variant stacks: clock and bar
  // read at a glance, controls get their own row. −15 and +15 sit together in number-line
  // order; Skip is pushed to the far edge, away from the button you tap to buy more time.
  return (
    <>
    <RecentSetMetrics />
    <div id="timer" className="rest">
      <div className="head">
        <div className="t">{clock(timer.left)}</div>
        <div className="bar"><i style={{ width: pct + '%' }} /></div>
      </div>
      <div className="acts">
        <Button size="sm" icon="minus" onClick={() => addRest(-15)}>15s</Button>
        <Button size="sm" icon="plus" onClick={() => addRest(15)}>15s</Button>
        <Button size="sm" variant="primary" className="skip" onClick={finishRestEarly}>{t('Skip')}</Button>
      </div>
    </div>
    </>
  )
}
