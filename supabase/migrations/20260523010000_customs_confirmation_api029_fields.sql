alter table public.customs_confirmation_requirements
  add column if not exists law_code text,
  add column if not exists agency_code text,
  add column if not exists agency text;

create index if not exists customs_requirements_source_idx
  on public.customs_confirmation_requirements(source_version, status);

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
    'integrated_public_notice_requirements'
  ) then
    raise exception '게시할 수 없는 원천 테이블입니다: %', p_target_table;
  end if;

  if p_source_version is null or length(trim(p_source_version)) = 0 then
    raise exception 'source_version이 필요합니다.';
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
  ) inventory
  where public.is_staff_or_admin()
  order by latest_retrieved_at desc nulls last, row_count desc;
$$;
