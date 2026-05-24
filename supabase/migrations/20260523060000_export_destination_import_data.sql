create table if not exists public.export_destination_import_requirements (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  destination_hs_code text not null,
  requirement_type text not null,
  requirement_name text not null,
  agency text,
  legal_basis text,
  procedure_summary text,
  required_documents jsonb not null default '[]'::jsonb,
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

create unique index if not exists export_destination_import_requirements_unique_idx
  on public.export_destination_import_requirements(country_code, destination_hs_code, requirement_type, requirement_name, coalesce(agency, ''), source_version);

create index if not exists export_destination_import_requirements_lookup_idx
  on public.export_destination_import_requirements(country_code, destination_hs_code, effective_from, effective_to, status);

create index if not exists export_destination_import_requirements_source_idx
  on public.export_destination_import_requirements(source_version, status);

alter table public.export_destination_import_requirements enable row level security;

create policy "published export destination import requirements readable by app users" on public.export_destination_import_requirements
  for select to anon, authenticated using (status = 'published');

create policy "staff writes export destination import requirements" on public.export_destination_import_requirements
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create table if not exists public.export_destination_internal_taxes (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  destination_hs_code text not null,
  tax_type text not null,
  tax_name text not null,
  rate_text text,
  basis text,
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

create unique index if not exists export_destination_internal_taxes_unique_idx
  on public.export_destination_internal_taxes(country_code, destination_hs_code, tax_type, tax_name, coalesce(rate_text, ''), source_version);

create index if not exists export_destination_internal_taxes_lookup_idx
  on public.export_destination_internal_taxes(country_code, destination_hs_code, effective_from, effective_to, status);

create index if not exists export_destination_internal_taxes_source_idx
  on public.export_destination_internal_taxes(source_version, status);

alter table public.export_destination_internal_taxes enable row level security;

create policy "published export destination internal taxes readable by app users" on public.export_destination_internal_taxes
  for select to anon, authenticated using (status = 'published');

create policy "staff writes export destination internal taxes" on public.export_destination_internal_taxes
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create table if not exists public.export_destination_data_sources (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  data_category text not null,
  source_name text not null,
  source_url text not null,
  source_version text not null,
  access_method text not null,
  connector_status text not null default 'planned',
  notes text,
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  status public.legal_record_status not null default 'draft',
  checksum text,
  unique (country_code, data_category, source_name, source_version)
);

create index if not exists export_destination_data_sources_lookup_idx
  on public.export_destination_data_sources(country_code, data_category, connector_status, status);

create index if not exists export_destination_data_sources_source_idx
  on public.export_destination_data_sources(source_version, status);

alter table public.export_destination_data_sources enable row level security;

create policy "published export destination data sources readable by app users" on public.export_destination_data_sources
  for select to anon, authenticated using (status = 'published');

create policy "staff writes export destination data sources" on public.export_destination_data_sources
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create or replace function public.publish_legal_source_version(
  p_target_table text,
  p_source_version text,
  p_match_prefix boolean default false,
  p_note text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid;
  affected_count integer := 0;
  sql_text text;
begin
  actor := public.assert_current_user_staff();

  if p_target_table not in (
    'hs_master',
    'standard_product_names',
    'tariff_rates',
    'export_destination_tariff_rates',
    'customs_confirmation_requirements',
    'integrated_public_notice_requirements',
    'customs_statistical_codes',
    'export_destination_import_requirements',
    'export_destination_internal_taxes',
    'export_destination_data_sources'
  ) then
    raise exception 'Cannot publish target table: %', p_target_table;
  end if;

  if p_source_version is null or length(trim(p_source_version)) = 0 then
    raise exception 'source_version is required.';
  end if;

  sql_text := format(
    'update public.%I
       set status = ''published''::public.legal_record_status,
           published_at = coalesce(published_at, now()),
           retrieved_at = retrieved_at
     where status in (''staged''::public.legal_record_status, ''reviewed''::public.legal_record_status)
       and %s',
    p_target_table,
    case
      when p_match_prefix then 'source_version like $1'
      else 'source_version = $1'
    end
  );

  execute sql_text using case when p_match_prefix then p_source_version || '%' else p_source_version end;
  get diagnostics affected_count = row_count;

  insert into public.audit_logs (
    actor_id,
    action,
    target_table,
    target_id,
    after_json
  ) values (
    actor,
    'publish_legal_source_version',
    p_target_table,
    null,
    jsonb_build_object(
      'source_version', p_source_version,
      'match_prefix', p_match_prefix,
      'affected_count', affected_count,
      'note', p_note
    )
  );

  return affected_count;
end;
$$;

create or replace function public.get_legal_source_version_inventory()
returns table (
  target_table text,
  source_name text,
  source_version text,
  status public.legal_record_status,
  row_count bigint,
  latest_retrieved_at timestamptz,
  latest_published_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select *
  from (
    select 'hs_master'::text as target_table, source_name, source_version, status, count(*)::bigint as row_count, max(retrieved_at) as latest_retrieved_at, max(published_at) as latest_published_at
    from public.hs_master
    group by source_name, source_version, status

    union all
    select 'standard_product_names'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at)
    from public.standard_product_names
    group by source_name, source_version, status

    union all
    select 'tariff_rates'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at)
    from public.tariff_rates
    group by source_name, source_version, status

    union all
    select 'export_destination_tariff_rates'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at)
    from public.export_destination_tariff_rates
    group by source_name, source_version, status

    union all
    select 'customs_confirmation_requirements'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at)
    from public.customs_confirmation_requirements
    group by source_name, source_version, status

    union all
    select 'integrated_public_notice_requirements'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at)
    from public.integrated_public_notice_requirements
    group by source_name, source_version, status

    union all
    select 'customs_statistical_codes'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at)
    from public.customs_statistical_codes
    group by source_name, source_version, status

    union all
    select 'export_destination_import_requirements'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at)
    from public.export_destination_import_requirements
    group by source_name, source_version, status

    union all
    select 'export_destination_internal_taxes'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at)
    from public.export_destination_internal_taxes
    group by source_name, source_version, status

    union all
    select 'export_destination_data_sources'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at)
    from public.export_destination_data_sources
    group by source_name, source_version, status
  ) inventory
  where public.is_staff_or_admin()
  order by latest_retrieved_at desc nulls last, row_count desc;
$$;
