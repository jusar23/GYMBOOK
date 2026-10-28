# Subscriptions setup

Gym Book Training uses one RevenueCat entitlement, `gymbook_premium`, to check access across Google Play and the account website. Android purchases are processed by Google Play Billing. Website purchases are processed by Paddle Billing through RevenueCat Web. Supabase Auth user UUIDs are used as the shared RevenueCat App User ID so the same account keeps access on each platform.

## Prices and billing terms

- New mobile accounts get one month of app access from account registration without providing a payment method. At the end of that period, the app asks the user to choose a monthly or annual plan. Billing begins when the user confirms a plan in Google Play; no subscription is reserved or charged during the free access period.
- Monthly: USD 1 per month, auto-renewing until canceled.
- Annual promotion for eligible new subscribers: USD 9 for the first year, then USD 12 per year, auto-renewing until canceled. Checkout shows the plan and eligibility that apply to each account.
- Store and Paddle may localize the actual price and currency by country. The checkout must display the localized amount, renewal amount, billing interval, automatic-renewal and cancellation terms before confirmation.
- Cancel through Google Play Subscriptions for Play purchases, or the Paddle customer portal for website purchases. Access continues through the paid period. Uninstalling the app does not cancel a subscription.

## RevenueCat configuration

1. Create a RevenueCat project and add the Android app with package ID `com.jusar23.gymbook`.
2. Create an entitlement named `gymbook_premium`.
3. Connect Google Play and import the monthly and annual subscription products. Configure the monthly base plan at USD 1/month. Configure the annual base plan at USD 12/year and a one-billing-period introductory offer at USD 9 for eligible new subscribers. Do not attach a free-trial offer: the app already grants one month of access before opening the purchase screen. The purchase screen reads localized prices and offer terms from the store.
4. Connect Paddle Billing for the website. Create monthly USD 1 and annual USD 12 products, then configure a first-year USD 9 discount limited to the first billing cycle. Configure the products to unlock the same `gymbook_premium` entitlement and map the product packages to the current RevenueCat offering.
5. Configure subscription management URLs in Paddle and verify RevenueCat returns its provider-specific management URL. Google Play purchases use the Google Play management URL.
6. Add sandbox users and test new purchases, renewals, cancellation, restore, expired access, and a web purchase followed by Android sign-in before enabling production billing.

## Environment variables

Copy the public SDK keys from RevenueCat into `frontend/.env.local` and the deployment environment. These are publishable SDK keys, not secret API keys.

```dotenv
VITE_RC_ANDROID_API_KEY=goog_public_sdk_key
VITE_RC_WEB_API_KEY=rcb_public_sdk_key
VITE_RC_ENTITLEMENT_ID=gymbook_premium
```

Never add RevenueCat secret keys, Paddle API keys, Google service-account credentials, or Supabase service-role keys to a `VITE_` variable or the mobile app.

## Supabase access exemptions

Run `supabase/005_subscription_exemptions.sql` and `supabase/006_validate_gymbook_backups.sql` in the Supabase SQL editor. The first creates private, owner-managed complimentary access; the second validates backup shape and size on the database server. To grant access to one selected account, find its UUID and create an exemption (replace the example email):

```sql
select id, email from auth.users where lower(email) = lower('person@example.com');

insert into public.gymbook_subscription_exemptions (user_id, note)
select id, 'Complimentary access granted by account owner'
from auth.users
where lower(email) = lower('person@example.com')
on conflict (user_id) do update
set granted_at = now(), expires_at = null, note = excluded.note;
```

Use a future `expires_at` for time-limited access. Delete only that user's row to revoke the exemption. App users can read only their own expiry; they cannot grant themselves access.
