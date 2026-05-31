create or replace function public.lookup_hs6_explorer(p_hs6 text, p_basis_date date default current_date)
returns table (payload jsonb)
language sql
stable
security definer
set search_path = public
as $$
  with normalized as (
    select regexp_replace(coalesce(p_hs6, ''), '[^0-9]', '', 'g') as code
  ),
  rows as (
    select
      to_jsonb(snapshot.*)
      || jsonb_build_object(
        'children_json',
        coalesce((
          select jsonb_agg(
            child
              - 'internal_taxes'
              - 'coverage_flags'
              - 'lowest_common_duty_rate'
              - 'tariff_rate_count'
              - 'customs_requirement_count'
              - 'public_notice_requirement_count'
              - 'internal_tax_count'
              - 'snapshot_basis_date'
              - 'refreshed_at'
            order by child->>'hsk_code'
          )
          from jsonb_array_elements(coalesce(snapshot.children_json, '[]'::jsonb)) child
        ), '[]'::jsonb)
      ) as row_json
    from public.hs6_lookup_snapshot snapshot, normalized
    where snapshot.hs6 = normalized.code
      and snapshot.snapshot_basis_date = p_basis_date
  )
  select jsonb_build_object(
    'lookupMode', 'hs6_explorer',
    'basisDate', p_basis_date,
    'rows', coalesce(jsonb_agg(row_json order by row_json->>'hs6'), '[]'::jsonb)
  )
  from rows;
$$;

create or replace function public.lookup_hs4_explorer(p_hs4 text, p_basis_date date default current_date)
returns table (payload jsonb)
language sql
stable
security definer
set search_path = public
as $$
  with normalized as (
    select regexp_replace(coalesce(p_hs4, ''), '[^0-9]', '', 'g') as code
  ),
  rows as (
    select
      to_jsonb(snapshot.*)
      || jsonb_build_object(
        'hs6_groups_json',
        coalesce((
          select jsonb_agg(
            hs6_group
            || jsonb_build_object(
              'children',
              coalesce((
                select jsonb_agg(
                  child
                    - 'internal_taxes'
                    - 'coverage_flags'
                    - 'lowest_common_duty_rate'
                    - 'tariff_rate_count'
                    - 'customs_requirement_count'
                    - 'public_notice_requirement_count'
                    - 'internal_tax_count'
                    - 'snapshot_basis_date'
                    - 'refreshed_at'
                  order by child->>'hsk_code'
                )
                from jsonb_array_elements(coalesce(hs6_group->'children', '[]'::jsonb)) child
              ), '[]'::jsonb)
            )
            order by hs6_group->>'hs6'
          )
          from jsonb_array_elements(coalesce(snapshot.hs6_groups_json, '[]'::jsonb)) hs6_group
        ), '[]'::jsonb)
      ) as row_json
    from public.hs4_lookup_snapshot snapshot, normalized
    where snapshot.hs4 = normalized.code
      and snapshot.snapshot_basis_date = p_basis_date
  )
  select jsonb_build_object(
    'lookupMode', 'hs4_explorer',
    'basisDate', p_basis_date,
    'rows', coalesce(jsonb_agg(row_json order by row_json->>'hs4'), '[]'::jsonb)
  )
  from rows;
$$;

grant execute on function public.lookup_hs6_explorer(text, date) to anon, authenticated;
grant execute on function public.lookup_hs4_explorer(text, date) to anon, authenticated;
