create table if not exists public.cargo_watch_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  cargo_management_no text,
  master_bl_no text,
  house_bl_no text,
  bl_year text,
  target_status text not null,
  notify_email text not null,
  poll_interval_seconds integer not null default 60 check (poll_interval_seconds between 60 and 3600),
  status text not null default 'active' check (status in ('active', 'matched', 'paused', 'error', 'cancelled')),
  last_status text,
  last_checked_at timestamptz,
  next_check_at timestamptz not null default now(),
  matched_at timestamptz,
  notified_at timestamptz,
  last_error text,
  source_name text,
  source_url text,
  source_version text,
  retrieved_at timestamptz,
  checksum text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cargo_watch_requests_lookup_check check (
    nullif(trim(coalesce(cargo_management_no, '')), '') is not null
    or nullif(trim(coalesce(master_bl_no, '')), '') is not null
    or nullif(trim(coalesce(house_bl_no, '')), '') is not null
  )
);

create index if not exists cargo_watch_requests_company_idx
  on public.cargo_watch_requests(company_id, created_at desc);

create index if not exists cargo_watch_requests_due_idx
  on public.cargo_watch_requests(status, next_check_at)
  where status = 'active';

alter table public.cargo_watch_requests enable row level security;

drop policy if exists "company manages own cargo watches or staff all" on public.cargo_watch_requests;
create policy "company manages own cargo watches or staff all"
  on public.cargo_watch_requests
  for all
  using (company_id = public.current_company_id() or public.is_staff_or_admin())
  with check (company_id = public.current_company_id() or public.is_staff_or_admin());
