-- Remove legacy web-app records when a Supabase Auth user is deleted.
-- The manual backup row is removed automatically by its auth.users foreign key cascade.
create or replace function public.cleanup_gymbook_account_after_auth_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_payload jsonb;
  v_profile_id text;
  v_users jsonb;
  v_creds jsonb;
  v_subs jsonb;
  v_invites jsonb;
  v_auth_users jsonb;
  v_challenges jsonb;
begin
  select snapshot.payload
    into v_payload
    from public.opengym_snapshot as snapshot
    where snapshot.id = 1
    for update;

  if not found then
    return old;
  end if;

  -- Older installs or incomplete legacy snapshots may contain JSON null, or fields
  -- with the wrong JSON type. Normalize these values so account deletion cannot be
  -- blocked by malformed legacy data.
  if jsonb_typeof(v_payload) is distinct from 'object' then
    v_payload := '{}'::jsonb;
  end if;

  v_profile_id := coalesce(v_payload -> 'authUsers' ->> old.id::text, old.id::text);

  select coalesce(jsonb_agg(item.value), '[]'::jsonb)
    into v_users
    from jsonb_array_elements(
      case when jsonb_typeof(v_payload -> 'users') = 'array' then v_payload -> 'users' else '[]'::jsonb end
    ) as item(value)
    where item.value ->> 'id' is distinct from v_profile_id;

  select coalesce(jsonb_agg(item.value), '[]'::jsonb)
    into v_creds
    from jsonb_array_elements(
      case when jsonb_typeof(v_payload -> 'creds') = 'array' then v_payload -> 'creds' else '[]'::jsonb end
    ) as item(value)
    where item.value ->> 'userId' is distinct from v_profile_id;

  select coalesce(jsonb_agg(item.value), '[]'::jsonb)
    into v_subs
    from jsonb_array_elements(
      case when jsonb_typeof(v_payload -> 'subs') = 'array' then v_payload -> 'subs' else '[]'::jsonb end
    ) as item(value)
    where item.value ->> 'userId' is distinct from v_profile_id;

  select coalesce(jsonb_agg(item.value), '[]'::jsonb)
    into v_invites
    from jsonb_array_elements(
      case when jsonb_typeof(v_payload -> 'invites') = 'array' then v_payload -> 'invites' else '[]'::jsonb end
    ) as item(value)
    where item.value ->> 'usedBy' is distinct from v_profile_id
      and item.value ->> 'restoreUserId' is distinct from v_profile_id;

  select coalesce(jsonb_object_agg(entry.key, entry.value), '{}'::jsonb)
    into v_auth_users
    from jsonb_each(
      case when jsonb_typeof(v_payload -> 'authUsers') = 'object' then v_payload -> 'authUsers' else '{}'::jsonb end
    ) as entry(key, value)
    where entry.key is distinct from old.id::text
      and entry.value #>> '{}' is distinct from v_profile_id;

  select coalesce(jsonb_object_agg(entry.key, entry.value), '{}'::jsonb)
    into v_challenges
    from jsonb_each(
      case when jsonb_typeof(v_payload -> 'challenges') = 'object' then v_payload -> 'challenges' else '{}'::jsonb end
    ) as entry(key, value)
    where entry.value ->> 'uid' is distinct from v_profile_id
      and entry.value ->> 'restoreUserId' is distinct from v_profile_id;

  v_payload := jsonb_set(v_payload, '{users}', v_users, true);
  v_payload := jsonb_set(v_payload, '{creds}', v_creds, true);
  v_payload := jsonb_set(v_payload, '{subs}', v_subs, true);
  v_payload := jsonb_set(v_payload, '{invites}', v_invites, true);
  v_payload := jsonb_set(v_payload, '{authUsers}', v_auth_users, true);
  v_payload := jsonb_set(v_payload, '{challenges}', v_challenges, true);
  v_payload := jsonb_set(v_payload, '{states}',
    (case when jsonb_typeof(v_payload -> 'states') = 'object' then v_payload -> 'states' else '{}'::jsonb end) - v_profile_id,
    true);
  v_payload := jsonb_set(v_payload, '{presence}',
    (case when jsonb_typeof(v_payload -> 'presence') = 'object' then v_payload -> 'presence' else '{}'::jsonb end) - v_profile_id,
    true);

  update public.opengym_snapshot
    set payload = v_payload, updated_at = now()
    where id = 1;

  return old;
end;
$function$;

revoke all on function public.cleanup_gymbook_account_after_auth_delete() from public, anon, authenticated;

drop trigger if exists cleanup_gymbook_account_after_auth_delete on auth.users;
create trigger cleanup_gymbook_account_after_auth_delete
  after delete on auth.users
  for each row execute function public.cleanup_gymbook_account_after_auth_delete();
