-- One explicit, user-owned cloud backup for the standalone mobile app.
-- A single JSONB snapshot per user minimizes tables, indexes, and network requests.
-- The app writes this table on explicit backup requests and, with separate consent,
-- after each completed mobile workout.
create table if not exists public.gymbook_backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.gymbook_backups enable row level security;
revoke all on table public.gymbook_backups from anon;
grant select, insert, update, delete on table public.gymbook_backups to authenticated;

drop policy if exists "Users manage their own gymbook backup" on public.gymbook_backups;
create policy "Users manage their own gymbook backup"
  on public.gymbook_backups
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Make the new table visible to the Supabase REST API immediately.
notify pgrst, 'reload schema';
