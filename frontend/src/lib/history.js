// Pure helpers over the state object S (ported 1:1 from the vanilla app).
import { todayISO, isoOf, weekKey, fmtNum } from './format.js'
import { isCardio, isBodyweightEq } from './exercises.js'
import { t } from './i18n.js'

// How an exercise is logged (issue #16). This used to be derived from the body part alone,
// which meant a plank or a farmer's carry could only be timed by filing it under cardio.
// A routine entry can now say so explicitly:
//   reps   — weight × reps      sets look like { w, r }
//   time   — a work duration    sets look like { sec, w }   (w = 0 for bodyweight)
//   cardio — duration + speed   sets look like { min, speed }
// An entry without `mode` behaves exactly as before, so every existing plan, workout and
// plan file is read unchanged and nothing needs migrating.
export function modeOf(cfg) {
  const m = cfg && cfg.mode
  if (m === 'reps' || m === 'time' || m === 'cardio') return m
  return isCardio(cfg && cfg.id) ? 'cardio' : 'reps'
}
export const isTimed = cfg => modeOf(cfg) === 'time'

// Logging flags ride on top of a mode rather than making new modes:
//   bodyweight — the exercise carries no load of its own, so `w` means *added* weight and is
//                asked for only once you say there is some. Seeded from the equipment field.
//                Spelled out rather than `bw`, which a workout already uses for the weigh-in
//                it was logged at — two different things one letter apart is a bug waiting.
//   side       — legacy boolean targets log both limbs as one total; the paired format stores
//                per-limb reps in separate left/right sets. The marker keeps old history
//                interpretable while new routines use unambiguous per-limb entries.
// Old plans without these flags retain their existing behavior.
export const isBw = cfg => (cfg && cfg.bodyweight != null ? !!cfg.bodyweight : isBodyweightEq(cfg && cfg.id))
export const isPerSide = cfg => !!(cfg && cfg.side)
// New per-side plans store reps per limb and expand every planned round into two logged sets.
// Legacy boolean `side: true` is kept on old workout targets and history, where reps are still
// the total for both limbs.
export const usesPairedSides = cfg => cfg?.side === 'paired'
// What one side did in legacy total-rep records. Half of an odd total is shown as it falls
// rather than rounded away: it means the sides were not even, which is worth seeing.
export const sideReps = reps => (reps || 0) / 2
// Legacy totals moved by two; new per-limb targets move by one.
export const repStep = cfg => (cfg?.side === true ? 2 : 1)

// mm:ss for a work duration — seconds alone read badly past a minute ("90 s" vs "1:30").
export function fmtSec(sec) {
  const n = Math.max(0, Math.round(Number(sec) || 0))
  return Math.floor(n / 60) + ':' + String(n % 60).padStart(2, '0')
}

