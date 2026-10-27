import { buildPlanBundle, parsePlan } from './plan-share.js'

export const TRAINING_FILE_FORMAT = 'gym-book-training'
export const TRAINING_FILE_VERSION = 1
export const TRAINING_FILE_MAX_BYTES = 10 * 1024 * 1024

const STATE_KEYS = new Set([
  'unit', 'restSec', 'sound', 'keepAwake', 'lockOrientation', 'warmupEnabled', 'lang', 'theme', 'accent', 'body', 'targetW',
  'bodyweight', 'routines', 'week', 'dayPlan', 'exWeights', 'workouts', 'customEx',
  'favoriteEx', 'favoritesMigrated', 'gifSize', 'reminder', 'effort', 'showRir', 'active', '_ts',
])

const isRecord = value => !!value && typeof value === 'object' && !Array.isArray(value)
const isText = (value, max = 200) => typeof value === 'string' && value.length <= max
const isFiniteNumber = value => typeof value === 'number' && Number.isFinite(value)
const isDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
const assert = (condition, message) => { if (!condition) throw new Error(message) }

function validateState(state) {
  assert(isRecord(state), 'The training file has an invalid data object.')
  for (const key of Object.keys(state)) assert(STATE_KEYS.has(key), `Unsupported data field: ${key}.`)
  assert(Array.isArray(state.routines) && state.routines.length <= 500, 'The routines list is invalid or too large.')
  assert(Array.isArray(state.workouts) && state.workouts.length <= 20000, 'The workout history is invalid or too large.')
  assert(Array.isArray(state.bodyweight || []) && (state.bodyweight || []).length <= 20000, 'The body-weight history is invalid or too large.')
  assert(isRecord(state.week || {}) && isRecord(state.dayPlan || {}) && isRecord(state.exWeights || {}), 'The training settings are invalid.')
  assert(Array.isArray(state.customEx || []) && (state.customEx || []).length <= 2000, 'The custom exercise list is invalid or too large.')
  assert(Array.isArray(state.favoriteEx || []) && (state.favoriteEx || []).length <= 10000, 'The favorites list is invalid or too large.')
  for (const key of ['unit', 'lang', 'theme', 'accent', 'body', 'gifSize']) {
    if (state[key] != null) assert(isText(state[key], 32), `The setting (${key}) is invalid.`)
  }
  for (const key of ['sound', 'keepAwake', 'lockOrientation', 'warmupEnabled', 'favoritesMigrated', 'showRir']) {
    if (state[key] != null) assert(typeof state[key] === 'boolean', `The setting (${key}) is invalid.`)
  }
  for (const key of ['restSec', 'targetW']) {
    if (state[key] != null) assert(isFiniteNumber(state[key]) && state[key] >= 0 && state[key] <= 100000, `The setting (${key}) is invalid.`)
  }
  for (const [day, routineId] of Object.entries(state.week || {})) {
    assert(/^[0-6]$/.test(day) && isText(routineId, 100), 'The weekly schedule is invalid.')
  }
  for (const [date, routineId] of Object.entries(state.dayPlan || {})) {
    assert(isDate(date) && isText(routineId, 100), 'The dated training schedule is invalid.')
  }
  for (const [exerciseId, weight] of Object.entries(state.exWeights || {})) {
    assert(isText(exerciseId, 100) && isRecord(weight) && isFiniteNumber(weight.w) && weight.w >= 0 && weight.w <= 100000, 'A saved exercise weight is invalid.')
    if (weight.d != null) assert(isDate(weight.d), 'A saved exercise-weight date is invalid.')
  }
  for (const favorite of state.favoriteEx || []) assert(isText(favorite, 100), 'A favorite exercise id is invalid.')
  if (state.reminder != null) {
    assert(isRecord(state.reminder) && typeof state.reminder.on === 'boolean' && isText(state.reminder.time, 5), 'The workout reminder setting is invalid.')
  }
  if (state.effort != null) assert(['none', 'rir', 'rpe'].includes(state.effort), 'The workout effort setting is invalid.')

  for (const routine of state.routines) {
    assert(isRecord(routine) && isText(routine.id, 100) && isText(routine.name, 120) && Array.isArray(routine.ex) && routine.ex.length <= 500, 'A routine in this file is invalid.')
    for (const exercise of routine.ex) {
      assert(isRecord(exercise) && isText(exercise.id, 100), 'An exercise in this file is invalid.')
      if (exercise.sets != null) assert(Number.isInteger(exercise.sets) && exercise.sets > 0 && exercise.sets <= 100, 'An exercise has an invalid set count.')
    }
  }

  for (const workout of state.workouts) {
    assert(isRecord(workout) && isDate(workout.d) && Array.isArray(workout.entries) && workout.entries.length <= 500, 'A workout in this file is invalid.')
    for (const entry of workout.entries) {
      assert(isRecord(entry) && isText(entry.id, 100) && Array.isArray(entry.sets) && entry.sets.length <= 500, 'A workout exercise in this file is invalid.')
      for (const set of entry.sets) {
        assert(isRecord(set), 'A workout set in this file is invalid.')
        for (const key of ['w', 'r', 'sec', 'min', 'speed', 'rir', 'rpe']) {
          if (set[key] != null) assert(isFiniteNumber(set[key]), `A workout value (${key}) is invalid.`)
        }
      }
    }
  }

  for (const entry of state.bodyweight || []) {
    assert(isRecord(entry) && isDate(entry.d) && isFiniteNumber(entry.w) && entry.w > 0 && entry.w <= 1000, 'A body-weight entry in this file is invalid.')
  }

  for (const exercise of state.customEx || []) {
    assert(isRecord(exercise) && isText(exercise.id, 100) && isText(exercise.n, 120), 'A custom exercise in this file is invalid.')
  }

  return state
}

