alter table public.internal_tax_law_rules
  add column if not exists tax_base_type text not null default 'taxable_value'
  check (tax_base_type in (
    'taxable_value',
    'customs_duty',
    'taxable_value_plus_customs_duty',
    'previous_internal_tax_total',
    'taxable_value_plus_customs_duty_plus_previous_internal_tax'
  ));

update public.internal_tax_law_rules
set tax_base_type = 'previous_internal_tax_total'
where tax_name like '%교육세%'
   or tax_name like '%농어촌특별세%';