// How hard a set felt, if the profile logs it at all. Two scales for the same thing, kept in
// their own fields: RIR counts the reps still in the tank, RPE reads the same effort off a
// 10-point scale from the top (RPE 8 ≈ RIR 2). A set logged on one scale is never silently
// rewritten as the other — switching the setting changes what new sets ask for, nothing else.
// `min`..`max` is the range the stepper walks. RIR bottoms out at 0 (a set taken to failure);
// RPE accepts the full 1–10 scale, while a fresh cell still suggests the common working-set
// starting point of 6.
export const EFFORT = {
  rir: { f: 'rir', hd: 'RIR', step: 0.5, min: 0, max: 10 },
  rpe: { f: 'rpe', hd: 'RPE', step: 1, min: 1, start: 6, max: 10 }
}
// One tap of an effort stepper. Empty is not 0 — an unlogged effort must not become "went to
// failure" from one stray tap — so − on an empty cell leaves it empty. + starts at the scale's
// configured suggestion (6 for RPE) and the value can step down to its minimum. Stepping back
// off the bottom clears the cell again, so a mistap is undoable. null means "nothing logged";
// the caller stores that by dropping the key rather than writing a null.
export function stepEffort(kind, cur, dir) {
  const e = EFFORT[kind]
  if (!e) return cur ?? null
  if (cur == null) return dir < 0 ? null : (e.start ?? e.min)
  const current = kind === 'rpe' ? Math.round(cur) : cur
  const n = Math.round((current + dir * e.step) * 100) / 100
  if (dir < 0 && n < e.min) return null
  return Math.min(e.max, Math.max(e.min, n))
}
// A typed effort stays within the selected scale's bounds.
export const capEffort = (kind, v) => {
  if (v == null || !EFFORT[kind]) return v
  const bounded = Math.min(EFFORT[kind].max, Math.max(EFFORT[kind].min, v))
  return kind === 'rpe' ? Math.round(bounded) : bounded
}
// Which scale a profile logs. `showRir` is the boolean this replaced and is only consulted
// when the profile has no answer of its own — an explicit 'none' has to win over it, or a
// backup or another device that still carries the old flag would switch the column back on.
export const effortOf = S => {
  const e = S && S.effort
  return e === 'none' || EFFORT[e] ? e : (S && S.showRir ? 'rir' : 'none')
}
// The "(RIR 2)" / "(RPE 8)" tail on a set summary, empty when nothing was logged.
const effortTail = s => {
  const k = s.rir != null ? 'rir' : s.rpe != null ? 'rpe' : null
  return k ? ` (${EFFORT[k].hd} ${fmtNum(s[k])})` : ''
}

// One-line summary of a logged set. `cfg` carries the mode when the caller has it (a routine
// entry or a workout entry); passing an id alone keeps the old body-part behaviour.
export function setLabel(id, s, cfg) {
  const c = cfg || { id }
  const mode = modeOf(c)
  if (mode === 'cardio') return `${s.min || 0} min @ ${fmtNum(s.speed || 0)} km/h`
  if (mode === 'time') return fmtSec(s.sec) + (s.w ? ` · ${isBw({ ...c, id: c.id ?? id }) && s.w > 0 ? '+' : ''}${fmtNum(s.w)}` : '')
  // Bodyweight reads as what you did — "12", or "+10 × 12" once there is a belt involved —
  // rather than "0×12", which says a set was performed with no weight and means nothing.
  const limb = usesPairedSides(c) && s.side ? ` · ${t(s.side === 'left' ? 'Left' : 'Right')}` : ''
  const reps = s.r || 0
  if (isBw({ ...c, id: c.id ?? id })) {
    const load = s.w > 0 ? `+${fmtNum(s.w)} × ` : s.w < 0 ? `−${fmtNum(Math.abs(s.w))} × ` : ''
    return `${load}${reps}${limb}` + effortTail(s)
  }
  return `${fmtNum(s.w || 0)}×${reps}${limb}` + effortTail(s)
}
// Default config for a freshly added exercise.
export function defaultConfig(id, mode) {
  const m = mode || modeOf({ id })
  if (m === 'cardio') return { sets: 1, min: 20, speed: 8 }
  // Written only when it is true, so a barbell config is byte-for-byte what it was before
  // the flag existed and a plan file gains nothing it does not need.
  const bw = isBodyweightEq(id) ? { bodyweight: true } : {}
  if (m === 'time') return { sets: 3, sec: 45, weight: 0, mode: 'time', ...bw }
  return { sets: 3, reps: 10, weight: 0, mode: 'reps', ...bw }
}
// One-line summary of a planned exercise ("3 × 10 · 60 kg"), shared by the routine editor
// and the plan export so a mode is described the same way everywhere.
export function exLine(cfg, unit) {
  const mode = modeOf(cfg)
  const n = cfg.sets || 1
  // Added weight reads as added: "+10 kg" on a dip belt, "60 kg" on a barbell.
  const load = cfg.weight ? ' · ' + (isBw(cfg) && cfg.weight > 0 ? '+' : '') + fmtNum(cfg.weight) + ' ' + unit : ''
  if (mode === 'cardio') return `${n} × ${cfg.min || 20} min @ ${fmtNum(cfg.speed || 8)} km/h`
  if (mode === 'time') return `${n} × ${fmtSec(cfg.sec || 45)}${load}`
  if (usesPairedSides(cfg)) return `${n * 2} × ${cfg.reps} ${t('per side')}${load}`
  // Legacy plans stored a total across both sides; keep their old summary readable.
  const split = isPerSide(cfg) ? ' · ' + t('{0}/side', fmtNum(sideReps(cfg.reps))) : ''
  return `${n} × ${cfg.reps}${load}${split}`
}

