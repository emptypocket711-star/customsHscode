create table if not exists public.background_job_runs (
  id uuid primary key default gen_random_uuid(),
  worker_id text not null,
  route text not null default '/api/jobs/run',
  status text not null check (status in ('succeeded', 'failed')),
  claimed_count integer not null default 0 check (claimed_count >= 0),
  succeeded_count integer not null default 0 check (succeeded_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  duration_ms integer not null default 0 check (duration_ms >= 0),
  error_message text,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists background_job_runs_created_at_idx
  on public.background_job_runs(created_at desc);

create index if not exists background_job_runs_status_created_at_idx
  on public.background_job_runs(status, created_at desc);

alter table public.background_job_runs enable row level security;

create policy "staff reads background job runs" on public.background_job_runs
  for select using (public.is_staff_or_admin());

create policy "service role writes background job runs" on public.background_job_runs
  for insert with check (auth.role() = 'service_role');
