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
The Android home-screen streak widget reads a private on-device summary, updates with the
selected accent color, and refreshes its daily count from the saved workout dates and plan.
The first missed scheduled workout day of each week uses that week's streak shield; it never
adds a day to the streak. Planned rest days neither break nor increase the streak.

Copy `frontend/.env.example` to `frontend/.env.local` and set `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` before building the APK. Configure the desired Auth providers and redirect URLs in Supabase. Backup
and restore require an internet connection; local tracking does not.

For a Google Play release with subscriptions, also configure `VITE_RC_ANDROID_API_KEY` with
the public Android SDK key from RevenueCat. The app uses Google Play Billing for Android.
The app's first month of access starts at account registration without asking for a payment
method; subscription plans are offered after that period. Configure the monthly and annual
products, entitlement and current offering in Google Play and RevenueCat before uploading a
release. Do not attach a Play free-trial offer on top of the app's free month. Never put
RevenueCat secret keys or Google service-account credentials in the app.

For Google sign-in to return to Android, add `com.jusar23.gymbook://auth-callback` to
Supabase Auth's allowed redirect URLs. Keep the Google provider's OAuth callback set to
Supabase's own `/auth/v1/callback` URL. The Android app opens the system sign-in tab and
closes it after Supabase redirects back into Gymbook.

To bring existing web progress onto the phone, export its JSON backup from Settings, import
that file in the APK, then use **Back up to Supabase** once if you want a cloud safety copy.
Signing in alone does not copy workout data from the old web deployment.

## Prerequisites

- Node 22+
- **Android:** Android Studio Otter 2025.2.1+, Android SDK Platform 36 and build tools
  (bundled through SDK Manager). Java 21 for Gradle.
- **iOS:** a Mac with Xcode 26+ and CocoaPods (`brew install cocoapods`). A free Apple ID
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

The Android and iOS icon and splash assets are checked into their native projects. The
optional `@capacitor/assets` generator is not included in the app toolchain; update those
assets with a separately reviewed image workflow if the branding changes.

## Distribution

GYMBOOK is being prepared for Google Play distribution. New Play apps are uploaded as a
signed Android App Bundle (AAB), not as an APK. The project currently targets API 36. Before
release, complete the current Play Console requirements, health-app and Data safety
declarations, publish and verify the account-deletion URL, and configure a private upload
keystore. Google Play App Signing should manage the app-signing key; keep a secure backup of
the upload keystore and its passwords outside the repository.

### Play Console checklist

- Register the permanent package name `com.jusar23.gymbook` and complete developer-account
  verification in Play Console.
- Complete the store listing, content rating, target-audience and app-access details. The app
  is intended for adults and requires an account.
- Complete the Health apps declaration for exercise/workout tracking and body-weight tracking.
- Complete Data safety and data-deletion declarations to match the app, Supabase Auth and
  backups, RevenueCat, Google Play Billing, and the published privacy policy.
- Use [`docs/GOOGLE_PLAY_DECLARATIONS.md`](GOOGLE_PLAY_DECLARATIONS.md) as the draft for the
  Health apps and Data safety forms; verify the public policy/deletion URLs and production
  provider settings before submitting.
- Publish a public privacy-policy page and a public account-deletion request page. Add both
  URLs to Play Console. The app also has an in-app account-deletion action.
- Create monthly and annual Google Play subscription products. Configure monthly at
  USD 1/month and annual at USD 12/year, with the eligible USD 9 first-year offer if that
  pricing remains current. The app's one-month access period is separate from billing and
  does not require payment details.
- Upload the signed AAB to an internal testing track. Verify signup, the free-period end,
  monthly and annual purchases, cancellation/expiry, restore purchases, and account deletion
  before requesting production review.

### Android — sideload the APK

For local installation, build a debug APK with `./gradlew assembleDebug`. For Play Console,
build a release AAB with `bundleRelease` and sign it with the upload keystore configured
outside the repository. After the free account-registration period expires, the app gates
training behind the available monthly and annual Google Play plans.

To build and sign your own:

```sh
cd frontend && npm run build:mobile
cd android && ./gradlew bundleRelease              # → app/build/outputs/bundle/release/app-release.aab

# one-time: create and securely back up an upload key outside the repository.
keytool -genkeypair -keystore C:/secure/path/gymbook-upload.jks -alias gymbook-upload -keyalg RSA -validity 10950

# Copy app/keystore.properties.example to app/keystore.properties (gitignored),
# then set storeFile, storePassword, keyAlias and keyPassword for your upload key.
# Run bundleRelease again so Gradle signs the AAB.
```

The upload key is distinct from the app-signing key managed by Play App Signing. Do not
commit either the keystore or `keystore.properties`. The checked-in example is a template;
the project does not include a release key. A signed release bundle is required for upload.

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
- **License:** the project is AGPL-3.0, which by itself sits badly with app-store terms of
  service. `NOTICE.md` carries an app-store exception (an additional permission under
  AGPL §7) granted by the copyright holder — relevant only if store distribution ever happens.
- The app requests notification permission only when the workout-day reminder is switched
  on, and (on Android) declares `SCHEDULE_EXACT_ALARM` so the reminder fires to the minute
  where the user allows it.
