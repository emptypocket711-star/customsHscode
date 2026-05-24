create extension if not exists pg_trgm with schema public;

create index if not exists hs_master_hs6_effective_idx
  on public.hs_master(hs6, effective_from, effective_to, status);

create index if not exists hs_master_status_effective_hsk_idx
  on public.hs_master(status, effective_from, effective_to, hsk_code);

create index if not exists hs_master_korean_name_trgm_idx
  on public.hs_master using gin (lower(korean_name) gin_trgm_ops);

create index if not exists hs_master_english_name_trgm_idx
  on public.hs_master using gin (lower(english_name) gin_trgm_ops)
  where english_name is not null;

create index if not exists standard_product_names_search_trgm_idx
  on public.standard_product_names using gin (
    lower(coalesce(standard_name_kr, '') || ' ' || coalesce(required_spec_kr, '') || ' ' || coalesce(detailed_classification, '')) gin_trgm_ops
  );

create index if not exists standard_product_names_lookup_effective_idx
  on public.standard_product_names(hsk_code, status, effective_from, effective_to);

create index if not exists tariff_rates_hs6_effective_idx
  on public.tariff_rates(left(hsk_code, 6), effective_from, effective_to, status);

create index if not exists tariff_rates_hsk_status_effective_idx
  on public.tariff_rates(hsk_code, status, effective_from, effective_to);

create index if not exists customs_requirements_hs6_direction_effective_idx
  on public.customs_confirmation_requirements(left(hsk_code, 6), direction, effective_from, effective_to, status);

create index if not exists export_destination_tariff_rates_country_hs_effective_status_idx
  on public.export_destination_tariff_rates(country_code, destination_hs_code, effective_from, effective_to, status);

create index if not exists export_destination_tariff_rates_hs6_country_effective_status_idx
  on public.export_destination_tariff_rates(left(destination_hs_code, 6), country_code, effective_from, effective_to, status);

create index if not exists export_destination_import_requirements_hs6_country_effective_status_idx
  on public.export_destination_import_requirements(left(destination_hs_code, 6), country_code, effective_from, effective_to, status);

create index if not exists export_destination_internal_taxes_hs6_country_effective_status_idx
  on public.export_destination_internal_taxes(left(destination_hs_code, 6), country_code, effective_from, effective_to, status);

create index if not exists export_destination_customs_codes_country_customs_tariff_idx
  on public.export_destination_customs_codes(country_code, customs_code, tariff_code, effective_from, effective_to, status);
