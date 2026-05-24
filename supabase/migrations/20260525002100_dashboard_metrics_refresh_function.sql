create or replace function public.refresh_dashboard_metrics(p_basis_date date default current_date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source_version text := 'dashboard-metrics-' || p_basis_date::text;
begin
  insert into public.dashboard_metrics (
    metric_key,
    metric_label,
    metric_value,
    note,
    basis_date,
    source_name,
    source_version,
    effective_from,
    effective_to,
    published_at,
    retrieved_at,
    status,
    checksum,
    updated_at
  )
  select
    metric_key,
    metric_label,
    metric_value,
    note,
    p_basis_date,
    'dashboard_metrics',
    v_source_version,
    p_basis_date,
    null::date,
    now(),
    now(),
    'published',
    md5(metric_key || ':' || metric_value::text || ':' || p_basis_date::text),
    now()
  from (
    select
      'hs_master'::text as metric_key,
      'HS CODE'::text as metric_label,
      count(*)::bigint as metric_value,
      'HS부호 데이터'::text as note
    from public.hs_master
    where effective_from <= p_basis_date
      and (effective_to is null or effective_to >= p_basis_date)
      and status = 'published'

    union all

    select
      'standard_product_names'::text,
      '표준품명'::text,
      count(*)::bigint,
      '표준품명 데이터'::text
    from public.standard_product_names
    where effective_from <= p_basis_date
      and (effective_to is null or effective_to >= p_basis_date)
      and status = 'published'

    union all

    select
      'tariff_rates'::text,
      '관세율'::text,
      count(*)::bigint,
      '수입 관세율 데이터'::text
    from public.tariff_rates
    where effective_from <= p_basis_date
      and (effective_to is null or effective_to >= p_basis_date)
      and status = 'published'

    union all

    select
      'customs_statistical_codes'::text,
      '내국세 코드표'::text,
      count(*)::bigint,
      '통계부호 데이터'::text
    from public.customs_statistical_codes
    where effective_from <= p_basis_date
      and (effective_to is null or effective_to >= p_basis_date)
      and status = 'published'
  ) metric_rows
  on conflict (metric_key, basis_date, source_version)
  do update set
    metric_label = excluded.metric_label,
    metric_value = excluded.metric_value,
    note = excluded.note,
    published_at = excluded.published_at,
    retrieved_at = excluded.retrieved_at,
    status = excluded.status,
    checksum = excluded.checksum,
    updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.refresh_dashboard_metrics(date) from public;
grant execute on function public.refresh_dashboard_metrics(date) to service_role;
