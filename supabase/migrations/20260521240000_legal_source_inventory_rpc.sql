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
    select
      'hs_master'::text as target_table,
      source_name,
      source_version,
      status,
      count(*)::bigint as row_count,
      max(retrieved_at) as latest_retrieved_at,
      max(published_at) as latest_published_at
    from public.hs_master
    group by source_name, source_version, status

    union all

    select
      'standard_product_names'::text as target_table,
      source_name,
      source_version,
      status,
      count(*)::bigint as row_count,
      max(retrieved_at) as latest_retrieved_at,
      max(published_at) as latest_published_at
    from public.standard_product_names
    group by source_name, source_version, status

    union all

    select
      'tariff_rates'::text as target_table,
      source_name,
      source_version,
      status,
      count(*)::bigint as row_count,
      max(retrieved_at) as latest_retrieved_at,
      max(published_at) as latest_published_at
    from public.tariff_rates
    group by source_name, source_version, status

    union all

    select
      'export_destination_tariff_rates'::text as target_table,
      source_name,
      source_version,
      status,
      count(*)::bigint as row_count,
      max(retrieved_at) as latest_retrieved_at,
      max(published_at) as latest_published_at
    from public.export_destination_tariff_rates
    group by source_name, source_version, status
  ) inventory
  where public.is_staff_or_admin()
  order by latest_retrieved_at desc nulls last, row_count desc;
$$;
