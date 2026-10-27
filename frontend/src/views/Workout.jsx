import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { exOr } from '../lib/exercises.js'
import { effectiveRoutine, lastEntryFor, bestWeightFor, buildSets, setsDoneActive, supersetUnits, unitOf, setLabel, fmtSec, modeOf, isBw, isPerSide, sideReps, usesPairedSides, repStep, EFFORT, effortOf, stepEffort, capEffort } from '../lib/history.js'
import { fmtNum, fmtDate, todayISO, exCount, DAYN } from '../lib/format.js'
import { beep, vibrate } from '../lib/sound.js'
import { t } from '../lib/i18n.js'
import { api } from '../lib/api.js'
import Media from '../components/Media.jsx'
import { startFlow, exercisePicker, exConfigSheet, exerciseDetailSheet, topWeightSheet, finishWorkout, workoutCompleteSheet, confirmSheet } from '../sheets.jsx'
import Icon from '../components/Icon.jsx'
import { Button, Check, NumberField, Segmented } from '../components/ui.jsx'
import { nextPrescription, applyPrescription } from '../lib/progression.js'
import { glyphOf } from '../lib/glyphs.js'
import { convertWeight } from '../lib/units.js'
import { MOBILE } from '../lib/mobile.js'

function setLabelInUnit(id, set, cfg, fromUnit, toUnit) {
  if (fromUnit === toUnit || set.w == null) return setLabel(id, set, cfg)
  const w = set.w > 0 ? fmtNum(convertWeight(set.w, fromUnit, toUnit)) : ''
  const effort = set.rir != null ? ` (RIR ${fmtNum(set.rir)})` : set.rpe != null ? ` (RPE ${fmtNum(set.rpe)})` : ''
  const mode = modeOf(cfg || { id })
  if (mode === 'time') return fmtSec(set.sec) + (w ? ` · ${w} ${toUnit}` : '') + effort
  const side = usesPairedSides(cfg) && set.side ? ` · ${t(set.side === 'left' ? 'Left' : 'Right')}` : ''
  if (isBw({ ...(cfg || {}), id })) return (w ? `+${w} ${toUnit} × ` : '') + (set.r || 0) + side + effort
  return `${w || fmtNum(0)} ${toUnit}×${set.r || 0}${side}${effort}`
}

/* ---------- start chooser (no active workout) ---------- */
function StartChooser() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const todayR = effectiveRoutine(S, todayISO())
  const todayOvr = S.dayPlan[todayISO()] !== undefined
  const others = S.routines.filter(r => r !== todayR)
  return <div className="narrow">
    <div className="hdr"><div><h1>{t('Start workout')}</h1><div className="sub">{t(DAYN[new Date().getDay()])} — {todayR ? t('today is {0}', todayR.name) : t('rest day, but no one’s stopping you')}</div></div></div>
    {todayR && <div className="card" style={{ borderColor: 'var(--acc)' }}>
      <h2 className="accent">{t("Today's plan")}{todayOvr ? ' · ' + t('rescheduled') : ''}</h2>
      <div className="row between" style={{ marginBottom: 12 }}>
        <div><div className="big">{todayR.name}</div><div className="muted small">{exCount(todayR.ex.length)}</div></div>
        <span className="lrow-i" style={{ width: 38, height: 38, borderRadius: 9, fontSize: 22 }}><Icon name={glyphOf(todayR.emoji)} /></span>
      </div>
      <Button variant="primary" icon="play" onClick={() => startFlow(todayR.id)}>{t('Start {0}', todayR.name)}</Button>
    </div>}
    {others.length > 0 && <><h4 className="sec">{t('Other routines')}</h4>
      <div className="list">{others.map(r => <div key={r.id} className="item" onClick={() => startFlow(r.id)}>
        <span className="lrow-i"><Icon name={glyphOf(r.emoji)} /></span>
        <div className="grow"><div className="tt">{r.name}</div><div className="ss">{exCount(r.ex.length)}</div></div>
        <span className="tag acc">{t('Start')}</span></div>)}</div></>}
    <div style={{ height: 14 }} />
    <Button icon="shuffle" onClick={() => startFlow(null)}>{t('Freestyle workout (pick as you go)')}</Button>
    {!S.routines.length && <><div style={{ height: 10 }} /><Button variant="primary" onClick={() => nav('/plan')}>{t('Build a plan first')}</Button></>}
  </div>
}