// Drop superset ids that no longer have an adjacent partner (after unlink/reorder/remove).
export function cleanupSg(ex) {
  ex.forEach((e, i) => {
    if (e.sg && !(ex[i - 1]?.sg === e.sg || ex[i + 1]?.sg === e.sg)) delete e.sg
  })
}

export function lastEntryFor(S, exId) {
  for (let i = S.workouts.length - 1; i >= 0; i--) {
    const en = S.workouts[i].entries.find(e => e.id === exId)
    // `target` is what the session prescribed; finished workouts carry it so labels and the
    // progression engine can read a session back the way it was logged. Older workouts have
    // none — modeOf() falls back to the body part for them, which is what they were.
    if (en && en.sets.some(s => s.done)) return { d: S.workouts[i].d, sets: en.sets.filter(s => s.done), target: en.target || null }
  }
  return null
}
export function bestWeightFor(S, exId) {
  let best = 0
  S.workouts.forEach(w => w.entries.forEach(e => {
    if (e.id === exId) {
      e.sets.forEach(s => { if (s.done && s.w > best) best = s.w })
      if (e.topW && e.topW > best) best = e.topW
    }
  }))
  return best
}
export function effectiveRoutineId(S, iso) {
  const ov = S.dayPlan[iso]
  if (ov === 'rest') return null
  if (ov && S.routines.some(r => r.id === ov)) return ov
  const wd = new Date(iso + 'T12:00:00').getDay()
  return S.week[wd] || null
}
export function effectiveRoutine(S, iso) {
  const id = effectiveRoutineId(S, iso)
  return id ? S.routines.find(r => r.id === id) || null : null
}
export function buildSets(S, cfg) {
  const last = lastEntryFor(S, cfg.id)
  const n = Math.max(1, cfg.sets || 1)
  const mode = modeOf(cfg)
  const sets = []
  // Last time's set at the same position, falling back to its final set when the plan grew.
  const prevAt = i => (last ? (last.sets[i] || last.sets[last.sets.length - 1]) : null)

  if (mode === 'cardio') {
    for (let i = 0; i < n; i++) {
      const prev = prevAt(i)
      sets.push({ min: prev ? prev.min : (cfg.min || 20), speed: prev ? prev.speed : (cfg.speed || 8), done: false })
    }
    return sets
  }
  if (mode === 'time') {
    for (let i = 0; i < n; i++) {
      // Only carry a previous value over when it came from a timed set — switching an
      // exercise from reps to time must not seed the duration from a rep count.
      const prev = prevAt(i)
      const carried = prev && prev.sec > 0 ? prev : null
      sets.push({ sec: carried ? carried.sec : (cfg.sec || 45), w: carried ? (carried.w || 0) : (cfg.weight || 0), done: false })
    }
    return sets
  }
  const conf = S.exWeights[cfg.id]
  const pairedSides = usesPairedSides(cfg)
  const plannedRows = n * (pairedSides ? 2 : 1)
  for (let i = 0; i < plannedRows; i++) {
    const side = i % 2 === 0 ? 'right' : 'left'
    const prev = pairedSides
      ? ([...(last?.sets || [])].reverse().find(s => s.side === side) || prevAt(Math.floor(i / 2)))
      : prevAt(i)
    const usable = prev && prev.r > 0 ? prev : null
    const w = isBw(cfg) && cfg.weight < 0
      ? cfg.weight
      : isBw(cfg) && usable && usable.w < 0 ? usable.w
      : conf && conf.w > 0 ? conf.w : (usable ? usable.w : cfg.weight)
    // A legacy unilateral workout logged both limbs as one rep total. Convert only the seed
    // used for the next workout; the historical workout remains unchanged.
    const legacyTotal = pairedSides && (last?.target?.side === true || !last?.target)
    const reps = usable ? (legacyTotal ? sideReps(usable.r) : usable.r) : cfg.reps
    sets.push({
      w, r: reps,
      ...(pairedSides ? { side } : {}),
      ...(usable?.rir != null ? { rir: usable.rir } : {}),
      ...(usable?.rpe != null ? { rpe: usable.rpe } : {}),
      done: false
    })
  }
  return sets
}
export function workoutVolume(w, bodyweightRecords = []) {
  let v = 0
  const datedWeights = bodyweightRecords.filter(item => item?.w > 0).sort((a, b) => a.d < b.d ? -1 : a.d > b.d ? 1 : 0)
  const beforeWorkout = datedWeights.filter(item => !w.d || item.d <= w.d)
  const latestWeight = beforeWorkout.length ? beforeWorkout[beforeWorkout.length - 1] : datedWeights[datedWeights.length - 1]
  const bodyweight = w.bw > 0 ? w.bw : latestWeight?.w || 0
  const volumeFor = (entry, set) => {
    const load = isBw({ ...(entry.target || {}), id: entry.id })
      ? Math.max(0, bodyweight + (set.w || 0))
      : (set.w || 0)
    return load * (set.r || 0)
  }
  // Paired-side work logs each limb independently, so both rows contribute to volume.
  w.entries.forEach(e => {
    e.sets.forEach(s => { if (s.done) v += volumeFor(e, s) })
    if (e.warmupSet?.done) v += volumeFor(e, e.warmupSet)
  })
  return v
}
export function setsDone(w) {
  let n = 0
  w.entries.forEach(e => { e.sets.forEach(s => { if (s.done) n++ }); if (e.warmupSet?.done) n++ })
  return n
}
export function setsDoneActive(A) {
  let n = 0
  if (A) A.entries.forEach(e => { e.sets.forEach(s => { if (s.done) n++ }); if (e.warmupSet?.done) n++ })
  return n
}
export const lastBW = S => (S.bodyweight.length ? S.bodyweight[S.bodyweight.length - 1] : null)

