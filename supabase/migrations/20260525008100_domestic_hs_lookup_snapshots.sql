create materialized view if not exists public.domestic_hs_lookup_snapshots as
with current_hs as (
  select
    hsk_code,
    hs6,
    left(hsk_code, 4) as hs4,
    left(hsk_code, 2) as hs2,
    korean_name,
    english_name,
    quantity_unit,
    weight_unit,
    source_name,
    source_url,
    source_version,
    effective_from,
    effective_to,
    published_at,
    retrieved_at,
    checksum
  from public.hs_master
  where status = 'published'
    and length(regexp_replace(hsk_code, '[^0-9]', '', 'g')) = 10
    and effective_from <= current_date
    and (effective_to is null or effective_to >= current_date)
),
current_tariffs as (
  select
    hsk_code,
    jsonb_agg(
      jsonb_build_object(
        'rateType', rate_type,
        'dutyRate', duty_rate,
        'unitDuty', unit_duty,
        'countryGroup', country_group,
        'usageRateType', usage_rate_type,
        'sourceName', source_name,
        'sourceUrl', source_url,
        'sourceVersion', source_version,
        'effectiveFrom', effective_from,
        'effectiveTo', effective_to,
        'publishedAt', published_at
      )
      order by
        case rate_type
          when 'A' then 1
          when 'C' then 2
          else 10
        end,
        rate_type
    ) as tariff_rates,
    min(duty_rate) filter (where rate_type in ('A', 'C') and duty_rate is not null) as lowest_common_duty_rate,
    count(*)::integer as tariff_rate_count
  from public.tariff_rates
  where status = 'published'
    and effective_from <= current_date
    and (effective_to is null or effective_to >= current_date)
  group by hsk_code
),
customs_requirements as (
  select
    hsk_code,
    jsonb_agg(
      jsonb_build_object(
        'documentName', requirement_document_name,
        'relatedLaw', related_law,
        'sourceName', source_name,
        'sourceUrl', source_url,
        'sourceVersion', source_version,
        'effectiveFrom', effective_from,
        'effectiveTo', effective_to
      )
      order by requirement_document_name, related_law
    ) as customs_confirmation_requirements,
    count(*)::integer as customs_requirement_count
  from public.customs_confirmation_requirements
  where status = 'published'
    and direction = 'import'
    and effective_from <= current_date
    and (effective_to is null or effective_to >= current_date)
  group by hsk_code
),
public_notice_requirements as (
  select
    hsk_code,
    jsonb_agg(
      jsonb_build_object(
        'requirementName', requirement_name,
        'relatedLaw', related_law,
        'agency', agency,
        'procedureSummary', procedure_summary,
        'sourceName', source_name,
        'sourceUrl', source_url,
        'sourceVersion', source_version,
        'effectiveFrom', effective_from,
        'effectiveTo', effective_to
      )
      order by requirement_name, related_law, agency
    ) as integrated_public_notice_requirements,
    count(*)::integer as public_notice_requirement_count
  from public.integrated_public_notice_requirements
  where status = 'published'
    and direction = 'import'
    and effective_from <= current_date
    and (effective_to is null or effective_to >= current_date)
  group by hsk_code
),
internal_tax_rules as (
  select
    hs.hsk_code,
    jsonb_agg(
      jsonb_build_object(
        'taxType', tax.tax_type,
        'taxName', tax.tax_name,
        'lawName', tax.law_name,
        'articleRef', tax.article_ref,
        'ruleType', tax.rule_type,
        'hskPattern', tax.hsk_pattern,
        'rateText', tax.rate_text,
        'rateFormula', tax.rate_formula,
        'conditionText', tax.condition_text,
        'sourceName', tax.source_name,
        'sourceUrl', tax.source_url,
        'sourceVersion', tax.source_version,
        'effectiveFrom', tax.effective_from,
        'effectiveTo', tax.effective_to
      )
      order by
        case tax.tax_type when 'vat' then 1 else 2 end,
        tax.tax_name,
        tax.rule_type
    ) as internal_taxes,
    count(*)::integer as internal_tax_count
  from current_hs hs
  join public.internal_tax_law_rules tax
    on tax.status = 'published'
   and tax.effective_from <= current_date
   and (tax.effective_to is null or tax.effective_to >= current_date)
   and (
      (tax.rule_type = 'hsk_exact' and tax.hsk_pattern = hs.hsk_code)
      or (tax.rule_type = 'hs6' and tax.hsk_pattern = hs.hs6)
      or (tax.rule_type = 'hs4' and tax.hsk_pattern = left(hs.hsk_code, 4))
      or (tax.rule_type = 'manual_review' and tax.hsk_pattern is null)
    )
  group by hs.hsk_code
)
select
  hs.hsk_code,
  hs.hs6,
  hs.hs4,
  hs.hs2,
  hs.korean_name,
  hs.english_name,
  hs.quantity_unit,
  hs.weight_unit,
  coalesce(tariffs.tariff_rates, '[]'::jsonb) as tariff_rates,
  tariffs.lowest_common_duty_rate,
  coalesce(tariffs.tariff_rate_count, 0) as tariff_rate_count,
  coalesce(customs.customs_confirmation_requirements, '[]'::jsonb) as customs_confirmation_requirements,
  coalesce(customs.customs_requirement_count, 0) as customs_requirement_count,
  coalesce(public_notice.integrated_public_notice_requirements, '[]'::jsonb) as integrated_public_notice_requirements,
  coalesce(public_notice.public_notice_requirement_count, 0) as public_notice_requirement_count,
  coalesce(internal_tax.internal_taxes, '[]'::jsonb) as internal_taxes,
  coalesce(internal_tax.internal_tax_count, 0) as internal_tax_count,
  jsonb_build_object(
    'hasTariffRates', coalesce(tariffs.tariff_rate_count, 0) > 0,
    'hasCustomsConfirmationRequirements', coalesce(customs.customs_requirement_count, 0) > 0,
    'hasIntegratedPublicNoticeRequirements', coalesce(public_notice.public_notice_requirement_count, 0) > 0,
    'hasInternalTaxes', coalesce(internal_tax.internal_tax_count, 0) > 0
  ) as coverage_flags,
  jsonb_build_object(
    'hsMaster', jsonb_build_object(
      'sourceName', hs.source_name,
      'sourceUrl', hs.source_url,
      'sourceVersion', hs.source_version,
      'effectiveFrom', hs.effective_from,
      'effectiveTo', hs.effective_to,
      'publishedAt', hs.published_at,
      'retrievedAt', hs.retrieved_at,
      'checksum', hs.checksum
    )
  ) as source_snapshot,
  current_date as snapshot_basis_date,
  now() as refreshed_at
