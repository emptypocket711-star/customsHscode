create table if not exists public.lookup_telemetry_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  status text,
  source_mode text,
  route text,
  result_count integer,
  duration_ms integer,
  error_type text,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists lookup_telemetry_events_created_idx
  on public.lookup_telemetry_events(created_at desc);

create index if not exists lookup_telemetry_events_event_created_idx
  on public.lookup_telemetry_events(event_type, created_at desc);

create index if not exists lookup_telemetry_events_status_created_idx
  on public.lookup_telemetry_events(status, created_at desc);

create index if not exists lookup_telemetry_events_result_count_created_idx
  on public.lookup_telemetry_events(result_count, created_at desc);

alter table public.lookup_telemetry_events enable row level security;

drop policy if exists "developer reads lookup telemetry events" on public.lookup_telemetry_events;
create policy "developer reads lookup telemetry events"
  on public.lookup_telemetry_events
  for select
  using (public.current_user_role() = 'developer'::public.user_role);

drop policy if exists "service role writes lookup telemetry events" on public.lookup_telemetry_events;
create policy "service role writes lookup telemetry events"
  on public.lookup_telemetry_events
  for insert
  with check (auth.role() = 'service_role');

grant select on public.lookup_telemetry_events to authenticated;
grant insert on public.lookup_telemetry_events to service_role;
