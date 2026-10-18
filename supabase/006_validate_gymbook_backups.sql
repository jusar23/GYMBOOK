-- Server-side guard for the one-row local-first backup snapshot. The web/mobile
-- importer validates the complete .gbt.json envelope; this trigger also rejects
-- malformed direct REST writes, unknown app fields, oversized rows and bad roots.
-- Keep this migration safe to run by itself: create the backup table and its
-- user-only access policy when migration 002 has not been applied yet.
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

create or replace function public.gymbook_validate_backup_state()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  state_key text;
  routine_item jsonb;
  exercise_item jsonb;
  workout_item jsonb;
  entry_item jsonb;
  set_item jsonb;
  bodyweight_item jsonb;
  custom_exercise_item jsonb;
  numeric_key text;
  allowed_keys text[] := array[
    'unit', 'restSec', 'sound', 'keepAwake', 'lockOrientation', 'lang', 'theme', 'accent', 'body',
    'targetW', 'bodyweight', 'routines', 'week', 'dayPlan', 'exWeights',
    'workouts', 'active', 'customEx', 'favoriteEx', 'favoritesMigrated',
    'gifSize', 'reminder', 'effort', 'showRir', '_ts'
  ];
begin
  if jsonb_typeof(new.state) is distinct from 'object' then
    raise exception 'Gym Book Training backup must be a JSON object.' using errcode = '22023';
  end if;

  for state_key in select jsonb_object_keys(new.state) loop
    if not state_key = any(allowed_keys) then
      raise exception 'Unsupported Gym Book Training backup field: %', state_key using errcode = '22023';
    end if;
  end loop;

  if jsonb_typeof(new.state -> 'routines') is distinct from 'array'
    or jsonb_typeof(new.state -> 'workouts') is distinct from 'array' then
    raise exception 'Gym Book Training backup needs routine and workout lists.' using errcode = '22023';
  end if;

  if jsonb_array_length(new.state -> 'routines') > 500
    or jsonb_array_length(new.state -> 'workouts') > 20000 then
    raise exception 'Gym Book Training backup has too many routines or workouts.' using errcode = '22023';
  end if;

  for routine_item in select value from jsonb_array_elements(new.state -> 'routines') as items(value) loop
    if jsonb_typeof(routine_item) is distinct from 'object'
      or jsonb_typeof(routine_item -> 'id') is distinct from 'string'
      or jsonb_typeof(routine_item -> 'name') is distinct from 'string'
      or jsonb_typeof(routine_item -> 'ex') is distinct from 'array'
      or length(routine_item ->> 'id') > 100
      or length(routine_item ->> 'name') > 120
      or jsonb_array_length(routine_item -> 'ex') > 500 then
      raise exception 'A routine in the Gym Book Training backup is invalid.' using errcode = '22023';
    end if;
    for exercise_item in select value from jsonb_array_elements(routine_item -> 'ex') as items(value) loop
      if jsonb_typeof(exercise_item) is distinct from 'object'
        or jsonb_typeof(exercise_item -> 'id') is distinct from 'string'
        or length(exercise_item ->> 'id') > 100 then
        raise exception 'An exercise in a Gym Book Training routine is invalid.' using errcode = '22023';
      end if;
      if exercise_item ? 'sets' and (
        jsonb_typeof(exercise_item -> 'sets') is distinct from 'number'
        or (exercise_item ->> 'sets')::numeric < 1
        or (exercise_item ->> 'sets')::numeric > 100
        or (exercise_item ->> 'sets')::numeric <> trunc((exercise_item ->> 'sets')::numeric)
      ) then
        raise exception 'A routine exercise has an invalid set count.' using errcode = '22023';
      end if;
    end loop;
  end loop;

  for workout_item in select value from jsonb_array_elements(new.state -> 'workouts') as items(value) loop
    if jsonb_typeof(workout_item) is distinct from 'object'
      or jsonb_typeof(workout_item -> 'd') is distinct from 'string'
      or (workout_item ->> 'd') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      or jsonb_typeof(workout_item -> 'entries') is distinct from 'array'
      or jsonb_array_length(workout_item -> 'entries') > 500 then
      raise exception 'A workout in the Gym Book Training backup is invalid.' using errcode = '22023';
    end if;
    for entry_item in select value from jsonb_array_elements(workout_item -> 'entries') as items(value) loop
      if jsonb_typeof(entry_item) is distinct from 'object'
        or jsonb_typeof(entry_item -> 'id') is distinct from 'string'
        or length(entry_item ->> 'id') > 100
        or jsonb_typeof(entry_item -> 'sets') is distinct from 'array'
        or jsonb_array_length(entry_item -> 'sets') > 500 then
        raise exception 'A workout exercise in the Gym Book Training backup is invalid.' using errcode = '22023';
      end if;
      for set_item in select value from jsonb_array_elements(entry_item -> 'sets') as items(value) loop
        if jsonb_typeof(set_item) is distinct from 'object' then
          raise exception 'A workout set in the Gym Book Training backup is invalid.' using errcode = '22023';
        end if;
        for numeric_key in select unnest(array['w', 'r', 'sec', 'min', 'speed', 'rir', 'rpe']) loop
          if set_item ? numeric_key and jsonb_typeof(set_item -> numeric_key) not in ('number', 'null') then
            raise exception 'A workout set value in the Gym Book Training backup is invalid.' using errcode = '22023';
          end if;
        end loop;
        if set_item ? 'done' and jsonb_typeof(set_item -> 'done') not in ('boolean', 'null') then
          raise exception 'A workout set completion value in the Gym Book Training backup is invalid.' using errcode = '22023';
        end if;
      end loop;
    end loop;
  end loop;

  if new.state ? 'bodyweight' then
    if jsonb_typeof(new.state -> 'bodyweight') is distinct from 'array'
      or jsonb_array_length(new.state -> 'bodyweight') > 20000 then
      raise exception 'Gym Book Training body-weight data is invalid or too large.' using errcode = '22023';
    end if;
    for bodyweight_item in select value from jsonb_array_elements(new.state -> 'bodyweight') as items(value) loop
      if jsonb_typeof(bodyweight_item) is distinct from 'object'
        or jsonb_typeof(bodyweight_item -> 'd') is distinct from 'string'
        or (bodyweight_item ->> 'd') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
        or jsonb_typeof(bodyweight_item -> 'w') is distinct from 'number'
        or (bodyweight_item ->> 'w')::numeric <= 0
        or (bodyweight_item ->> 'w')::numeric > 1000 then
        raise exception 'A body-weight entry in the Gym Book Training backup is invalid.' using errcode = '22023';
      end if;
    end loop;
  end if;
  if new.state ? 'customEx' then
    if jsonb_typeof(new.state -> 'customEx') is distinct from 'array'
      or jsonb_array_length(new.state -> 'customEx') > 2000 then
      raise exception 'Gym Book Training custom exercises are invalid or too large.' using errcode = '22023';
    end if;
    for custom_exercise_item in select value from jsonb_array_elements(new.state -> 'customEx') as items(value) loop
      if jsonb_typeof(custom_exercise_item) is distinct from 'object'
        or jsonb_typeof(custom_exercise_item -> 'id') is distinct from 'string'
        or jsonb_typeof(custom_exercise_item -> 'n') is distinct from 'string'
        or length(custom_exercise_item ->> 'id') > 100
        or length(custom_exercise_item ->> 'n') > 120 then
        raise exception 'A custom exercise in the Gym Book Training backup is invalid.' using errcode = '22023';
      end if;
    end loop;
  end if;
  if new.state ? 'favoriteEx' then
    if jsonb_typeof(new.state -> 'favoriteEx') is distinct from 'array'
      or jsonb_array_length(new.state -> 'favoriteEx') > 10000 then
      raise exception 'Gym Book Training favorites are invalid or too large.' using errcode = '22023';
    end if;
  end if;
  if new.state ? 'week' and jsonb_typeof(new.state -> 'week') is distinct from 'object' then
    raise exception 'Gym Book Training weekly schedule must be an object.' using errcode = '22023';
  end if;
  if new.state ? 'dayPlan' and jsonb_typeof(new.state -> 'dayPlan') is distinct from 'object' then
    raise exception 'Gym Book Training dated schedule must be an object.' using errcode = '22023';
  end if;
  if new.state ? 'exWeights' and jsonb_typeof(new.state -> 'exWeights') is distinct from 'object' then
    raise exception 'Gym Book Training exercise weights must be an object.' using errcode = '22023';
  end if;
  if new.state ? 'active' and jsonb_typeof(new.state -> 'active') not in ('object', 'null') then
    raise exception 'Gym Book Training active workout is invalid.' using errcode = '22023';
  end if;
  if new.state ? 'lockOrientation' and jsonb_typeof(new.state -> 'lockOrientation') not in ('boolean', 'null') then
    raise exception 'Gym Book Training orientation setting is invalid.' using errcode = '22023';
  end if;

  if octet_length(convert_to(new.state::text, 'UTF8')) > 10485760 then
    raise exception 'Gym Book Training backup exceeds the 10 MB limit.' using errcode = '22023';
  end if;

  return new;
end;
$$;

drop trigger if exists gymbook_backup_state_validation on public.gymbook_backups;
create trigger gymbook_backup_state_validation
  before insert or update of state on public.gymbook_backups
  for each row execute function public.gymbook_validate_backup_state();

notify pgrst, 'reload schema';
