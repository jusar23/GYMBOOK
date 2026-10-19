-- Consent is checked by Supabase itself so authenticated REST calls cannot bypass
-- the app's opt-in. Revocation blocks reads/writes but deliberately retains backups.
create table if not exists public.gymbook_backup_consents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  accepted boolean not null default false,
  consent_version text not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.gymbook_backup_consent_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  accepted boolean not null,
  consent_version text not null,
  recorded_at timestamptz not null default now()
);

alter table public.gymbook_backup_consents enable row level security;
alter table public.gymbook_backup_consent_events enable row level security;
revoke all on table public.gymbook_backup_consents, public.gymbook_backup_consent_events from anon, authenticated;

create or replace function public.gymbook_backup_consent_active()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.gymbook_backup_consents c
    where c.user_id = auth.uid()
      and c.accepted
      and c.consent_version = '1.7'
  );
$$;

create or replace function public.gymbook_get_backup_consent()
returns table(accepted boolean, consent_version text)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select c.accepted, c.consent_version
  from public.gymbook_backup_consents c
  where c.user_id = auth.uid();
$$;

create or replace function public.gymbook_set_backup_consent(p_accepted boolean, p_version text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'Authentication required.' using errcode = '28000';
  end if;
  if p_accepted and p_version is distinct from '1.7' then
    raise exception 'Current consent version required.' using errcode = '22023';
  end if;

  insert into public.gymbook_backup_consents(user_id, accepted, consent_version, accepted_at, revoked_at)
  values (caller, p_accepted, p_version, case when p_accepted then now() end, case when p_accepted then null else now() end)
  on conflict (user_id) do update set
    accepted = excluded.accepted,
    consent_version = excluded.consent_version,
    accepted_at = case when excluded.accepted then now() else public.gymbook_backup_consents.accepted_at end,
    revoked_at = case when excluded.accepted then null else now() end,
    updated_at = now();

  insert into public.gymbook_backup_consent_events(user_id, accepted, consent_version)
  values (caller, p_accepted, p_version);

  return jsonb_build_object('accepted', p_accepted, 'consent_version', p_version);
end;
$$;

revoke all on function public.gymbook_backup_consent_active() from public, anon;
revoke all on function public.gymbook_get_backup_consent() from public, anon;
revoke all on function public.gymbook_set_backup_consent(boolean, text) from public, anon;
grant execute on function public.gymbook_backup_consent_active() to authenticated;
grant execute on function public.gymbook_get_backup_consent() to authenticated;
grant execute on function public.gymbook_set_backup_consent(boolean, text) to authenticated;

drop policy if exists "Users manage their own gymbook backup" on public.gymbook_backups;
drop policy if exists "Users read authorized gymbook backup" on public.gymbook_backups;
drop policy if exists "Users create authorized gymbook backup" on public.gymbook_backups;
drop policy if exists "Users update authorized gymbook backup" on public.gymbook_backups;
drop policy if exists "Users delete their gymbook backup" on public.gymbook_backups;

create policy "Users read authorized gymbook backup"
  on public.gymbook_backups for select to authenticated
  using (auth.uid() = user_id and public.gymbook_backup_consent_active());
create policy "Users create authorized gymbook backup"
  on public.gymbook_backups for insert to authenticated
  with check (auth.uid() = user_id and public.gymbook_backup_consent_active());
create policy "Users update authorized gymbook backup"
  on public.gymbook_backups for update to authenticated
  using (auth.uid() = user_id and public.gymbook_backup_consent_active())
  with check (auth.uid() = user_id and public.gymbook_backup_consent_active());
create policy "Users delete their gymbook backup"
  on public.gymbook_backups for delete to authenticated
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';
