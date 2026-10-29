-- Keep the server snapshot's settings allow-list in sync with the app state.
-- Migration 006 predates rest-pause, notification, and warm-up preferences, so
-- full-state uploads were rejected by its trigger even though the client sent them.
do $$
declare
  function_sql text;
  allowed_keys_before text := $old$'unit', 'restSec', 'sound', 'keepAwake', 'lockOrientation', 'lang', 'theme', 'accent', 'body',$old$;
  allowed_keys_after text := $new$'unit', 'restSec', 'sideRestSec', 'sound', 'soundTone', 'restNotification', 'warmupEnabled', 'keepAwake', 'lockOrientation', 'lang', 'theme', 'accent', 'body',$new$;
  validation_before text := $old$
  if new.state ? 'lockOrientation' and jsonb_typeof(new.state -> 'lockOrientation') not in ('boolean', 'null') then
    raise exception 'Gym Book Training orientation setting is invalid.' using errcode = '22023';
  end if;
$old$;
  validation_after text := $new$
  if new.state ? 'lockOrientation' and jsonb_typeof(new.state -> 'lockOrientation') not in ('boolean', 'null') then
    raise exception 'Gym Book Training orientation setting is invalid.' using errcode = '22023';
  end if;

  if new.state ? 'sideRestSec' then
    if jsonb_typeof(new.state -> 'sideRestSec') not in ('number', 'null') then
      raise exception 'Gym Book Training side-rest setting is invalid.' using errcode = '22023';
    end if;
    if jsonb_typeof(new.state -> 'sideRestSec') = 'number'
      and ((new.state ->> 'sideRestSec')::numeric < 0 or (new.state ->> 'sideRestSec')::numeric > 100000) then
      raise exception 'Gym Book Training side-rest setting is out of range.' using errcode = '22023';
    end if;
  end if;
  if new.state ? 'soundTone' and (jsonb_typeof(new.state -> 'soundTone') not in ('string', 'null') or length(new.state ->> 'soundTone') > 32) then
    raise exception 'Gym Book Training sound-tone setting is invalid.' using errcode = '22023';
  end if;
  foreach state_key in array array['sound', 'restNotification', 'warmupEnabled'] loop
    if new.state ? state_key and jsonb_typeof(new.state -> state_key) not in ('boolean', 'null') then
      raise exception 'Gym Book Training boolean setting is invalid: %', state_key using errcode = '22023';
    end if;
  end loop;
$new$;
begin
  select pg_get_functiondef('public.gymbook_validate_backup_state()'::regprocedure)
    into function_sql;

  if position(allowed_keys_before in function_sql) > 0 then
    function_sql := replace(function_sql, allowed_keys_before, allowed_keys_after);
  elsif position(allowed_keys_after in function_sql) = 0 then
    raise exception 'Could not find the expected app-settings allow-list in the backup validator.';
  end if;

  if position(validation_after in function_sql) = 0 then
    if position(validation_before in function_sql) = 0 then
      raise exception 'Could not find the expected settings-validation block in the backup validator.';
    end if;
    function_sql := replace(function_sql, validation_before, validation_after);
  end if;
  execute function_sql;
end;
$$;

notify pgrst, 'reload schema';
