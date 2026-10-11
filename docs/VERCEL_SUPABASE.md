# Vercel + Supabase deployment

This deployment serves the Vite frontend from Vercel and routes `/api/*` to a Vercel Node function. Supabase Auth handles email/password and Google sign-in; the API exchanges verified Supabase sessions for its existing HttpOnly app cookie, while Postgres stores workout snapshots. Existing passkey sign-in remains available. Passwords and access tokens are not stored in the workout snapshot.

## Supabase setup

1. Create a Supabase project and open **SQL Editor**.
2. Run `supabase/001_opengym_snapshot.sql`.
3. In **Connect**, copy the **Transaction pooler** connection string. Keep it private.
4. On the Windows PC, set `SUPABASE_DB_URL` for the one-time import, then from the repository root run:

   ```powershell
   $secure = Read-Host "Supabase transaction-pooler connection string" -AsSecureString
   $env:SUPABASE_DB_URL = [System.Net.NetworkCredential]::new("", $secure).Password
   npm --prefix api ci
   npm --prefix api run migrate:supabase
   Remove-Item Env:SUPABASE_DB_URL
   Remove-Variable secure
   ```

   The import reads `data/db.json`, `data/secret`, `data/vapid.json` and `data/state-*.json`. It does not delete or modify those local files. It stops if the Supabase snapshot already has profiles or workout states.

5. Save the one-time recovery code printed for each profile. Do not commit it or send it in chat.

## Vercel setup

1. Import the repository into Vercel with the repository root as the project root. `vercel.json` installs the root/API/frontend dependencies and builds `frontend/dist`.
2. In Supabase **Authentication → URL Configuration**, set the production site URL and add the exact Vercel URL and local app URL (for example `http://localhost:8080/` in Docker or the Vite URL in development) to the redirect allow list.
3. In Supabase **Authentication → Providers**, enable **Email** and **Google**. To enable Google, create a Google OAuth Web client, add the Supabase project's callback URL shown on the Google provider page as an authorized redirect URI, then paste the Google client ID and secret into Supabase. Also add the Vercel site's origin as an authorized JavaScript origin in Google Cloud.
4. Add these environment variables to Vercel. The `VITE_` values are public client configuration; use only the Supabase publishable/anon key, never a `service_role` key:

   - `SUPABASE_DB_URL`: the Transaction pooler connection string (server only).
   - `SUPABASE_URL`: the Supabase project URL (server only).
   - `SUPABASE_ANON_KEY`: the Supabase publishable/anon key (server only, used to validate sessions).
   - `VITE_SUPABASE_URL`: the same Supabase project URL (available during frontend build).
   - `VITE_SUPABASE_ANON_KEY`: the same publishable/anon key (available during frontend build).
   - `RP_ID`: the exact hostname Vercel assigns, without `https://` (for example `gymbook-example.vercel.app`).
   - `ORIGIN`: the matching origin, with scheme and no trailing slash (for example `https://gymbook-example.vercel.app`).
   - `RP_NAME`: `gymbook`.
   - `INVITE_ONLY`: optional; when `1`, it restricts passkey profile creation. Email/Google accounts remain available.
   - `VITE_IMG_BASE`: `https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@7455efae41b330c265e7cd4b78dfa848e7ce5ebd/images/`
   - `VITE_GIF_BASE`: `https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@7455efae41b330c265e7cd4b78dfa848e7ce5ebd/videos/`

5. Deploy. Use the final, stable hostname before registering a new passkey; changing `RP_ID` later invalidates passkeys.
6. On first sign-in with Google or email, enter the one-time recovery code for an imported profile in the optional recovery-code field. This links the Supabase Auth account to that profile and preserves its existing workout history. The code is consumed once. New users leave the field blank.
7. Verify `/api/health` reports `ok: true`, then sign in and confirm that the expected profile and history appear. Keep the local Docker instance and `data` folder as a backup until confirmed.

Email signup starts a session immediately when Supabase email confirmations are disabled. If confirmations are enabled, GYMBOOK asks the user to confirm their email and then sign in. The client stores only Supabase's refreshable session locally; the server stores the internal profile link and workout state.

For local Docker, add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to the existing root `.env` (keep its other settings) before rebuilding the web image. `.env.example` shows the expected names. For local Vite development, copy `frontend/.env.example` to `frontend/.env.local` and set the same two values; also set `SUPABASE_URL` and `SUPABASE_ANON_KEY` for the API process.

## Notes and limits

- This adapter stores the file-backed API database in one JSONB row and serializes requests with a Postgres row lock. It is intended for a personal GYMBOOK instance, not a large multi-user service.
- The Vercel adapter cannot keep a Node process alive for rest-timer push notifications. Normal workout tracking, passkey login and server sync are supported; scheduled rest-timer pushes are not.
- Vercel Hobby and Supabase Free are subject to their current usage caps; Supabase may pause an inactive free project. Keep a separate backup of `data` before migration.
- The current 1.2.4 frontend does not include the newer native-app pairing screen/routes. Use the deployed site as an installable Android web app first; native APK pairing requires a later API/frontend upgrade.
