-- Keep backup row-level security aligned with the current, auditable consent table.
-- Migration 007_require_backup_consent.sql checked an older metadata version (1.6),
-- while the app now records consent as version 1.7 in gymbook_backup_consents.
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

revoke all on function public.gymbook_backup_consent_active() from public, anon;
grant execute on function public.gymbook_backup_consent_active() to authenticated;

drop policy if exists "Users read authorized gymbook backup" on public.gymbook_backups;
drop policy if exists "Users create authorized gymbook backup" on public.gymbook_backups;
drop policy if exists "Users update authorized gymbook backup" on public.gymbook_backups;
drop policy if exists "Users delete their gymbook backup" on public.gymbook_backups;
drop policy if exists "Users read their own consented gymbook backup" on public.gymbook_backups;
drop policy if exists "Users create their own consented gymbook backup" on public.gymbook_backups;
drop policy if exists "Users update their own consented gymbook backup" on public.gymbook_backups;
drop policy if exists "Users delete their own gymbook backup" on public.gymbook_backups;

create policy "Users read authorized gymbook backup"
  on public.gymbook_backups for select to authenticated
  using (auth.uid() = user_id and (select public.gymbook_backup_consent_active()));
create policy "Users create authorized gymbook backup"
  on public.gymbook_backups for insert to authenticated
  with check (auth.uid() = user_id and (select public.gymbook_backup_consent_active()));
create policy "Users update authorized gymbook backup"
  on public.gymbook_backups for update to authenticated
  using (auth.uid() = user_id and (select public.gymbook_backup_consent_active()))
  with check (auth.uid() = user_id and (select public.gymbook_backup_consent_active()));
create policy "Users delete their gymbook backup"
  on public.gymbook_backups for delete to authenticated
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';
