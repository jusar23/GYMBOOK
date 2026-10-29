import { describe, expect, it } from 'vitest'
import { parseTrainingFile, trainingFileText } from './training-file.js'

describe('training backup files', () => {
  it('exports and imports all current app settings with training progress', () => {
    const state = {
      unit: 'kg', restSec: 90, sideRestSec: 30, sound: true, soundTone: 'classic', restNotification: true,
      keepAwake: true, lockOrientation: false, warmupEnabled: false, lang: 'es', theme: 'dark',
      accent: 'lime', body: 'male', targetW: 80, bodyweight: [{ d: '2026-10-27', w: 78 }],
      routines: [{ id: 'routine-1', name: 'Fuerza', ex: [] }], week: { 1: 'routine-1' }, dayPlan: {},
      exWeights: {}, workouts: [{ d: '2026-10-27', entries: [] }], customEx: [], favoriteEx: [],
      favoritesMigrated: true, gifSize: 'full', reminder: { on: false, time: '08:00', tz: null },
      effort: 'rpe', active: null, _ts: 123,
    }

    const restored = parseTrainingFile(trainingFileText(state)).data

    expect(restored).toMatchObject({
      sideRestSec: 30,
      soundTone: 'classic',
      restNotification: true,
      routines: state.routines,
      workouts: state.workouts,
      bodyweight: state.bodyweight,
      week: state.week,
    })
    expect(restored).not.toHaveProperty('_ts')
  })

  it('migrates an old rest-bubble setting to the notification preference', () => {
    const state = {
      routines: [], workouts: [], bodyweight: [], week: {}, dayPlan: {}, exWeights: {}, customEx: [],
      favoriteEx: [], restBubble: true,
    }
    const restored = parseTrainingFile(trainingFileText(state)).data
    expect(restored.restNotification).toBe(true)
    expect(restored).not.toHaveProperty('restBubble')
  })

  it('imports the legacy plan JSON exported by the workout plan screen', () => {
    const imported = parseTrainingFile(JSON.stringify({
      opengym_plan: 1,
      exported: '2026-10-29',
      name: 'GymBook plan',
      week: { 1: 'routine-1' },
      routines: [{ id: 'routine-1', name: 'Strength', ex: [{ id: '0001', sets: 3, reps: 10 }] }],
      customEx: [],
    }))

    expect(imported.kind).toBe('routines')
    expect(imported.data.routines[0].ex[0]).toMatchObject({ id: '0001', sets: 3, reps: 10 })
  })
})
