alter table public.report_source_locks
  add column if not exists source_name text,
  add column if not exists source_url text,
  add column if not exists source_version text,
  add column if not exists lock_reason text not null default 'report_generation';

create index if not exists report_source_locks_report_id_idx on public.report_source_locks(report_id);

create table if not exists public.report_approval_events (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.ai_reports(id) on delete cascade,
  company_id uuid not null references public.companies(id),
  actor_id uuid not null references auth.users(id),
  from_status public.review_status,
  to_status public.review_status not null,
  staff_notes text,
  created_at timestamptz not null default now()
);

alter table public.report_approval_events enable row level security;

create policy "company reads own report approval events or staff reads all" on public.report_approval_events
  for select using (company_id = public.current_company_id() or public.is_staff_or_admin());

create policy "staff writes report approval events" on public.report_approval_events
  for insert with check (public.is_staff_or_admin());
