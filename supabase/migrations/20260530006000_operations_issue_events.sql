create table if not exists public.operations_issue_events (
  id uuid primary key default gen_random_uuid(),
  issue_type text not null,
  issue_key text not null unique,
  status text not null default 'open' check (status in ('open', 'resolved', 'ignored')),
  severity text not null default 'warning' check (severity in ('info', 'warning', 'blocker')),
  source text not null,
  title text not null,
  summary text not null,
  action text not null,
  occurrence_count integer not null default 1 check (occurrence_count >= 0),
  first_seen_at timestamptz not null,
  last_seen_at timestamptz not null,
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists operations_issue_events_status_updated_at_idx
  on public.operations_issue_events(status, updated_at desc);

create index if not exists operations_issue_events_type_updated_at_idx
  on public.operations_issue_events(issue_type, updated_at desc);

alter table public.operations_issue_events enable row level security;

create policy "staff reads operations issue events" on public.operations_issue_events
  for select using (public.is_staff_or_admin());

create policy "service role writes operations issue events" on public.operations_issue_events
  for insert with check (auth.role() = 'service_role');

create policy "service role updates operations issue events" on public.operations_issue_events
  for update using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

grant select on public.operations_issue_events to authenticated;
grant insert, update on public.operations_issue_events to service_role;
