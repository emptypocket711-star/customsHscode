create table if not exists public.export_destination_trade_remedy_cases (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  destination_hs_code text not null,
  remedy_type text not null,
  case_number text not null,
  case_title text not null,
  origin_country_code text,
  producer_exporter text,
  rate_text text,
  scope_summary text,
  legal_basis text,
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

create unique index if not exists export_destination_trade_remedy_cases_unique_idx
  on public.export_destination_trade_remedy_cases(
    country_code,
    destination_hs_code,
    remedy_type,
    case_number,
    coalesce(origin_country_code, ''),
    coalesce(producer_exporter, ''),
    source_version
  );

create index if not exists export_destination_trade_remedy_cases_lookup_idx
  on public.export_destination_trade_remedy_cases(country_code, destination_hs_code, origin_country_code, effective_from, effective_to, status);

create index if not exists export_destination_trade_remedy_cases_source_idx
  on public.export_destination_trade_remedy_cases(source_version, status);

alter table public.export_destination_trade_remedy_cases enable row level security;

create policy "published export destination trade remedy cases readable by app users" on public.export_destination_trade_remedy_cases
  for select to anon, authenticated using (status = 'published');

create policy "staff writes export destination trade remedy cases" on public.export_destination_trade_remedy_cases
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
    'export_destination_additional_tariffs',
    'export_destination_trade_remedy_cases',
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
    select 'export_destination_additional_tariffs'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at)
    from public.export_destination_additional_tariffs
    group by source_name, source_version, status

    union all
    select 'export_destination_trade_remedy_cases'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at)
    from public.export_destination_trade_remedy_cases
    group by source_name, source_version, status

    union all
    select 'export_destination_data_sources'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at)
    from public.export_destination_data_sources
    group by source_name, source_version, status
  ) inventory
  where public.is_staff_or_admin()
  order by latest_retrieved_at desc nulls last, row_count desc;
$$;
