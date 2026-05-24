drop policy if exists "published legal data readable by authenticated users" on public.hs_master;
create policy "published legal data readable by app users" on public.hs_master
  for select to anon, authenticated using (status = 'published');

drop policy if exists "published standard names readable by authenticated users" on public.standard_product_names;
create policy "published standard names readable by app users" on public.standard_product_names
  for select to anon, authenticated using (status = 'published');

drop policy if exists "published tariff data readable by authenticated users" on public.tariff_rates;
create policy "published tariff data readable by app users" on public.tariff_rates
  for select to anon, authenticated using (status = 'published');

drop policy if exists "published fta agreements readable by authenticated users" on public.fta_agreements;
create policy "published fta agreements readable by app users" on public.fta_agreements
  for select to anon, authenticated using (status = 'published');

drop policy if exists "published fta rates readable by authenticated users" on public.fta_rates;
create policy "published fta rates readable by app users" on public.fta_rates
  for select to anon, authenticated using (status = 'published');

drop policy if exists "published fta psr readable by authenticated users" on public.fta_psr;
create policy "published fta psr readable by app users" on public.fta_psr
  for select to anon, authenticated using (status = 'published');

drop policy if exists "published customs requirements readable by authenticated users" on public.customs_confirmation_requirements;
create policy "published customs requirements readable by app users" on public.customs_confirmation_requirements
  for select to anon, authenticated using (status = 'published');

drop policy if exists "published public notice requirements readable by authenticated users" on public.integrated_public_notice_requirements;
create policy "published public notice requirements readable by app users" on public.integrated_public_notice_requirements
  for select to anon, authenticated using (status = 'published');

drop policy if exists "published playbooks readable by authenticated users" on public.requirement_playbooks;
create policy "published playbooks readable by app users" on public.requirement_playbooks
  for select to anon, authenticated using (status = 'published');

drop policy if exists "published export controls readable by authenticated users" on public.export_control_checks;
create policy "published export controls readable by app users" on public.export_control_checks
  for select to anon, authenticated using (status = 'published');

drop policy if exists "published export destination tariff rates readable by authenticated users" on public.export_destination_tariff_rates;
create policy "published export destination tariff rates readable by app users" on public.export_destination_tariff_rates
  for select to anon, authenticated using (status = 'published');

drop policy if exists "published customs statistical codes readable by authenticated users" on public.customs_statistical_codes;
create policy "published customs statistical codes readable by app users" on public.customs_statistical_codes
  for select to anon, authenticated using (status = 'published');