// Group consecutive items sharing a superset id (sg) into "units" of indices.
// items may be routine exercises ({sg}) or active-workout entries ({sg}).
export function supersetUnits(items) {
  const units = []
  items.forEach((e, i) => {
    const prev = items[i - 1]
    if (i > 0 && e.sg && prev && prev.sg && e.sg === prev.sg) units[units.length - 1].push(i)
    else units.push([i])
  })
  return units
}
export function unitOf(units, idx) { return units.find(u => u.includes(idx)) || [idx] }

export function streakSummary(S, today = todayISO()) {
  const workouts = new Set((S.workouts || []).map(w => w.d))
  const currentWeek = weekKey(today)
  const shieldWeeks = new Set()
  const unprotectedMisses = new Set()
  let streak = 0
  const cursor = new Date(today + 'T12:00:00')

  // Assign each weekly shield in calendar order; scanning backward alone would let the
  // most recent missed day steal protection from an earlier miss in the same week.
  for (let offset = 3650; offset >= 0; offset--) {
    const day = new Date(cursor)
    day.setDate(cursor.getDate() - offset)
    const iso = isoOf(day)
    if (iso === today || workouts.has(iso) || !effectiveRoutineId(S, iso)) continue
    const week = weekKey(iso)
    if (shieldWeeks.has(week)) unprotectedMisses.add(iso)
    else shieldWeeks.add(week)
  }

  for (let offset = 0; offset <= 3650; offset++) {
    const day = new Date(cursor)
    day.setDate(cursor.getDate() - offset)
    const iso = isoOf(day)
    if (unprotectedMisses.has(iso)) break
    if (workouts.has(iso)) streak++
  }

  return { days: streak, shieldAvailable: !shieldWeeks.has(currentWeek), shieldUsed: shieldWeeks.has(currentWeek) }
}
