import { MOBILE } from './mobile.js'

// Five distinct notification-style sounds. Android renders these through the
// notification stream so the phone's notification-volume setting controls them.
export const TIMER_TONES = [
  { value: 'classic', label: 'Studio' },
  { value: 'double', label: 'Pulse' },
  { value: 'bright', label: 'Crystal' },
  { value: 'soft', label: 'Warm' },
  { value: 'urgent', label: 'Signal' },
]

let audioCtx = null
let timerAudioPlugin = null
export function unlockAudio() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    audioCtx = audioCtx || new Ctx()
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {})
  } catch { /* Audio is optional when the browser does not support WebAudio. */ }
}

const webPresets = {
  classic: [784, 988, 1175],
  double: [659, 784, 988],
  bright: [1047, 1319, 1568],
  soft: [523, 659, 784],
  urgent: [988, 784, 988],
}
function webTone(tone, kind) {
  try {
    unlockAudio()
    if (!audioCtx) return
    const notes = webPresets[tone] || webPresets.classic
    const sequence = kind === 'finish' ? notes : [notes[0]]
    sequence.forEach((freq, i) => {
      const start = audioCtx.currentTime + i * (kind === 'finish' ? 0.19 : 0)
      const duration = kind === 'finish' ? 0.22 : 0.17
      ;[ [freq, 0.34], [freq * 2.76, 0.075] ].forEach(([pitch, level]) => {
        const osc = audioCtx.createOscillator(), gain = audioCtx.createGain()
        osc.type = 'sine'; osc.frequency.value = pitch
        osc.connect(gain); gain.connect(audioCtx.destination)
        gain.gain.setValueAtTime(0.0001, start)
        gain.gain.exponentialRampToValueAtTime(level, start + 0.012)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
        osc.start(start); osc.stop(start + duration + 0.015)
      })
    })
  } catch { /* Ignore an audio device becoming unavailable. */ }
}

// Kept for short UI cues in the workout flow.
export function beep(enabled, freq, dur = 0.18, when = 0) {
  if (!enabled) return
  try {
    unlockAudio()
    if (!audioCtx) return
    const start = audioCtx.currentTime + when
    const osc = audioCtx.createOscillator(), gain = audioCtx.createGain()
    osc.type = 'sine'; osc.frequency.value = freq || 880
    osc.connect(gain); gain.connect(audioCtx.destination)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.42, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    osc.start(start); osc.stop(start + dur + 0.02)
  } catch { /* Ignore unavailable audio devices. */ }
}

export async function playTimerTone(enabled, tone = 'classic', kind = 'countdown', duck = false) {
  if (!enabled) return
  if (MOBILE) {
    try {
      if (!timerAudioPlugin) {
        const { registerPlugin } = await import('@capacitor/core')
        timerAudioPlugin = registerPlugin('TimerAudio')
      }
      await timerAudioPlugin.play({ tone, kind, duck })
      return
    } catch { /* WebAudio fallback for web and platforms without the native plugin. */ }
  }
  webTone(tone, kind)
}

export function vibrate(p) { try { navigator.vibrate && navigator.vibrate(p) } catch (e) { /* */ } }
