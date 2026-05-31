create table if not exists public.container_receipt_failure_events (
  id uuid primary key default gen_random_uuid(),
  terminal_code text not null,
  failure_code text not null,
  container_hash text,
  user_id uuid,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists container_receipt_failure_events_created_idx
  on public.container_receipt_failure_events(created_at desc);

create index if not exists container_receipt_failure_events_terminal_created_idx
  on public.container_receipt_failure_events(terminal_code, created_at desc);

create index if not exists container_receipt_failure_events_code_created_idx
  on public.container_receipt_failure_events(failure_code, created_at desc);

alter table public.container_receipt_failure_events enable row level security;

drop policy if exists "developer reads container receipt failure events" on public.container_receipt_failure_events;
create policy "developer reads container receipt failure events"
  on public.container_receipt_failure_events
  for select
  using (public.current_user_role() = 'developer'::public.user_role);

drop policy if exists "service role writes container receipt failure events" on public.container_receipt_failure_events;
create policy "service role writes container receipt failure events"
  on public.container_receipt_failure_events
  for insert
  with check (auth.role() = 'service_role');

grant select on public.container_receipt_failure_events to authenticated;
grant insert on public.container_receipt_failure_events to service_role;
