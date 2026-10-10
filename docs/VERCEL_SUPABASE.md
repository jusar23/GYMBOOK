# Vercel + Supabase deployment

This deployment serves the Vite frontend from Vercel and routes `/api/*` to a Vercel Node function. The API keeps GYMBOOK's existing passkey and session-cookie behavior; Supabase Postgres stores the API's JSON snapshot. The service-role/database credential is server-side only.

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
2. Add these server-side environment variables to Vercel (Production and Preview only if needed):

   - `SUPABASE_DB_URL`: the Transaction pooler connection string.
   - `RP_ID`: the exact hostname Vercel assigns, without `https://` (for example `gymbook-example.vercel.app`).
   - `ORIGIN`: the matching origin, with scheme and no trailing slash (for example `https://gymbook-example.vercel.app`).
   - `RP_NAME`: `GYMBOOK`.
   - `INVITE_ONLY`: `1` during the first account restoration, so the one-time recovery code field is shown.
   - `VITE_IMG_BASE`: `https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@7455efae41b330c265e7cd4b78dfa848e7ce5ebd/images/`
   - `VITE_GIF_BASE`: `https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@7455efae41b330c265e7cd4b78dfa848e7ce5ebd/videos/`

3. Deploy. Use the final, stable hostname before registering a new passkey; changing `RP_ID` later invalidates passkeys.
4. Open the deployed site, choose **Create profile**, enter the existing profile name and its one-time recovery code. This creates a new passkey for the deployed hostname while keeping the imported user ID and workout data.
5. Verify `/api/health` reports `ok: true` and open the profile to confirm its history. Keep the local Docker instance and `data` folder as a backup until this is confirmed.

## Notes and limits

- This adapter stores the file-backed API database in one JSONB row and serializes requests with a Postgres row lock. It is intended for a personal GYMBOOK instance, not a large multi-user service.
- The Vercel adapter cannot keep a Node process alive for rest-timer push notifications. Normal workout tracking, passkey login and server sync are supported; scheduled rest-timer pushes are not.
- Vercel Hobby and Supabase Free are subject to their current usage caps; Supabase may pause an inactive free project. Keep a separate backup of `data` before migration.
- The current 1.2.4 frontend does not include the newer native-app pairing screen/routes. Use the deployed site as an installable Android web app first; native APK pairing requires a later API/frontend upgrade.
