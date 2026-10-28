import { EXDB } from './exercises.js'
import { uid } from './format.js'
import { t } from './i18n.js'
import { DEFAULT_GLYPH } from './glyphs.js'

const EQUIPMENT = {
  dumbbells: ['dumbbell', 'weighted'],
  barbell: ['barbell', 'olympic barbell', 'ez barbell', 'smith machine', 'weighted'],
  bands: ['band', 'resistance band'],
  machines: ['cable', 'leverage machine', 'assisted', 'smith machine'],
  kettlebells: ['kettlebell', 'weighted'],
}

const SESSION_FOCUS = {
  full: ['chest', 'back', 'upper legs', 'shoulders', 'upper legs', 'waist', 'lower legs'],
  upper: ['chest', 'back', 'shoulders', 'upper arms', 'upper arms'],
  lower: ['upper legs', 'upper legs', 'lower legs', 'waist', 'upper legs'],
  push: ['chest', 'shoulders', 'upper arms', 'chest', 'waist'],
  pull: ['back', 'back', 'shoulders', 'upper arms', 'waist'],
  legs: ['upper legs', 'upper legs', 'lower legs', 'waist', 'upper legs'],
  recovery: ['upper legs', 'lower legs', 'waist'],
}

const SPLITS_BY_DAYS = {
  1: ['full'],
  2: ['full', 'full'],
  3: ['full', 'full', 'full'],
  4: ['upper', 'lower', 'upper', 'lower'],
  5: ['upper', 'lower', 'full', 'upper', 'lower'],
  6: ['push', 'pull', 'legs', 'push', 'pull', 'legs'],
  7: ['push', 'pull', 'legs', 'push', 'pull', 'legs', 'recovery'],
}

const ROUTINE_NAMES = {
  full: 'Full body', upper: 'Upper body', lower: 'Lower body',
  push: 'Push', pull: 'Pull', legs: 'Legs', recovery: 'Active recovery',
}

export function ageFromDateOfBirth(dateOfBirth, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth || '')) return null
  const birth = new Date(`${dateOfBirth}T12:00:00`)
  if (Number.isNaN(birth.getTime()) || birth > now) return null
  let age = now.getFullYear() - birth.getFullYear()
  const beforeBirthday = now.getMonth() < birth.getMonth()
    || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
  if (beforeBirthday) age--
  return age >= 18 && age <= 120 ? age : null
}

function hash(value) {
  let n = 2166136261
  for (let i = 0; i < value.length; i++) n = Math.imul(n ^ value.charCodeAt(i), 16777619)
  return n >>> 0
}

function equipmentMatches(exercise, selected) {
  if (exercise.eq === 'body weight') return true
  return selected.some(id => (EQUIPMENT[id] || []).includes(exercise.eq))
}

function exercisePool({ selectedEquipment, age, recovery = false }) {
  return EXDB.filter(exercise => {
    if (!equipmentMatches(exercise, selectedEquipment)) return false
    if (exercise.bp === 'cardio') return false
    const name = exercise.n.toLowerCase()
    if (recovery) return exercise.eq === 'body weight' && /stretch|mobility|easy|gentle/.test(name)
    if (/stretch|warm.?up|foam roll|massage|mobility|therapy|rehab/.test(name)) return false
    if (age >= 60 && /jump|burpee|sprint|skater hop|high knee/.test(name)) return false
    return true
  })
}

function chooseExercises({ pool, focus, count, seed, recovery = false }) {
  const chosen = []
  const used = new Set()
  const ordered = pool.slice().sort((a, b) => hash(`${seed}:${a.id}`) - hash(`${seed}:${b.id}`))
  for (let index = 0; index < count; index++) {
    const target = focus[index % focus.length]
    const candidates = ordered.filter(exercise => !used.has(exercise.id) && exercise.bp === target)
    const fallback = ordered.filter(exercise => !used.has(exercise.id))
    const exercise = candidates[0] || fallback[0]
    if (!exercise) break
    used.add(exercise.id)
    chosen.push(exercise)
  }
  return chosen.map(exercise => ({
    id: exercise.id,
    sets: recovery ? 1 : 2,
    reps: 10,
    weight: 0,
  }))
}

function cardioEntry(minutes) {
  const cardio = EXDB.find(exercise => exercise.id === '3672')
  if (!cardio) return null
  return { id: cardio.id, sets: 1, min: minutes, speed: 0 }
}

export function makeRecommendedPlan({ days, minutes, goal, equipment, age, userId = '' }) {
  const selectedDays = [...new Set(days)].filter(day => Number.isInteger(day) && day >= 0 && day <= 6)
    .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
  const splits = SPLITS_BY_DAYS[selectedDays.length] || []
  const selectedEquipment = equipment.filter(id => id !== 'bodyweight')
  const pool = exercisePool({ selectedEquipment, age })
  const recoveryPool = exercisePool({ selectedEquipment: [], age, recovery: true })
  const exerciseCount = minutes <= 20 ? 4 : minutes <= 30 ? 5 : minutes <= 45 ? 6 : 7
  const sets = age >= 60 || goal === 'lose' ? 2 : 3
  const reps = age >= 60 ? 10 : goal === 'gain' ? 8 : goal === 'lose' ? 12 : 10
  const routines = []
  const week = {}
  const bySplit = new Map()

  selectedDays.forEach((day, index) => {
    const split = splits[index]
    if (!bySplit.has(split)) {
      const recovery = split === 'recovery'
      const bodyParts = SESSION_FOCUS[split] || SESSION_FOCUS.full
      const availablePool = recovery ? recoveryPool : pool
      const targetCount = recovery ? 3 : Math.max(3, exerciseCount - (goal === 'lose' ? 1 : 0))
      const ex = chooseExercises({
        pool: availablePool,
        focus: bodyParts,
        count: targetCount,
        seed: `${userId}:${split}:${age || 'general'}:${equipment.join(',')}`,
        recovery,
      }).map(config => ({ ...config, sets: recovery ? 1 : sets, reps }))
      if (!recovery && (goal === 'lose' || (goal === 'both' && index % 2 === 1))) {
        const cardio = cardioEntry(Math.min(15, Math.max(8, Math.round(minutes / 4))))
        if (cardio) ex.push(cardio)
      }
      const name = split === 'full' && routines.some(routine => routine.name === t(ROUTINE_NAMES.full))
        ? `${t(ROUTINE_NAMES.full)} ${bySplit.size + 1}`
        : t(ROUTINE_NAMES[split])
      const routine = { id: uid(), name, emoji: DEFAULT_GLYPH, ex }
      bySplit.set(split, routine)
      routines.push(routine)
    }
    week[day] = bySplit.get(split).id
  })

  return { routines, week, sets, reps }
}
