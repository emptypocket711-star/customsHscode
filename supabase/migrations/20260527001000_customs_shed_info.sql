create table if not exists public.customs_shed_info (
  id uuid primary key default gen_random_uuid(),
  shed_code text not null,
  customs_office_code text,
  shed_name text,
  shed_address text,
  telephone text,
  penalty_target_yn text,
  additional_tax_collection_period_yn text,
  unloading_place_bonded_area_yn text,
  facility_type text not null default 'unknown' check (facility_type in ('cy', 'cfs', 'terminal', 'bonded_warehouse', 'airport', 'other', 'unknown')),
  facility_type_source text not null default 'auto_name_rule' check (facility_type_source in ('unloading_place_flag', 'auto_name_rule', 'manual', 'unclassified')),
  raw_xml text not null,
  source_name text not null,
  source_url text not null,
  source_version text not null,
  effective_from date not null,
  effective_to date,
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  status public.legal_record_status not null default 'staged',
  checksum text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shed_code, source_version)
);

create index if not exists customs_shed_info_shed_code_idx
  on public.customs_shed_info(shed_code);

create index if not exists customs_shed_info_customs_office_idx
  on public.customs_shed_info(customs_office_code);

create index if not exists customs_shed_info_facility_type_idx
  on public.customs_shed_info(facility_type);

create index if not exists customs_shed_info_lookup_idx
  on public.customs_shed_info(shed_code, effective_from, effective_to, status);

alter table public.customs_shed_info enable row level security;

drop policy if exists "published customs shed info readable by app users" on public.customs_shed_info;
create policy "published customs shed info readable by app users" on public.customs_shed_info
  for select using (status = 'published' or public.is_staff_or_admin());

drop policy if exists "staff writes customs shed info" on public.customs_shed_info;
create policy "staff writes customs shed info" on public.customs_shed_info
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
