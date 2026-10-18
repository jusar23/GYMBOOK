-- Backups contain workout history and other sensitive health-related data.
-- Enforce the current explicit consent on the database side as well as in clients.
-- Keep this version aligned with frontend/src/lib/legalConsent.js.

create or replace function public.gymbook_has_current_backup_consent()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (u.raw_user_meta_data ->> 'gymbook_sensitive_training_consent') = 'true'
    and (u.raw_user_meta_data ->> 'gymbook_sensitive_training_consent_version') = '1.6'
    and nullif(u.raw_user_meta_data ->> 'gymbook_sensitive_training_consent_at', '') is not null,
    false
  )
  from auth.users as u
  where u.id = (select auth.uid())
$$;

revoke all on function public.gymbook_has_current_backup_consent() from public, anon;
grant execute on function public.gymbook_has_current_backup_consent() to authenticated;

drop policy if exists "Users manage their own gymbook backup" on public.gymbook_backups;
drop policy if exists "Users read their own consented gymbook backup" on public.gymbook_backups;
drop policy if exists "Users create their own consented gymbook backup" on public.gymbook_backups;
drop policy if exists "Users update their own consented gymbook backup" on public.gymbook_backups;
drop policy if exists "Users delete their own gymbook backup" on public.gymbook_backups;

create policy "Users read their own consented gymbook backup"
  on public.gymbook_backups for select to authenticated
  using (auth.uid() = user_id and (select public.gymbook_has_current_backup_consent()));

create policy "Users create their own consented gymbook backup"
  on public.gymbook_backups for insert to authenticated
  with check (auth.uid() = user_id and (select public.gymbook_has_current_backup_consent()));

create policy "Users update their own consented gymbook backup"
  on public.gymbook_backups for update to authenticated
  using (auth.uid() = user_id and (select public.gymbook_has_current_backup_consent()))
  with check (auth.uid() = user_id and (select public.gymbook_has_current_backup_consent()));

-- Consent withdrawal must not prevent a user from deleting their own cloud copy.
create policy "Users delete their own gymbook backup"
  on public.gymbook_backups for delete to authenticated
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';
