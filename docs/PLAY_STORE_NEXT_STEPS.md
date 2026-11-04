# Google Play release status

Status reviewed on 2026-11-02. This is a preparation checklist, not a Play Console submission.

## Prepared in the project

- Android package: `com.jusar23.gymbook`.
- Android target API: 36, meeting the current new-app submission requirement.
- App version aligned at `1.2.10` in `frontend/package.json` and `frontend/android/app/build.gradle`; Android version code is 11.
- npm dependencies installed to match the declared Capacitor 8 and RevenueCat 14 versions; the lockfile version is aligned.
- Mobile web assets and native plugins synchronized successfully.
- Release AAB builds successfully at `frontend/android/app/build/outputs/bundle/release/app-release.aab` (about 61.6 MB).
- The AAB is **unsigned**. No upload keystore or `frontend/android/app/keystore.properties` exists, so the AAB cannot be uploaded to Play yet.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured locally. Confirm that they point to the production Supabase project before release.
- `VITE_RC_ANDROID_API_KEY` is not configured in the local mobile environment. Billing will not be enabled in this build. The app defaults to the entitlement ID `gymbook_premium`.
- A Spanish Play feature graphic draft is available at `assets/play-store/feature-graphic-es.jpg` (editable source: `assets/play-store/feature-graphic-es.svg`).
- The existing screenshots under `assets/screenshots/` show the old `openGym` branding, so do not upload them as Gymbook store screenshots. Capture current Gymbook screens from the production-ready Android app.

## Owner actions needed

1. Configure the public Android SDK key from the production RevenueCat project in `frontend/.env.mobile` (or the existing local environment file used for mobile builds). Do not send the key in chat. Confirm the `gymbook_premium` entitlement and the Google Play monthly and annual products/offerings in RevenueCat.
2. Confirm the production Supabase URL and publishable/anon key are the ones currently configured locally. Verify that signup, password recovery, cloud backup consent, and account deletion use the production project.
3. Create or locate the Play upload keystore. If this app already has a Play Console listing, use its existing upload key or follow Play Console's key-reset process; do not create a replacement casually. Keep the key and passwords backed up outside the repository. Copy `frontend/android/app/keystore.properties.example` to `frontend/android/app/keystore.properties` and fill it locally.
4. Publish and test these public pages without login: `https://gymbooktraining.com/#/legal/privacy` and `https://gymbooktraining.com/#/delete-account`. Confirm the delete request reaches the deployed Supabase function and removes the account's associated server data.
5. Capture at least two current screenshots of the Gymbook app for the phone listing; the old screenshots in `assets/screenshots/` have different branding. Review the Spanish feature graphic draft before using it.
6. In Play Console, complete the store listing, app access instructions for reviewers, target audience, ads declaration, content rating, Health apps declaration, and Data safety form. Use `docs/GOOGLE_PLAY_DECLARATIONS.md` as a draft and compare it to the production integrations.
7. Upload the signed AAB to internal/closed testing and check login, subscriptions, restore/cancel, workout logging, and account deletion. If the developer account is a newer personal account, confirm whether the 12-tester/14-day closed-test requirement applies.
8. Confirm distribution rights before release: `NOTICE.md` attributes the app code to openGym's copyright holder and describes an app-store exception for the openGym mobile application. It also says exercise media comes from a separate dataset whose terms must be checked before redistribution. Confirm that the exception covers the Gymbook-branded release and that the included exercise media may ship in the Play build.

## Rebuild after owner configuration

From `frontend/` run `npm run build:mobile`, then from `frontend/android/` run `gradlew.bat bundleRelease`. The release signing configuration is read from the ignored local `app/keystore.properties`; do not commit that file or the keystore.
