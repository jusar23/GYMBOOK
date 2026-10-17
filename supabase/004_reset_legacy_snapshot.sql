-- Reset only the deprecated web-app data stored in the single JSON snapshot row.
-- Supabase Auth users and mobile gymbook_backups are separate and remain untouched.
begin;

update public.opengym_snapshot
set payload = jsonb_build_object(
  'users', '[]'::jsonb,
  'creds', '[]'::jsonb,
  'subs', '[]'::jsonb,
  'invites', '[]'::jsonb,
  'authUsers', '{}'::jsonb,
  'states', '{}'::jsonb,
  'challenges', '{}'::jsonb,
  'presence', '{}'::jsonb,
  'sessionSecret', case
    when jsonb_typeof(payload) = 'object' then coalesce(payload -> 'sessionSecret', 'null'::jsonb)
    else 'null'::jsonb
  end,
  'vapid', case
    when jsonb_typeof(payload) = 'object' then coalesce(payload -> 'vapid', 'null'::jsonb)
    else 'null'::jsonb
  end
),
updated_at = now()
where id = 1;

commit;

select
  id,
  jsonb_typeof(payload) as payload_type,
  jsonb_typeof(payload -> 'users') as users_type,
  jsonb_typeof(payload -> 'authUsers') as auth_users_type,
  jsonb_typeof(payload -> 'states') as states_type
from public.opengym_snapshot
where id = 1;