from current_hs hs
left join current_tariffs tariffs on tariffs.hsk_code = hs.hsk_code
left join customs_requirements customs on customs.hsk_code = hs.hsk_code
left join public_notice_requirements public_notice on public_notice.hsk_code = hs.hsk_code
left join internal_tax_rules internal_tax on internal_tax.hsk_code = hs.hsk_code;

create unique index if not exists domestic_hs_lookup_snapshots_hsk_idx
  on public.domestic_hs_lookup_snapshots(hsk_code);

create index if not exists domestic_hs_lookup_snapshots_hs6_idx
  on public.domestic_hs_lookup_snapshots(hs6);

create index if not exists domestic_hs_lookup_snapshots_coverage_idx
  on public.domestic_hs_lookup_snapshots(tariff_rate_count, customs_requirement_count, public_notice_requirement_count, internal_tax_count);

grant select on public.domestic_hs_lookup_snapshots to anon, authenticated;

create or replace function public.refresh_domestic_hs_lookup_snapshots()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  refresh materialized view public.domestic_hs_lookup_snapshots;
end;
$$;

grant execute on function public.refresh_domestic_hs_lookup_snapshots() to service_role;

create or replace function public.get_domestic_hs_lookup_snapshot_coverage()
returns table (
  snapshot_basis_date date,
  total_hsk10 bigint,
  with_tariff_rates bigint,
  missing_tariff_rates bigint,
  with_customs_requirements bigint,
  with_public_notice_requirements bigint,
  with_internal_taxes bigint,
  last_refreshed_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    max(snapshot_basis_date) as snapshot_basis_date,
    count(*)::bigint as total_hsk10,
    count(*) filter (where tariff_rate_count > 0)::bigint as with_tariff_rates,
    count(*) filter (where tariff_rate_count = 0)::bigint as missing_tariff_rates,
    count(*) filter (where customs_requirement_count > 0)::bigint as with_customs_requirements,
    count(*) filter (where public_notice_requirement_count > 0)::bigint as with_public_notice_requirements,
    count(*) filter (where internal_tax_count > 0)::bigint as with_internal_taxes,
    max(refreshed_at) as last_refreshed_at
  from public.domestic_hs_lookup_snapshots;
$$;

grant execute on function public.get_domestic_hs_lookup_snapshot_coverage() to authenticated;

create or replace function public.refresh_operations_snapshots(p_basis_date date default current_date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_has_destination_coverage boolean;
  v_has_domestic_lookup_snapshot boolean;
begin
  perform public.refresh_dashboard_metrics(p_basis_date);

  select exists (
    select 1
    from pg_matviews
    where schemaname = 'public'
      and matviewname = 'export_destination_country_coverage'
  )
  into v_has_destination_coverage;

  if v_has_destination_coverage then
    refresh materialized view public.export_destination_country_coverage;
  end if;

  select exists (
    select 1
    from pg_matviews
    where schemaname = 'public'
      and matviewname = 'domestic_hs_lookup_snapshots'
  )
  into v_has_domestic_lookup_snapshot;

  if v_has_domestic_lookup_snapshot then
    refresh materialized view public.domestic_hs_lookup_snapshots;
  end if;

  return jsonb_build_object(
    'basisDate', p_basis_date,
    'dashboardMetricsRefreshed', true,
    'destinationCoverageRefreshed', v_has_destination_coverage,
    'domesticLookupSnapshotRefreshed', v_has_domestic_lookup_snapshot,
    'refreshedAt', now()
  );
end;
$$;

revoke all on function public.refresh_operations_snapshots(date) from public;
grant execute on function public.refresh_operations_snapshots(date) to service_role;
