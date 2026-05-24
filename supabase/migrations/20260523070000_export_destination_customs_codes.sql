create table if not exists public.export_destination_customs_codes (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  customs_code text not null,
  tariff_code text not null,
  original_name text,
  english_name text,
  korean_name text,
  code_role text not null default 'declaration_code',
  notes text,
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

create unique index if not exists export_destination_customs_codes_unique_idx
  on public.export_destination_customs_codes(country_code, customs_code, source_version);

create index if not exists export_destination_customs_codes_country_idx
  on public.export_destination_customs_codes(country_code);

create index if not exists export_destination_customs_codes_customs_idx
  on public.export_destination_customs_codes(customs_code);

create index if not exists export_destination_customs_codes_tariff_idx
  on public.export_destination_customs_codes(country_code, tariff_code);

create index if not exists export_destination_customs_codes_effective_idx
  on public.export_destination_customs_codes(effective_from, effective_to, status);

alter table public.export_destination_customs_codes enable row level security;

create policy "published export destination customs codes readable by app users"
  on public.export_destination_customs_codes
  for select to anon, authenticated
  using (status = 'published');

create policy "staff writes export destination customs codes"
  on public.export_destination_customs_codes
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
