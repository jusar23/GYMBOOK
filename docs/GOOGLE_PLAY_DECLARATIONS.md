# Google Play: Health apps and Data safety declarations

Working draft for the Android package `com.jusar23.gymbook`, based on the source and
release manifest in this repository. Complete the forms in Play Console and compare this
draft with the exact release AAB and the production Supabase/RevenueCat configuration.
The Play form describes every version currently distributed under this package.

## Health apps declaration

In Play Console, open **Policy and programs → App content → Health apps** and declare:

- **Health and fitness → Activity and Fitness**: the app records exercise routines,
  workouts, sets, repetitions, loads and body weight.
- Do **not** select Nutrition and Weight Management: this app does not log food, plan
  diets, or provide weight-loss/weight-management programs.
- Do **not** select Medical categories: the app does not diagnose, treat, prevent or
  monitor disease or injury and is not clinical decision-support software.
- If the form asks for a description: “Gym Book Training lets adults plan and record
  strength-training workouts and optional body-weight entries. It is for fitness logging
  only, not medical diagnosis, treatment or clinical monitoring.”

Google requires this declaration for published apps, including testing tracks. Activity
and Fitness expressly includes workout recording and measuring weight/body composition.

## Data safety declaration

In Play Console, open **Policy → App content → Data safety**. Suggested answers for the
current Android implementation:

### App overview

- Does the app collect or share required user data types? **Yes**.
- Is all collected user data encrypted in transit? **Yes**, for the configured Supabase,
  Google sign-in, RevenueCat and Google Play network services (HTTPS/TLS). Reconfirm the
  production endpoints and SDK configuration before submission.
- Do users have a way to request that their data be deleted? **Yes**. In-app: Settings →
  Delete account. Web: `https://gymbooktraining.com/#/delete-account`.
- Account creation is required. The public privacy policy is intended to be at
  `https://gymbooktraining.com/#/legal/privacy`; verify that both URLs open without login,
  are publicly accessible in a browser and are the exact URLs entered in Play Console.

### Data types to declare

| Play Console data type | Collected? | Purpose | Required / optional | Notes |
|---|---|---|---|---|
| Personal info → Name | Yes | App functionality, account management | Required to create an account | Profile name sent to Supabase Auth. |
| Personal info → Email address | Yes | App functionality, account management | Required to create an account | Sign-in and account recovery/contact. |
| Personal info → User IDs | Yes | App functionality, account management, fraud prevention/security | Required | Supabase account UUID is also passed to RevenueCat as its App User ID. |
| Personal info → Other info | Yes | App functionality, account management | Required during account setup | Date of birth and country. Do not also select address, phone, or financial account details. |
| Health and fitness → Fitness info | Yes | App functionality | Optional for logging workouts | Workout routines, exercises, dates, sets, reps, loads and effort ratings. Stored locally; uploaded to Supabase only after separate backup consent. |
| Health and fitness → Health info | Yes | App functionality | Optional | Optional body-weight records. Treat as sensitive in the privacy policy and retain the separate in-app consent. |
| Financial info → Purchase history | Yes | App functionality and Analytics (RevenueCat’s Play declaration guidance) | Required for subscription access | RevenueCat receives purchase/subscription identifiers and entitlement/status; Google Play processes checkout. Do not declare card/bank information: Gym Book Training does not access it. |

For every row, mark **Collected** and **not processed ephemerally**. The account fields and
purchase status are transmitted off-device. Workout and body-weight data are transmitted
only when the user separately enables cloud backup; local-only use remains on-device.

### Sharing and service-provider treatment

The default draft is **not shared** for these rows where Supabase, RevenueCat and Google
Play process the data solely to provide the features requested by the user and meet Play’s
service-provider/payment-provider exceptions. Google Play itself handles the purchase.
Before choosing “not shared,” check the current provider contracts and the RevenueCat
project integrations. If data is sent to an integration that is not a service provider,
declare the relevant data as shared and its purpose. Do not enable RevenueCat integrations
for advertising/analytics without revisiting this form.

### Do not declare for the current Android build

- User payment info (card/bank number): the app never receives it; Google Play handles it.
- Approximate or precise location: no location permissions and no feature infers location
  from IP.
- Contacts, photos/videos, audio, messages, calendar, app interactions, web browsing,
  health records/diagnostics or crash logs: no corresponding Android feature or SDK found.
- Device or other IDs: the release manifest has no Android Advertising ID permission and
  the app does not call RevenueCat’s optional `collectDeviceIdentifiers()` method. Recheck
  this if the SDK version/configuration or manifest changes.
- Advertising, marketing or third-party analytics: no ads or analytics SDK is configured.

The Android merged release manifest includes Internet, Google Play Billing, notifications,
boot receiver, wake lock, exact-alarm and network-state permissions. Notification reminders
are scheduled locally; they do not upload workout content. These are not themselves Data
safety data types.

## Before submitting

1. Verify the public privacy and deletion URLs above against the deployed website. Google
   requires an active, public privacy policy and in-app access to it.
2. Check RevenueCat’s Google Play Data safety guidance and dashboard integrations for the
   release project; the SDK owner recommends declaring Purchase history and selecting the
   purposes App functionality and Analytics.
3. Confirm the Supabase project’s configured region, production log/back-up retention, and
   deletion behavior. The policy currently describes provider backup rotation without a
   numeric maximum because that setting is not stored in this repository; record the actual
   configured period before publishing the policy.
4. Confirm the public account-deletion request flow is monitored and requests are completed
   within Google Play’s required timeframe. In-app deletion removes the account and linked
   active backup; deletion does not cancel the user’s Google Play subscription.
5. Re-run this review after changing SDKs, permissions, billing integrations, cloud backup,
   data fields or website integrations. The Play declaration must match the AAB actually
   uploaded, not only this draft.

## Official references

- [Google Play: Health apps declaration](https://support.google.com/googleplay/android-developer/answer/14738291?hl=en)
- [Google Play: Data safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)
- [Google Play: health content and services](https://support.google.com/googleplay/android-developer/answer/16679511?hl=en)
- [Google Play: account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en)
- [RevenueCat: Google Play Data safety](https://www.revenuecat.com/docs/platform-resources/google-platform-resources/google-plays-data-safety)
