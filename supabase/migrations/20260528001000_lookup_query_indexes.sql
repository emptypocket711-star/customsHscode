create index if not exists fta_agreements_country_status_effective_idx
  on public.fta_agreements(country_code, status, effective_from, effective_to);

create index if not exists fta_rates_agreement_hsk_status_effective_idx
  on public.fta_rates(agreement_id, hsk_code, status, effective_from, effective_to)
  where hsk_code is not null;

create index if not exists fta_rates_agreement_hs6_status_effective_idx
  on public.fta_rates(agreement_id, hs6, status, effective_from, effective_to);

create index if not exists fta_psr_agreement_hs6_status_effective_idx
  on public.fta_psr(agreement_id, hs6, status, effective_from, effective_to);

create index if not exists requirement_playbooks_document_status_effective_idx
  on public.requirement_playbooks(requirement_document_name, status, effective_from, effective_to);

create index if not exists requirement_playbooks_law_status_effective_idx
  on public.requirement_playbooks(related_law, status, effective_from, effective_to);

create index if not exists hs_master_hsk_code_pattern_idx
  on public.hs_master(hsk_code text_pattern_ops);

create index if not exists export_destination_tariff_rates_country_hs_pattern_effective_idx
  on public.export_destination_tariff_rates(country_code, destination_hs_code text_pattern_ops, status, effective_from, effective_to);

create index if not exists export_destination_customs_codes_country_customs_pattern_effective_idx
  on public.export_destination_customs_codes(country_code, customs_code text_pattern_ops, status, effective_from, effective_to);

create index if not exists export_destination_customs_codes_country_tariff_pattern_effective_idx
  on public.export_destination_customs_codes(country_code, tariff_code text_pattern_ops, status, effective_from, effective_to);
