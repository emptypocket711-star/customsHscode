create table if not exists public.customs_exchange_rates (
  id uuid primary key default gen_random_uuid(),
  direction text not null check (direction in ('import', 'export')),
  currency_code text not null,
  country_code text,
  currency_unit_name text,
  rate numeric(18, 8) not null,
  effective_from date not null,
  source_name text not null,
  source_url text not null,
  source_version text not null,
  retrieved_at timestamptz not null,
  checksum text not null,
  source_snapshot_id uuid references public.legal_source_snapshots(id) on delete set null,
  status text not null default 'published' check (status in ('staged', 'published', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (direction, currency_code, effective_from)
);

create index if not exists customs_exchange_rates_lookup_idx
  on public.customs_exchange_rates(direction, currency_code, effective_from desc)
  where status = 'published';

alter table public.customs_exchange_rates enable row level security;
