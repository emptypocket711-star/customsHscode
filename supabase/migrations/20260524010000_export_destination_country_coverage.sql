do $$
begin
  if exists (
    select 1
    from pg_matviews
    where schemaname = 'public'
      and matviewname = 'export_destination_country_coverage'
  ) then
    execute 'drop materialized view public.export_destination_country_coverage';
  elsif exists (
    select 1
    from pg_views
    where schemaname = 'public'
      and viewname = 'export_destination_country_coverage'
  ) then
    execute 'drop view public.export_destination_country_coverage';
  end if;
end $$;

create materialized view public.export_destination_country_coverage as
with eu_members(country_code) as (
  values
    ('AUT'), ('BEL'), ('BGR'), ('HRV'), ('CYP'), ('CZE'), ('DNK'), ('EST'), ('FIN'),
    ('FRA'), ('DEU'), ('GRC'), ('HUN'), ('IRL'), ('ITA'), ('LVA'), ('LTU'), ('LUX'),
    ('MLT'), ('NLD'), ('POL'), ('PRT'), ('ROU'), ('SVK'), ('SVN'), ('ESP'), ('SWE')
),
normalized_tariff_rows as (
  select
    case country_code
      when 'AU' then 'AUS'
      when 'CAM' then 'KHM'
      when 'CA' then 'CAN'
      when 'CN' then 'CHN'
      when 'DE' then 'DEU'
      when 'FR' then 'FRA'
      when 'MYA' then 'MMR'
      when 'BRN' then 'BRU'
      when 'GB' then 'GBR'
      when 'US' then 'USA'
      when 'BD' then 'BGD'
      when 'IN' then 'IND'
      else country_code
    end as country_code,
    destination_hs_code
  from public.export_destination_tariff_rates
  where status = 'published'
    and effective_from <= current_date
    and (effective_to is null or effective_to >= current_date)
  union all
  select eu_members.country_code, export_destination_tariff_rates.destination_hs_code
  from public.export_destination_tariff_rates
  cross join eu_members
  where export_destination_tariff_rates.status = 'published'
    and export_destination_tariff_rates.country_code = 'EEC'
    and export_destination_tariff_rates.effective_from <= current_date
    and (export_destination_tariff_rates.effective_to is null or export_destination_tariff_rates.effective_to >= current_date)
),
normalized_internal_tax_rows as (
  select
    normalized.country_code,
    normalized.destination_hs_code
  from (
    select
      case country_code
        when 'AU' then 'AUS'
        when 'CAM' then 'KHM'
        when 'CA' then 'CAN'
        when 'CN' then 'CHN'
        when 'DE' then 'DEU'
        when 'FR' then 'FRA'
        when 'MYA' then 'MMR'
        when 'BRN' then 'BRU'
        when 'GB' then 'GBR'
        when 'US' then 'USA'
        when 'BD' then 'BGD'
        when 'IN' then 'IND'
        else country_code
      end as country_code,
      destination_hs_code
    from public.export_destination_internal_taxes
    where status = 'published'
      and effective_from <= current_date
      and (effective_to is null or effective_to >= current_date)
  ) normalized
  where exists (
    select 1
    from normalized_tariff_rows tariff
    where tariff.country_code = normalized.country_code
      and tariff.destination_hs_code = normalized.destination_hs_code
  )
),
normalized_requirement_rows as (
  select
    case country_code
      when 'AU' then 'AUS'
      when 'CAM' then 'KHM'
      when 'CA' then 'CAN'
      when 'CN' then 'CHN'
      when 'DE' then 'DEU'
      when 'FR' then 'FRA'
      when 'MYA' then 'MMR'
      when 'BRN' then 'BRU'
      when 'GB' then 'GBR'
      when 'US' then 'USA'
      when 'BD' then 'BGD'
      when 'IN' then 'IND'
      else country_code
    end as country_code
  from public.export_destination_import_requirements
  where status = 'published'
    and effective_from <= current_date
    and (effective_to is null or effective_to >= current_date)
  union all
  select eu_members.country_code
  from public.export_destination_import_requirements
  cross join eu_members
  where export_destination_import_requirements.status = 'published'
    and export_destination_import_requirements.country_code = 'EEC'
    and export_destination_import_requirements.effective_from <= current_date
    and (export_destination_import_requirements.effective_to is null or export_destination_import_requirements.effective_to >= current_date)
),
normalized_additional_tariff_rows as (
  select
    case country_code
      when 'AU' then 'AUS'
      when 'CAM' then 'KHM'
      when 'CA' then 'CAN'
      when 'CN' then 'CHN'
      when 'DE' then 'DEU'
      when 'FR' then 'FRA'
      when 'MYA' then 'MMR'
      when 'BRN' then 'BRU'
      when 'GB' then 'GBR'
      when 'US' then 'USA'
      when 'BD' then 'BGD'
      when 'IN' then 'IND'
      else country_code
    end as country_code
  from public.export_destination_additional_tariffs
  where status = 'published'
    and effective_from <= current_date
    and (effective_to is null or effective_to >= current_date)
),
normalized_trade_remedy_rows as (
  select
    case country_code
      when 'AU' then 'AUS'
      when 'CAM' then 'KHM'
      when 'CA' then 'CAN'
      when 'CN' then 'CHN'
      when 'DE' then 'DEU'
      when 'FR' then 'FRA'
      when 'MYA' then 'MMR'
      when 'BRN' then 'BRU'
      when 'GB' then 'GBR'
      when 'US' then 'USA'
      when 'BD' then 'BGD'
      when 'IN' then 'IND'
      else country_code
    end as country_code
  from public.export_destination_trade_remedy_cases
  where status = 'published'
    and effective_from <= current_date
    and (effective_to is null or effective_to >= current_date)
),
normalized_data_source_rows as (
  select
    case country_code
      when 'AU' then 'AUS'
      when 'CAM' then 'KHM'
      when 'CA' then 'CAN'
      when 'CN' then 'CHN'
      when 'DE' then 'DEU'
      when 'FR' then 'FRA'
      when 'MYA' then 'MMR'
      when 'BRN' then 'BRU'
      when 'GB' then 'GBR'
      when 'US' then 'USA'
      when 'BD' then 'BGD'
      when 'IN' then 'IND'
      else country_code
    end as country_code
  from public.export_destination_data_sources
  where status = 'published'
  union all
  select eu_members.country_code
  from public.export_destination_data_sources
  cross join eu_members
  where export_destination_data_sources.status = 'published'
    and export_destination_data_sources.country_code = 'EEC'
),
countries as (
  select country_code from normalized_tariff_rows
  union
  select country_code from normalized_internal_tax_rows
  union
  select country_code from normalized_requirement_rows
  union
  select country_code from normalized_additional_tariff_rows
  union
  select country_code from normalized_trade_remedy_rows
  union
  select country_code from normalized_data_source_rows
),
tariffs as (
  select country_code, count(distinct destination_hs_code)::bigint as row_count
  from normalized_tariff_rows
  group by country_code
),
internal_taxes as (
  select country_code, count(distinct destination_hs_code)::bigint as row_count
  from normalized_internal_tax_rows
  group by country_code
),
requirements as (
  select country_code, count(*)::bigint as row_count
  from normalized_requirement_rows
  group by country_code
),
additional_tariffs as (
  select country_code, count(*)::bigint as row_count
  from normalized_additional_tariff_rows
  group by country_code
),
trade_remedies as (
  select country_code, count(*)::bigint as row_count
  from normalized_trade_remedy_rows
  group by country_code
),
data_sources as (
  select country_code, count(*)::bigint as row_count
  from normalized_data_source_rows
  group by country_code
)
select
  countries.country_code,
  coalesce(tariffs.row_count, 0) as tariff_count,
  coalesce(internal_taxes.row_count, 0) as internal_tax_count,
  coalesce(requirements.row_count, 0) as requirement_count,
  coalesce(additional_tariffs.row_count, 0) as additional_tariff_count,
  coalesce(trade_remedies.row_count, 0) as trade_remedy_count,
  coalesce(data_sources.row_count, 0) as data_source_count
from countries
left join tariffs on tariffs.country_code = countries.country_code
left join internal_taxes on internal_taxes.country_code = countries.country_code
left join requirements on requirements.country_code = countries.country_code
left join additional_tariffs on additional_tariffs.country_code = countries.country_code
left join trade_remedies on trade_remedies.country_code = countries.country_code
left join data_sources on data_sources.country_code = countries.country_code
with data;

create unique index export_destination_country_coverage_country_idx
  on public.export_destination_country_coverage(country_code);

grant select on public.export_destination_country_coverage to anon, authenticated;
