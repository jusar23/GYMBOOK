import { Capacitor, registerPlugin } from '@capacitor/core'

const WorkoutOrientation = registerPlugin('WorkoutOrientation')

export async function setWorkoutOrientationLocked(locked) {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return
  try {
    await WorkoutOrientation.setLocked({ locked: !!locked })
  } catch { /* Orientation locking is an optional device preference. */ }
}