export function createTrainingFile(state, kind = 'history') {
  if (kind === 'routines') {
    assert(Array.isArray(state?.routines) && state.routines.length > 0 && state.routines.length <= 500, 'Add at least one routine before exporting routines.')
    const data = buildPlanBundle(state)
    parsePlan(data)
    return {
      format: TRAINING_FILE_FORMAT,
      version: TRAINING_FILE_VERSION,
      kind,
      createdAt: new Date().toISOString(),
      data,
    }
  }
  if (kind !== 'history') throw new Error('Unsupported training file type.')
  const data = { ...state, active: null }
  delete data.active
  delete data._ts
  validateState(data)
  return { format: TRAINING_FILE_FORMAT, version: TRAINING_FILE_VERSION, kind, createdAt: new Date().toISOString(), data }
}

export function trainingFileText(state, kind = 'history') {
  const text = JSON.stringify(createTrainingFile(state, kind), null, 2)
  assert(new TextEncoder().encode(text).byteLength <= TRAINING_FILE_MAX_BYTES, 'This export is larger than the supported 10 MB file limit.')
  return text
}

export function parseTrainingFile(raw, { allowLegacy = true } = {}) {
  const text = typeof raw === 'string' ? raw : JSON.stringify(raw)
  assert(new TextEncoder().encode(text).byteLength <= TRAINING_FILE_MAX_BYTES, 'Files must be 10 MB or smaller.')
  let file
  try { file = typeof raw === 'string' ? JSON.parse(raw.replace(/^\uFEFF/, '')) : raw }
  catch { throw new Error('This file is not valid JSON.') }
  assert(isRecord(file), 'This is not a Gym Book Training file.')

  // Older app versions exported the whole state as plain JSON. Keep importing those files
  // on-device while the web account portal accepts only the versioned format.
  if (allowLegacy && !file.format && Array.isArray(file.routines) && Array.isArray(file.workouts)) {
    const data = { ...validateState(file), active: null }
    delete data._ts
    return { kind: 'history', data, legacy: true }
  }

  assert(file.format === TRAINING_FILE_FORMAT, 'This file was not exported by Gym Book Training.')
  assert(Object.keys(file).every(key => ['format', 'version', 'kind', 'createdAt', 'data'].includes(key)), 'This file contains unsupported fields.')
  assert(file.version === TRAINING_FILE_VERSION, 'This Gym Book Training file version is not supported.')
  assert(file.kind === 'routines' || file.kind === 'history', 'This Gym Book Training file type is not supported.')
  assert(isText(file.createdAt, 40) && !Number.isNaN(Date.parse(file.createdAt)), 'The export date in this file is invalid.')
  assert(isRecord(file.data), 'The training file has no valid data object.')

  if (file.kind === 'routines') {
    assert(Object.keys(file.data).every(key => ['opengym_plan', 'exported', 'name', 'week', 'routines', 'customEx'].includes(key)), 'The routines file contains unsupported fields.')
    assert(file.data.opengym_plan === 1 && Array.isArray(file.data.routines) && file.data.routines.length <= 500, 'The routines file version or list is invalid.')
    assert(Array.isArray(file.data.customEx || []) && (file.data.customEx || []).length <= 2000, 'The custom exercise list is invalid or too large.')
    assert(isRecord(file.data.week || {}), 'The routines schedule is invalid.')
    for (const [day, id] of Object.entries(file.data.week || {})) assert(/^[0-6]$/.test(day) && isText(id, 100), 'The routines schedule is invalid.')
    for (const routine of file.data.routines) {
      assert(isRecord(routine) && isText(routine.id, 100) && isText(routine.name, 120) && Array.isArray(routine.ex) && routine.ex.length <= 500, 'A routine in this file is invalid.')
    }
    const plan = parsePlan(file.data)
    assert(plan.routineCount > 0, 'This routines file does not contain any routines.')
    return { kind: 'routines', data: plan, legacy: false }
  }
  const data = { ...validateState(file.data), active: null }
  delete data._ts
  return { kind: 'history', data, legacy: false }
}
