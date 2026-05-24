delete from public.tariff_rates
where id in (
  select id
  from (
    select
      id,
      row_number() over (
        partition by
          hsk_code,
          rate_type,
          duty_rate,
          unit_duty,
          country_group,
          usage_rate_type,
          source_version,
          effective_from,
          effective_to,
          status
        order by retrieved_at desc, id
      ) as duplicate_rank
    from public.tariff_rates
  ) ranked
  where duplicate_rank > 1
);

create unique index if not exists tariff_rates_snapshot_unique_idx
  on public.tariff_rates (
    hsk_code,
    rate_type,
    coalesce(duty_rate, -999999999),
    coalesce(unit_duty, -999999999),
    coalesce(country_group, ''),
    coalesce(usage_rate_type, ''),
    source_version,
    effective_from,
    coalesce(effective_to, '9999-12-31'::date),
    status
  );
