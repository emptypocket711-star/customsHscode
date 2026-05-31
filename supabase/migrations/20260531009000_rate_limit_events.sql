create table if not exists public.rate_limit_events (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  route text not null,
  identity_hash text not null,
  user_id uuid,
  limit_count integer not null,
  window_ms integer not null,
  retry_after_seconds integer not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_events_created_idx
  on public.rate_limit_events(created_at desc);

create index if not exists rate_limit_events_route_created_idx
  on public.rate_limit_events(route, created_at desc);

create index if not exists rate_limit_events_scope_created_idx
  on public.rate_limit_events(scope, created_at desc);

alter table public.rate_limit_events enable row level security;

drop policy if exists "developer reads rate limit events" on public.rate_limit_events;
create policy "developer reads rate limit events"
  on public.rate_limit_events
  for select
  using (public.current_user_role() = 'developer'::public.user_role);

drop policy if exists "service role writes rate limit events" on public.rate_limit_events;
create policy "service role writes rate limit events"
  on public.rate_limit_events
  for insert
  with check (auth.role() = 'service_role');

grant select on public.rate_limit_events to authenticated;
grant insert on public.rate_limit_events to service_role;
