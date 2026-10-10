-- openGym's Vercel adapter stores the current file-backed database as one
-- JSONB snapshot. Row-level locking serializes API requests while a request
-- loads, updates, and saves the snapshot in a single database transaction.
create table if not exists public.opengym_snapshot (
  id smallint primary key check (id = 1),
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.opengym_snapshot enable row level security;
revoke all on table public.opengym_snapshot from anon, authenticated, service_role;

insert into public.opengym_snapshot (id, payload)
values (1, '{"users":[],"creds":[],"subs":[],"invites":[],"states":{},"challenges":{},"presence":{},"sessionSecret":null,"vapid":null}'::jsonb)
on conflict (id) do nothing;
