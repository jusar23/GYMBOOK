-- Manual, per-account access exemptions. Manage grants from the Supabase SQL editor;
-- authenticated app users can only read their own expiry and cannot change any row.
create table if not exists public.gymbook_subscription_exemptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  note text
);

alter table public.gymbook_subscription_exemptions enable row level security;
revoke all on public.gymbook_subscription_exemptions from anon, authenticated;
grant select on public.gymbook_subscription_exemptions to authenticated;

drop policy if exists "Users can read their own subscription exemption" on public.gymbook_subscription_exemptions;
create policy "Users can read their own subscription exemption"
  on public.gymbook_subscription_exemptions
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Example (run manually in Supabase SQL editor to exempt one user indefinitely):
-- insert into public.gymbook_subscription_exemptions (user_id, note)
-- values ('AUTH_USER_UUID', 'Complimentary access granted by account owner')
-- on conflict (user_id) do update set granted_at = now(), expires_at = null, note = excluded.note;
-- For time-limited access, set expires_at to a future timestamp.
-- To revoke an exemption, delete that user's row from the table.

notify pgrst, 'reload schema';