/* ---------- elapsed clock (isolated so the workout tree doesn't re-render every second) ---------- */
function Elapsed({ start }) {
  const [t, setT] = useState('0:00')
  useEffect(() => {
    const tick = () => { const s = Math.floor((Date.now() - start) / 1000); setT(Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')) }
    tick(); const iv = setInterval(tick, 1000); return () => clearInterval(iv)
  }, [start])
  return <span>{t}</span>
}

/* ---------- one exercise block (reps: weight×reps · time: a held duration · cardio: duration+speed) ---------- */
function ExerciseBlock({ entryIdx, compact, focusMode = false, onToggle, onField, onAddSet, onRemoveSet, onStartTimed, onUnitChange }) {
  const S = useStore(s => s.S)
  const working = useUI(s => s.work)
  const entry = S.active.entries[entryIdx]
  const weightUnit = entry.weightUnit || S.unit
  const ex = exOr(entry.id)
  const mode = modeOf({ ...(entry.target || {}), id: entry.id })
  const cardio = mode === 'cardio'
  const timed = mode === 'time'
  const last = lastEntryFor(S, entry.id)
  // The same number the "confirm your working weight" sheet calls your best, so the two
  // never disagree inside one session: heaviest logged set, or the working weight you kept.
  const best = cardio ? 0 : Math.max(bestWeightFor(S, entry.id), (S.exWeights[entry.id] || {}).w || 0)
  // What the progression policy decided for this session, and why (issue #17). Computed when
  // the session was built so the reason matches the numbers already in the rows.
  const plan = entry.plan
  // A bodyweight set has no weight to type, so the column is not there (issue #32) — one
  // stepper instead of two, which is the whole point of the flag. Adding a belt weight in the
  // config brings it back, now labelled as the addition it is.
  const cfg = { ...(entry.target || {}), id: entry.id }
  const bw = !cardio && isBw(cfg)
  const added = bw && entry.sets.some(s => s.w > 0)
  const loadCol = { f: 'w', step: weightUnit === 'lb' ? 5 : 2.5, dec: true, hd: bw ? t('Added ({0})', weightUnit) : t('Weight ({0})', weightUnit) }
  const repCol = { f: 'r', step: repStep(cfg), dec: false, hd: t(usesPairedSides(cfg) ? 'Reps per side' : 'Reps') }
  const col1 = cardio ? { f: 'min', step: 1, dec: false, hd: t('Duration (min)') }
    : timed ? { f: 'sec', step: 5, dec: false, hd: t('Seconds') }
      : (bw && !added) ? repCol : loadCol
  const col2 = cardio ? { f: 'speed', step: 0.5, dec: true, hd: t('Speed (km/h)') }
    : timed ? ((bw && !added) ? null : loadCol)
      : (bw && !added) ? null : repCol
  // Effort (RIR or RPE, whichever the profile logs) only makes sense for weighted rep sets,
  // not cardio/timed holds, and is opt-in since it adds a third stepper to every row. `opt`
  // because an unlogged effort is not the same as 0 — RIR 0 says the set went to failure.
  const kind = effortOf(S)
  const eff = EFFORT[kind]
  const col3 = mode === 'reps' && eff ? { ...eff, eff: kind, dec: true, opt: true, hd: t(eff.hd) } : null
  const rows = entry.sets.map((set, index) => ({ set, index }))
  if (usesPairedSides(cfg)) {
    for (let i = 0; i + 1 < rows.length; i += 2) {
      if (rows[i].set.side === 'left' && rows[i + 1].set.side === 'right') [rows[i], rows[i + 1]] = [rows[i + 1], rows[i]]
    }
  }
  // The effort column walks its own scale — see stepEffort. Weight and reps step up from 0
  // with no ceiling, as they always did.
  const bump = (s, i, col, dir) => {
    if (col.eff) return onField(i, col.f, stepEffort(col.eff, s[col.f], dir))
    if (col.f === 'w') {
      const display = convertWeight(s.w || 0, S.unit, weightUnit)
      return onField(i, col.f, convertWeight(Math.max(0, Math.round((display + dir * col.step) * 100) / 100), weightUnit, S.unit))
    }
    onField(i, col.f, Math.max(0, Math.round(((s[col.f] || 0) + dir * col.step) * 100) / 100))
  }
  // Uses the shared stepper markup so a set row picks up the same control styling
  // as every other +/- field in the app.
  const cell = (s, i, col, cls) => (
    <div className={'stp ' + cls}>
      <button aria-label="Decrease" onClick={() => bump(s, i, col, -1)}><Icon name="minus" /></button>
      {/* a typed effort is capped — there is no RPE 12, and 12 reps in reserve is a warm-up */}
      <span className="val"><NumberField decimal={col.dec} nullable={col.opt} value={s[col.f] == null ? '' : col.f === 'w' ? Math.round(convertWeight(s.w, S.unit, weightUnit) * 10) / 10 : s[col.f]}
        onChange={v => onField(i, col.f, col.eff ? capEffort(col.eff, v) : col.f === 'w' ? convertWeight(v, weightUnit, S.unit) : v)} /></span>
      <button aria-label="Increase" onClick={() => bump(s, i, col, 1)}><Icon name="plus" /></button>
    </div>
  )
  return <>
    {!focusMode && <Media ex={ex} key={entry.id} compact={compact} minimizable />}
    <div className="row between" style={{ marginBottom: 6 }}>
      <div style={{ fontSize: compact ? 17 : 20, fontWeight: 600, letterSpacing: '-.02em', textTransform: 'capitalize', lineHeight: 1.2 }}>{ex.n}</div>
      <div className="row" style={{ gap: 6 }}>
        {!cardio && <div style={{ width: 104 }}><Segmented options={[{ value: 'kg', label: 'kg' }, { value: 'lb', label: 'lb' }]} value={weightUnit} onChange={onUnitChange} /></div>}
        <button className="iconbtn" aria-label={t('Details')} onClick={() => exerciseDetailSheet(ex, { initialUnit: weightUnit, onUnitChange })}><Icon name="info" /></button>
      </div>
    </div>
    <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
      {cardio && <span className="tag acc"><Icon name="figureRun" />{t('Cardio')}</span>}
      {/* New paired sets show per-limb reps; legacy targets keep their total-rep interpretation. */}
      {!cardio && !timed && isPerSide(cfg) && <span className="tag acc nocap"><Icon name="shuffle" />{t('{0} per side', fmtNum(usesPairedSides(cfg) ? (entry.sets.find(s => !s.done)?.r ?? entry.sets[0]?.r) : sideReps(entry.sets.find(s => !s.done)?.r ?? entry.sets[0]?.r)))}</span>}
      {(ex.tg || ex.bp) && <span className="tag">{t(ex.tg || ex.bp)}</span>}
      {ex.eq && <span className="tag">{t(ex.eq)}</span>}
      {!focusMode && best > 0 && <span className="tag nocap">{t('Best:')} {fmtNum(convertWeight(best, S.unit, weightUnit))} {weightUnit}</span>}
    </div>
    {!focusMode && last && <div className="small dim" style={{ marginBottom: 4 }}>{t('Last time')} ({fmtDate(last.d)}): {last.sets.map(s => setLabelInUnit(entry.id, s, last.target, S.unit, weightUnit)).join(', ')}</div>}
    {!focusMode && plan && plan.why && plan.kind !== 'off' && <div className={'progline' + (plan.kind === 'deload' ? ' warn' : '')}>
      <Icon name={plan.kind === 'up' ? 'arrowUp' : plan.kind === 'deload' ? 'arrowDown' : 'lightbulb'} />
      <span>{t(...plan.why)}</span>
    </div>}
    <div className="card" style={{ marginTop: 10, marginBottom: 0 }}>
      {/* the header carries the same eff3 sizing as the rows, or the labels drift off their columns */}
      <div className={'sethead' + (col3 ? ' eff3' : '')}><span className="n-sp" /><span className="w-sp">{col1.hd}</span>{col2 && <span className="r-sp">{col2.hd}</span>}{col3 && <span className="eff-sp">{col3.hd}</span>}{timed && <span className="ck-sp" />}<span className="ck-sp" /></div>
      {rows.map(({ set: s, index: i }, rowIndex) => <div key={i} className={'setrow' + (s.done ? ' done' : '') + (col3 ? ' eff3' : '') + (usesPairedSides(cfg) ? ' paired' + (rowIndex % 2 === 1 ? ' pair-end' : '') : '')}>
        <div className="n" aria-label={s.side ? t(s.side === 'left' ? 'Left' : 'Right') : t('Set {0}', rowIndex + 1)}>{s.side ? `${Math.floor(rowIndex / 2) + 1}${s.side === 'left' ? 'L' : 'R'}` : rowIndex + 1}</div>
        {cell(s, i, col1, 'w')}
        {col2 && cell(s, i, col2, 'r')}
        {col3 && cell(s, i, col3, 'eff')}
        {/* A timed set is started, not typed: the timer counts the hold down and checks the
            set off itself. The checkbox stays for anyone who timed it on their own watch. */}
        {timed && <button className="setgo" aria-label={t('Start set')} disabled={s.done || !!working}
          onClick={() => onStartTimed(i)}><Icon name="play" /></button>}
        <Check checked={s.done} onChange={() => onToggle(i)} />
      </div>)}
      <div style={{ height: 8 }} />
      <div className="row">
        <Button size="sm" icon="minus" disabled={entry.sets.length <= (usesPairedSides(cfg) ? 2 : 1)} onClick={onRemoveSet}>{t('Remove set')}</Button>
        <Button size="sm" icon="plus" onClick={onAddSet}>{t('Add set')}</Button>
      </div>
    </div>
  </>
}

/* ---------- active workout ---------- */
function ActiveWorkout() {
  const [focusMode, setFocusMode] = useState(false)
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const startRest = useUI(s => s.startRest)
  const stopRest = useUI(s => s.stopRest)
  const A = S.active
  const units = supersetUnits(A.entries)
  const cur = Math.min(A.cur, Math.max(0, A.entries.length - 1))
  const unit = A.entries.length ? unitOf(units, cur) : []
  const unitIdx = units.findIndex(u => u === unit)
  const isSuperset = unit.length > 1

  useEffect(() => {
    if (!focusMode) return
    let awayFromApp = false
    let disposed = false
    let noticeOpen = false
    let nativeListener
    const showFocusNotice = message => {
      if (!awayFromApp || disposed || noticeOpen) return
      awayFromApp = false
      noticeOpen = true
      useUI.getState().openSheet(close => {
        const closeNotice = () => { noticeOpen = false; close() }
        return <div className="focus-return-dialog">
        <span className="focus-return-icon"><Icon name="target" /></span>
        <h2>{t('Keep your focus')}</h2>
        <p>{t(message)}</p>
        <div className="focus-return-actions">
          <Button variant="primary" icon="check" onClick={closeNotice}>{t('Stay in workout')}</Button>
          <Button onClick={() => { setFocusMode(false); closeNotice() }}>{t('Exit focus mode')}</Button>
        </div>
      </div>
      }, { kind: 'center', locked: true })
    }
    const showReturnNotice = () => showFocusNotice('You left Gym Book Training while focus mode was active. Your workout is still running. Continue with the exercise or turn focus mode off.')
    const showBackButtonNotice = () => {
      awayFromApp = true
      showFocusNotice('Focus mode is active. Turn focus mode off before leaving Gym Book Training. Your workout will stay in progress.')
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') awayFromApp = true
      else showReturnNotice()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    if (MOBILE) {
      import('@capacitor/app').then(async ({ App }) => {
        const listeners = await Promise.all([
          App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) showReturnNotice()
            else awayFromApp = true
          }),
          App.addListener('backButton', showBackButtonNotice),
        ])
        return { remove: () => listeners.forEach(listener => listener.remove()) }
      }).then(listener => {
        if (disposed) listener.remove()
        else nativeListener = listener
      }).catch(() => {})
    }
    return () => {
      disposed = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      nativeListener?.remove()
    }
  }, [focusMode])

  const total = A.entries.reduce((n, e) => n + e.sets.length, 0)
  const done = setsDoneActive(A)

  const mutEntry = (idx, fn) => update(s => { fn(s.active.entries[idx]) }, true)
  // Clearing an optional field drops the key rather than storing null, so a set only carries
  // what was actually logged — in the session, in history and in a backup.
  const setField = (idx, i, field, v) => mutEntry(idx, e => {
    if (v == null) delete e.sets[i][field]; else e.sets[i][field] = v
  })
  const modeAt = idx => modeOf({ ...(A.entries[idx].target || {}), id: A.entries[idx].id })
  const addSet = idx => mutEntry(idx, e => {
    const l = e.sets[e.sets.length - 1]
    const m = modeOf({ ...(e.target || {}), id: e.id })
    if (m === 'cardio') e.sets.push({ min: l ? l.min : (e.target.min || 20), speed: l ? l.speed : (e.target.speed || 8), done: false })
    else if (m === 'time') e.sets.push({ sec: l ? l.sec : (e.target.sec || 45), w: l ? (l.w || 0) : (e.target.weight || 0), done: false })
    else if (usesPairedSides(e.target)) {
      const right = [...e.sets].reverse().find(s => s.side === 'right') || l || { w: e.target.weight || 0, r: e.target.reps }
      const left = [...e.sets].reverse().find(s => s.side === 'left') || right
      e.sets.push({ ...right, side: 'right', done: false }, { ...left, side: 'left', done: false })
    } else e.sets.push({ w: l ? l.w : 0, r: l ? l.r : e.target.reps, done: false })
  })
  const removeSet = idx => mutEntry(idx, e => {
    const remove = usesPairedSides(e.target) ? 2 : 1
    if (e.sets.length > remove) e.sets.splice(-remove, remove)
  })

  // A timed set is held, not typed. The work timer records what was actually held — an early
  // finish logs 0:38 of a 0:45 target rather than crediting the full prescription — and then
  // checks the set off through the normal path, so rest, supersets and the finish prompt all
  // behave exactly as they do for a reps set.
  const startTimed = (idx, i) => {
    const e = A.entries[idx]
    useUI.getState().startWork(e.sets[i].sec || 45, exOr(e.id).n, elapsed => {
      mutEntry(idx, en => { en.sets[i].sec = elapsed })
      if (!useStore.getState().S.active.entries[idx].sets[i].done) toggle(idx, i)
    })
  }

  const toggle = (idx, i) => {
    const m = modeAt(idx)
    const cardioEntry = m === 'cardio'
    const isLastUnit = unitIdx >= units.length - 1
    let askTop = false, exJustDone = false, workoutDone = false
    mutEntry(idx, e => {
      e.sets[i].done = !e.sets[i].done
      if (e.sets[i].done) {
        beep(S.sound, 1040, 0.12); vibrate(30)
        const isLastExInUnit = idx === unit[unit.length - 1]
        const unitDone = unit.every(ui => (ui === idx ? e : A.entries[ui]).sets.every(x => x.done))
        if (!unitDone && (usesPairedSides(e.target) || isLastExInUnit)) {
          startRest(usesPairedSides(e.target) ? (S.sideRestSec ?? 30) : S.restSec)
        }
        else if (unitDone) stopRest()
        if (unitDone && isLastUnit) workoutDone = true      // last exercise's last set → done
        // Only loaded reps training has a "working weight" worth confirming — a bodyweight
        // plank has nothing to put in that slider, and neither does a set of push-ups
        // (issue #32: the fewest taps that still record what happened).
        const loaded = m === 'reps' && !(isBw({ ...(e.target || {}), id: e.id }) && !e.sets.some(x => x.w > 0))
        if (e.sets.every(x => x.done)) { exJustDone = true; if (loaded && !e.asked) { e.asked = true; askTop = true } }
      }
    })
    // reps: topWeight first (it chains into the finish/continue prompt on the last unit).
    // cardio/timed or already-confirmed: go straight to the prompt.
    if (askTop) topWeightSheet(idx)
    else if (workoutDone) workoutCompleteSheet()
    else if (exJustDone && cardioEntry) useUI.getState().toast(t('Cardio logged'))
    else if (exJustDone && m === 'time') useUI.getState().toast(t('Hold logged'))
  }

  // Live-presence heartbeat so the admin dashboard can show who's training now. Signed-in only —
  // guests have no server session. Reads fresh state each tick so progress stays current.
  useEffect(() => {
    if (MOBILE || !useStore.getState().user) return
    let stopped = false
    const ping = active => {
      const A2 = useStore.getState().S.active
      if (!A2) return
      const u = supersetUnits(A2.entries)
      const c = Math.min(A2.cur, Math.max(0, A2.entries.length - 1))
      const ui = u.findIndex(x => x.includes(c))
      const tot = A2.entries.reduce((n, e) => n + e.sets.length, 0)
      api('/api/activity', { method: 'POST', body: JSON.stringify({
        active, name: A2.name, exIdx: ui + 1, exTotal: u.length,
        setsDone: setsDoneActive(A2), setsTotal: tot, startedAt: A2.start
      }) }).catch(() => {})
    }
    ping(true)
    const iv = setInterval(() => { if (!stopped) ping(true) }, 20000)
    return () => {
      stopped = true; clearInterval(iv)
      // best-effort "left" signal: sendBeacon survives a tab close, fetch covers in-app nav
      try { navigator.sendBeacon?.('/api/activity', new Blob([JSON.stringify({ active: false })], { type: 'application/json' })) } catch { /* */ }
      api('/api/activity', { method: 'POST', body: JSON.stringify({ active: false }) }).catch(() => {})
    }
  }, [])

  return <div className={'narrow active-workout' + (focusMode ? ' focus-mode' : '')}>
    <div className="hdr">
      <button className="iconbtn" aria-label={t('Discard')} onClick={() => confirmSheet({ title: t('Discard workout?'), message: t('The sets you logged in this session will be lost.'), confirmText: t('Discard'), danger: true, onConfirm: () => { update(s => { s.active = null }); stopRest(); nav('/home') } })}><Icon name="xmark" /></button>
      <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 600 }}>{A.name}</div><div className="sub"><Elapsed start={A.start} /> · {t('{0} sets', done + '/' + total)}</div></div>
      <button className="iconbtn" style={{ color: 'var(--acc)' }} aria-label={t('Finish')} onClick={finishWorkout}><Icon name="check" /></button>
    </div>
    <div className="wprog"><i style={{ width: (total ? done / total * 100 : 0) + '%' }} /></div>
    <div className="workout-focus-row">
      <button className={'workout-focus-toggle' + (focusMode ? ' selected' : '')} type="button" aria-pressed={focusMode}
        onClick={() => setFocusMode(value => !value)}>
        <Icon name={focusMode ? 'eyeOff' : 'eye'} />
        {t(focusMode ? 'Exit focus mode' : 'Focus mode')}
      </button>
    </div>

    {A.entries.length ? <>
      {!focusMode && <div className="muted small" style={{ marginBottom: 6 }}>{isSuperset ? t('Superset {0} / {1}', unitIdx + 1, units.length) : t('Exercise {0} / {1}', unitIdx + 1, units.length)}</div>}
      {isSuperset ? (
        <div className="ss-card">
          {!focusMode && <div className="ss-hd"><Icon name="link" />{t('Superset · do these back-to-back, rest after both')}</div>}
          {unit.map((idx, k) => <div key={idx} className="ss-ex">
            {k > 0 && <div className="ss-amp">+</div>}
            <ExerciseBlock entryIdx={idx} compact focusMode={focusMode}
              onToggle={i => toggle(idx, i)} onField={(i, f, v) => setField(idx, i, f, v)} onAddSet={() => addSet(idx)} onRemoveSet={() => removeSet(idx)} onStartTimed={i => startTimed(idx, i)} onUnitChange={v => mutEntry(idx, e => { e.weightUnit = v })} />
          </div>)}
        </div>
      ) : (
        <ExerciseBlock entryIdx={cur} focusMode={focusMode} onToggle={i => toggle(cur, i)} onField={(i, f, v) => setField(cur, i, f, v)} onAddSet={() => addSet(cur)} onRemoveSet={() => removeSet(cur)} onStartTimed={i => startTimed(cur, i)} onUnitChange={v => mutEntry(cur, e => { e.weightUnit = v })} />
      )}
    </> : <div className="empty"><div className="ico"><Icon name="shuffle" /></div>{t('Freestyle workout — add your first exercise.')}</div>}

    <div style={{ height: 12 }} />
    <div className="row">
      <Button icon="chevronLeft" disabled={unitIdx <= 0} onClick={() => update(s => { s.active.cur = units[unitIdx - 1][0] })}>{t('Prev')}</Button>
      <Button trailingIcon="chevronRight" disabled={unitIdx < 0 || unitIdx >= units.length - 1} onClick={() => update(s => { s.active.cur = units[unitIdx + 1][0] })}>{t('Next')}</Button>
    </div>
    <div style={{ height: 10 }} />
    {!focusMode && <Button onClick={() => exercisePicker(ex => exConfigSheet(ex, null, cfg => update(s => {
      const full = { ...cfg, id: ex.id }
      const plan = nextPrescription(s, full, s.routines.find(r => r.id === s.active.routineId))
      s.active.entries.push({ id: ex.id, target: { ...cfg }, plan, sets: applyPrescription(buildSets(s, full), plan) })
      s.active.cur = s.active.entries.length - 1
      s.favoriteEx = [...new Set([...(s.favoriteEx || []), ex.id])]
    }), null, S.routines.find(r => r.id === A.routineId)))} icon="plus">{t('Add exercise')}</Button>}
    <div style={{ height: 10 }} />
    {(() => {
      const exDone = A.entries.filter(e => e.sets.length && e.sets.every(s => s.done)).length
      const allDone = A.entries.length > 0 && exDone === A.entries.length
      return <button className={allDone ? 'btn primary' : 'btn ghost dim'} onClick={finishWorkout}>
        {allDone ? t('Finish workout') : t('Finish workout early · {0} exercises', exDone + '/' + A.entries.length)}
      </button>
    })()}
    <div style={{ height: 40 }} />
  </div>
}

export default function Workout() {
  const active = useStore(s => s.S.active)
  return active ? <ActiveWorkout /> : <StartChooser />
}
