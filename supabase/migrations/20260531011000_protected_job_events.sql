create table if not exists public.protected_job_events (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  route text not null,
  status text not null check (status in ('succeeded', 'failed')),
  duration_ms integer not null,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists protected_job_events_created_idx
  on public.protected_job_events(created_at desc);

create index if not exists protected_job_events_job_created_idx
  on public.protected_job_events(job_name, created_at desc);

create index if not exists protected_job_events_status_created_idx
  on public.protected_job_events(status, created_at desc);

alter table public.protected_job_events enable row level security;

drop policy if exists "developer reads protected job events" on public.protected_job_events;
create policy "developer reads protected job events"
  on public.protected_job_events
  for select
  using (public.current_user_role() = 'developer'::public.user_role);

drop policy if exists "service role writes protected job events" on public.protected_job_events;
create policy "service role writes protected job events"
  on public.protected_job_events
  for insert
  with check (auth.role() = 'service_role');

grant select on public.protected_job_events to authenticated;
grant insert on public.protected_job_events to service_role;
