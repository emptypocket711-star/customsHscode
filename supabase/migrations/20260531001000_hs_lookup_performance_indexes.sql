create index if not exists hs_master_hs6_status_effective_hsk_idx
  on public.hs_master(hs6, status, effective_from, effective_to, hsk_code);

create index if not exists standard_product_names_hsk_status_effective_name_idx
  on public.standard_product_names(hsk_code, status, effective_from, effective_to, standard_name_kr);

create index if not exists tariff_rates_hsk_status_effective_type_idx
  on public.tariff_rates(hsk_code, status, effective_from, effective_to, rate_type);

create index if not exists customs_requirements_hsk_direction_status_effective_law_idx
  on public.customs_confirmation_requirements(hsk_code, direction, status, effective_from, effective_to, related_law);

create index if not exists public_notice_requirements_hsk_direction_status_effective_law_idx
  on public.integrated_public_notice_requirements(hsk_code, direction, status, effective_from, effective_to, related_law);
