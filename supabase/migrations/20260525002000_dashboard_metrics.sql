create table if not exists public.dashboard_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_key text not null,
  metric_label text not null,
  metric_value bigint not null default 0,
  note text,
  basis_date date not null,
  source_name text not null default 'dashboard_metrics',
  source_version text not null,
  effective_from date not null,
  effective_to date,
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  status text not null default 'published',
  checksum text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (metric_key, basis_date, source_version)
);

create index if not exists dashboard_metrics_effective_idx
  on public.dashboard_metrics(metric_key, basis_date, status, effective_from, effective_to);

alter table public.dashboard_metrics enable row level security;

drop policy if exists "dashboard_metrics_read_published" on public.dashboard_metrics;
create policy "dashboard_metrics_read_published"
  on public.dashboard_metrics
  for select
  using (status = 'published');

grant select on public.dashboard_metrics to anon, authenticated;
