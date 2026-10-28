// Mobile build (VITE_MOBILE=1) — the standalone app-store version (Capacitor native shell).
//
// Workout data lives on the phone; only Supabase Auth and user-triggered backups use a
// network. Unlike guest mode in a browser, this is the user's primary copy of their training log, so it can't depend
// on WebView localStorage alone (iOS evicts that under storage pressure). Every persist()
// therefore also lands in a JSON file in the app's private data directory, and boot()
// restores from it. The workout reminder uses native local notifications scheduled per
// planned weekday — no server involved, unlike Web Push in the self-hosted version.
//
// Like the demo build, MOBILE is replaced at build time, so all of this folds away in
// web bundles; the Capacitor plugins are only ever imported behind it.
import { t } from './i18n.js'
import { Capacitor } from '@capacitor/core'
import { ACCENTS, DAYS } from './format.js'

export const MOBILE = import.meta.env.MODE === 'mobile' || import.meta.env.VITE_MOBILE === '1'
export const ANDROID_APP = MOBILE && Capacitor.getPlatform() === 'android'

let restNotificationPlugin
let streakWidgetPlugin
async function getRestNotificationPlugin() {
  if (!ANDROID_APP) return null
  if (!restNotificationPlugin) {
    const { registerPlugin } = await import('@capacitor/core')
    restNotificationPlugin = registerPlugin('RestNotification')
  }
  return restNotificationPlugin
}

async function getStreakWidgetPlugin() {
  if (!ANDROID_APP) return null
  if (!streakWidgetPlugin) {
    const { registerPlugin } = await import('@capacitor/core')
    streakWidgetPlugin = registerPlugin('StreakWidget')
  }
  return streakWidgetPlugin
}

export async function syncStreakWidget(S) {
  try {
    const plugin = await getStreakWidgetPlugin()
    if (!plugin) return false
    const dates = [...new Set((S.workouts || []).map(workout => workout.d).filter(Boolean))]
    await plugin.update({
      workoutDates: dates,
      week: S.week || {},
      dayPlan: S.dayPlan || {},
      accentColor: ACCENTS[S.accent]?.color || '#B8F36B',
      streakLabel: t('Daily streak'),
      shieldReady: t('Weekly shield ready'),
      shieldUsed: t('Weekly shield used'),
      dayLabels: [1, 2, 3, 4, 5, 6, 0].map(day => t(DAYS[day])),
    })
    return true
  } catch { return false }
}

export async function requestStreakWidgetPin() {
  try {
    const plugin = await getStreakWidgetPlugin()
    if (!plugin) return false
    const result = await plugin.pin()
    return result?.supported === true
  } catch { return false }
}

async function clearStreakWidget() {
  try { const plugin = await getStreakWidgetPlugin(); await plugin?.clear() } catch { /* Widget support is optional. */ }
}

export async function setNativeRestTimer(options) {
  try {
    const plugin = await getRestNotificationPlugin()
    if (!plugin) return false
    await plugin.setRestTimer(options)
    return true
  } catch { return false }
}

export async function clearNativeRestTimer() {
  try { const plugin = await getRestNotificationPlugin(); await plugin?.clearRestTimer() } catch { /* Native timer is optional. */ }
}

export async function requestRestNotificationPermission() {
  try {
    if (!ANDROID_APP) return false
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    let result = await LocalNotifications.checkPermissions()
    if (result.display !== 'granted') result = await LocalNotifications.requestPermissions()
    return result.display === 'granted'
  } catch { return false }
}

export async function listenRestNotificationEvents(onFinished) {
  const plugin = await getRestNotificationPlugin()
  if (!plugin) return null
  const finishedHandle = await plugin.addListener('restFinished', onFinished)
  return { remove: () => finishedHandle.remove() }
}

const FILE = 'opengym-state.json'

export async function nativeLoad() {
  try {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem')
    const r = await Filesystem.readFile({ path: FILE, directory: Directory.Data, encoding: Encoding.UTF8 })
    return JSON.parse(r.data)
  } catch (e) { return null }   // first launch, or unreadable — localStorage copy takes over
}

export async function nativeSave(state) {
  try {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem')
    await Filesystem.writeFile({ path: FILE, directory: Directory.Data, data: JSON.stringify(state), encoding: Encoding.UTF8 })
  } catch (e) { /* keep the localStorage copy */ }
}

export async function nativeClear() {
  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem')
    await Filesystem.deleteFile({ path: FILE, directory: Directory.Data })
  } catch (e) { /* File may not exist on a fresh install. */ }
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.cancel({ notifications: [0, 1, 2, 3, 4, 5, 6].map(d => ({ id: 100 + d })) })
  } catch (e) { /* Account deletion still clears app data if notifications are unavailable. */ }
  await clearStreakWidget()
}

// (Re)schedule the workout-day reminder: one repeating notification per weekday that has a
// routine in the weekly plan. The store calls this only when its schedule inputs change.
// `interactive` gates the OS permission prompt to the Settings toggle; a background resync
// never pops a dialog.
export async function syncReminder(S, interactive = false) {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.cancel({ notifications: [0, 1, 2, 3, 4, 5, 6].map(d => ({ id: 100 + d })) }).catch(() => {})
    const r = S.reminder
    if (!r?.on) return true
    let perm = await LocalNotifications.checkPermissions()
    if (perm.display !== 'granted' && interactive) perm = await LocalNotifications.requestPermissions()
    if (perm.display !== 'granted') return false
    const [hour, minute] = (r.time || '08:00').split(':').map(Number)
    const notifications = Object.entries(S.week || {})
      .filter(([, rid]) => rid && (S.routines || []).some(x => x.id === rid))
      .map(([day, rid]) => ({
        id: 100 + Number(day),
        title: t('Workout day'),
        body: t('{0} is on the plan today — let’s go!', S.routines.find(x => x.id === rid).name),
        // Capacitor weekdays are 1 (Sunday) … 7 (Saturday); S.week uses getDay() 0…6.
        schedule: { on: { weekday: Number(day) + 1, hour, minute }, allowWhileIdle: true },
      }))
    if (notifications.length) await LocalNotifications.schedule({ notifications })
    return true
  } catch (e) { return false }
}

// WKWebView can't do blob-URL downloads, so the backup goes out through the OS share sheet
// (Files, AirDrop, mail, …) from a temp file instead.
export async function shareExport(json, filename) {
  const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem')
  const { Share } = await import('@capacitor/share')
  const w = await Filesystem.writeFile({
    path: `shared-exports/${filename}`,
    directory: Directory.Cache,
    data: json,
    encoding: Encoding.UTF8,
    recursive: true,
  })
  await Share.share({ title: filename, url: w.uri })
}
