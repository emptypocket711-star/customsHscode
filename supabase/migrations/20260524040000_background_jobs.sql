create type public.background_job_type as enum (
  'document_extraction',
  'ai_product_search',
  'report_generation',
  'source_ingestion',
  'source_publish'
);

create type public.background_job_status as enum (
  'queued',
  'running',
  'succeeded',
  'failed',
  'canceled',
  'dead'
);

create table public.background_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id),
  created_by uuid references auth.users(id),
  job_type public.background_job_type not null,
  status public.background_job_status not null default 'queued',
  priority smallint not null default 100,
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  error_message text,
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 3 check (max_attempts > 0),
  available_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  locked_by text,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index background_jobs_company_id_idx on public.background_jobs(company_id, created_at desc);
create index background_jobs_status_available_idx
  on public.background_jobs(status, available_at, priority, created_at)
  where status in ('queued', 'failed');
create index background_jobs_type_status_idx on public.background_jobs(job_type, status, created_at desc);

alter table public.background_jobs enable row level security;

create policy "company reads own background jobs or staff reads all" on public.background_jobs
  for select using (company_id = public.current_company_id() or public.is_staff_or_admin());

create policy "company enqueues own background jobs" on public.background_jobs
  for insert with check (
    company_id = public.current_company_id()
    and created_by = auth.uid()
    and status = 'queued'
  );

create policy "staff manages background jobs" on public.background_jobs
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create or replace function public.claim_background_jobs(
  p_worker_id text,
  p_limit integer default 5,
  p_job_types public.background_job_type[] default null
)
returns setof public.background_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_staff_or_admin() or auth.role() = 'service_role') then
    raise exception 'not authorized';
  end if;

  return query
  with next_jobs as (
    select id
    from public.background_jobs
    where status in ('queued', 'failed')
      and attempts < max_attempts
      and available_at <= now()
      and (p_job_types is null or job_type = any(p_job_types))
    order by priority asc, created_at asc
    limit greatest(1, least(coalesce(p_limit, 5), 50))
    for update skip locked
  )
  update public.background_jobs jobs
  set
    status = 'running',
    attempts = jobs.attempts + 1,
    started_at = coalesce(jobs.started_at, now()),
    locked_by = p_worker_id,
    locked_at = now(),
    error_message = null,
    updated_at = now()
  from next_jobs
  where jobs.id = next_jobs.id
  returning jobs.*;
end;
$$;
