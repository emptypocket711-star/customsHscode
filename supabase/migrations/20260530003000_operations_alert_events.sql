create table if not exists public.operations_alert_events (
  id uuid primary key default gen_random_uuid(),
  alert_type text not null,
  alert_key text not null,
  status text not null check (status in ('sent', 'skipped', 'failed')),
  recipient text,
  provider_id text,
  reason text,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists operations_alert_events_key_created_at_idx
  on public.operations_alert_events(alert_key, created_at desc);

create index if not exists operations_alert_events_type_created_at_idx
  on public.operations_alert_events(alert_type, created_at desc);

alter table public.operations_alert_events enable row level security;

create policy "staff reads operations alert events" on public.operations_alert_events
  for select using (public.is_staff_or_admin());

create policy "service role writes operations alert events" on public.operations_alert_events
  for insert with check (auth.role() = 'service_role');
