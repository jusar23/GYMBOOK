# Building the mobile app (iOS / Android)

openGym ships in two flavors from the same codebase:

| | **Self-hosted** (this repo's default) | **Mobile app** (`VITE_MOBILE=1`) |
|---|---|---|
| Runs | in any browser, against your own server | natively on iPhone / Android (Capacitor shell) |
| Accounts | passkey sign-in, one profile per person | Supabase Auth (email/password and configured providers) |
| Data | synced to your server, readable on desktop | stays on the phone; optional manual Supabase backup from Settings |
| Reminders | Web Push from your server | native local notifications, no server involved |
| Exercise media | served by your server (`img/`, `gif/`) | packaged in the APK for offline use |

The mobile flavor does not use the app API or sync workout data automatically. Supabase Auth
is used for sign-in; workout data remains in the app's private storage and is mirrored to
`opengym-state.json` on every change. Exercise images and animations are packaged in the APK,
so workouts do not need a media CDN. In Settings, a signed-in user can explicitly save one
cloud backup or restore it. Apply `supabase/002_gymbook_manual_backups.sql` to create the
per-user, row-level-secured backup table. JSON file export/import remains available as well.

Copy `frontend/.env.example` to `frontend/.env.local` and set `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` before building the APK. Configure the desired Auth providers and redirect URLs in Supabase. Backup
and restore require an internet connection; local tracking does not.

For Google sign-in to return to Android, add `com.jusar23.gymbook://auth-callback` to
Supabase Auth's allowed redirect URLs. Keep the Google provider's OAuth callback set to
Supabase's own `/auth/v1/callback` URL. The Android app opens the system sign-in tab and
closes it after Supabase redirects back into Gymbook.

To bring existing web progress onto the phone, export its JSON backup from Settings, import
that file in the APK, then use **Back up to Supabase** once if you want a cloud safety copy.
Signing in alone does not copy workout data from the old web deployment.

## Prerequisites

- Node 20+
- **Android:** Android Studio (bundles the SDK). Java 21 for Gradle.
- **iOS:** a Mac with Xcode 15+ and CocoaPods (`brew install cocoapods`). A free Apple ID
  is enough to run the app on your own iPhone (see below); paid membership is only needed
  for App Store distribution, which openGym doesn't do.

## Build & run

```sh
cd frontend
npm install
npm run build:mobile        # VITE_MOBILE build + `cap sync` into android/ and ios/

npx cap open android        # opens Android Studio → run on emulator or device
npx cap open ios            # opens Xcode (Mac only) → set your signing team, then run
```

`npm run build:mobile` bakes the CDN media base into the bundle and copies the web build
into both native projects — re-run it after every web-code change before building natively.

> **Heads-up:** after `build:mobile`, `frontend/dist` contains the *mobile* bundle.
> Run a plain `npm run build` again before deploying `dist` to a server.

## App icons & splash screens

`frontend/resources/icon.svg` is the 1024×1024 source (the app's dumbbell glyph on the
app background). Generate all platform assets from it on a machine with the tooling:

```sh
cd frontend
npx @capacitor/assets generate --iconBackgroundColor '#0c0e12' --splashBackgroundColor '#0c0e12'
```

(If the generator won't take the SVG directly, export it to `resources/icon.png` at
1024×1024 first — any image tool can do it.)

## Distribution — deliberately no app stores

openGym's mobile app is not on the Play Store or App Store, and that's a choice: no store
accounts, no store rules, no yearly fees between you and an open-source app.

### Android — sideload the APK

The official signed APK is at **[opengym.duarte-santos.ch](https://opengym.duarte-santos.ch)**.
Android asks you to allow installs from the browser the first time — that's standard for any
app outside the Play Store.

To build and sign your own:

```sh
cd frontend && npm run build:mobile
cd android && ./gradlew assembleRelease            # → app/build/outputs/apk/release/app-release-unsigned.apk

# one-time: create a keystore. KEEP IT — updates must be signed with the same key,
# or Android refuses to install the new version over the old one.
keytool -genkeypair -keystore my.keystore -alias opengym -keyalg RSA -validity 10950

# align + sign (zipalign/apksigner ship with the Android SDK build-tools)
zipalign -f -p 4 app-release-unsigned.apk aligned.apk
apksigner sign --ks my.keystore --ks-key-alias opengym --out openGym.apk aligned.apk
```

### iPhone — what's actually possible

Apple does not allow installing apps outside the App Store, so there is no `.ipa` download
that would simply install. Your free options:

- **Self-host + PWA** (recommended): open your instance in Safari → Share → *Add to Home
  Screen*. Full-screen app, no expiry, plus sync and passkeys.
- **Xcode free signing:** open `ios/` in Xcode with a free Apple ID as the team and run it
  onto your own iPhone. Apple expires the signature after 7 days; re-run from Xcode to renew.
- **AltStore:** automates that 7-day re-signing over Wi-Fi via a Mac companion app.

### Release notes for maintainers

- Bump `versionName`/`versionCode` in `android/app/build.gradle` per release; keep them in
  step with `frontend/package.json`. `versionCode` must strictly increase or updates won't
  install over an existing APK.
- **License:** openGym is AGPL-3.0, which by itself sits badly with app-store terms of
  service. `NOTICE.md` carries an app-store exception (an additional permission under
  AGPL §7) granted by the copyright holder — relevant only if store distribution ever happens.
- The app requests notification permission only when the workout-day reminder is switched
  on, and (on Android) declares `SCHEDULE_EXACT_ALARM` so the reminder fires to the minute
  where the user allows it.
