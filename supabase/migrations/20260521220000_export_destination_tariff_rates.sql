create table if not exists public.export_destination_tariff_rates (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  tariff_year integer not null,
  destination_hs_code text not null,
  original_name text,
  english_name text,
  korean_name text,
  unit text,
  base_rate_text text,
  agreement_rates jsonb not null default '{}'::jsonb,
  source_name text not null,
  source_url text not null,
  source_version text not null,
  effective_from date not null,
  effective_to date,
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  status public.legal_record_status not null default 'draft',
  checksum text
);

create index if not exists export_destination_tariff_rates_country_idx
  on public.export_destination_tariff_rates(country_code);

create index if not exists export_destination_tariff_rates_hs_idx
  on public.export_destination_tariff_rates(destination_hs_code);

create index if not exists export_destination_tariff_rates_effective_idx
  on public.export_destination_tariff_rates(effective_from, effective_to);

alter table public.export_destination_tariff_rates enable row level security;

create policy "company reads published export destination tariffs or staff reads all"
  on public.export_destination_tariff_rates
  for select using (
    status = 'published'
    or public.is_staff_or_admin()
  );

create policy "staff writes export destination tariffs"
  on public.export_destination_tariff_rates
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
