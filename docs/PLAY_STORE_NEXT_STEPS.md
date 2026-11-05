# Google Play release status

Status reviewed on 2026-11-04. This is a preparation checklist, not a Play Console submission.

## Prepared in the project

- Android package: `com.jusar23.gymbook`.
- Android target API: 36, meeting the current new-app submission requirement.
- App version aligned at `1.2.11` in `frontend/package.json` and `frontend/android/app/build.gradle`; Android version code is 12.
- npm dependencies installed to match the declared Capacitor 8 and RevenueCat 14 versions; the lockfile version is aligned.
- Mobile web assets and native plugins synchronized successfully for the current app source.
- Signed release AAB generated at `frontend/android/app/build/outputs/bundle/release/app-release.aab` (about 67.6 MB); manifest verified as package `com.jusar23.gymbook`, version `1.2.11`, version code 12.
- The ignored local `frontend/android/app/keystore.properties` and upload keystore are present. The AAB signature verifies with the configured upload key.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured locally. Confirm that they point to the production Supabase project before release.
- The local mobile environment has a production Android RevenueCat SDK key and entitlement ID `gymbook_training_premium`. Confirm the monthly/yearly products and Offering. The last known Google Play service-credential validation failed on subscription purchase access; recheck this in RevenueCat before testing purchases.
- A Play Store visual pack is available under `assets/play-store/`: 512 × 512 app icon, 1024 × 500 feature graphics in Spanish and English, and five 1080 × 1920 screenshot layouts.
- The screenshot layouts use the existing app captures and show English UI. Use them for the English listing after checking they match the current release; capture the same screens with Gymbook set to Spanish before using them on a Spanish localized listing.
- Release configuration uses R8 optimized rules, optimized resource shrinking, and `SYMBOL_TABLE`. No separate `native-debug-symbols.zip` was found in the build outputs, so confirm whether Play Console still shows the native-symbol warning for included third-party libraries.

## Owner actions needed

1. Confirm the `gymbook_training_premium` entitlement and the Google Play monthly and annual products/Offering in RevenueCat. Keep the public Android SDK key in the ignored local environment file; do not commit or paste it into chat.
2. Confirm the production Supabase URL and publishable/anon key are the ones currently configured locally. Verify that signup, password recovery, cloud backup consent, and account deletion use the production project.
3. Keep the existing Play upload keystore and local `frontend/android/app/keystore.properties` backed up securely outside the repository. Do not replace the upload key casually.
4. Publish and test these public pages without login: `https://gymbooktraining.com/#/legal/privacy` and `https://gymbooktraining.com/#/delete-account`. Confirm the delete request reaches the deployed Supabase function and removes the account's associated server data.
5. Review the prepared Play Store assets. Capture current Gymbook screens in Spanish before using them on the Spanish localized listing.
6. In Play Console, complete the store listing, app access instructions for reviewers, target audience, ads declaration, content rating, Health apps declaration, and Data safety form. Use `docs/GOOGLE_PLAY_DECLARATIONS.md` as a draft and compare it to the production integrations.
7. Upload the signed AAB to internal/closed testing and check login, subscriptions, restore/cancel, workout logging, and account deletion. If the developer account is a newer personal account, confirm whether the 12-tester/14-day closed-test requirement applies.
8. Confirm distribution rights before release: `NOTICE.md` attributes the app code to openGym's copyright holder and describes an app-store exception for the openGym mobile application. It also says exercise media comes from a separate dataset whose terms must be checked before redistribution. Confirm that the exception covers the Gymbook-branded release and that the included exercise media may ship in the Play build.

## Rebuild after owner configuration

To rebuild after app changes, from `frontend/` run `npm run build:mobile`, then from `frontend/android/` run `gradlew.bat bundleRelease`. The release signing configuration is read from the ignored local `app/keystore.properties`; do not commit that file or the keystore.
