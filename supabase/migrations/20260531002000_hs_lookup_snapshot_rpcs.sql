create or replace view public.hsk_lookup_snapshot as
select *
from public.domestic_hs_lookup_snapshots;

create materialized view if not exists public.hs6_lookup_snapshot as
select
  hs6,
  min(hs4) as hs4,
  min(hs2) as hs2,
  min(korean_name) as label,
  count(*)::integer as child_hsk_count,
  jsonb_agg(
    to_jsonb(snapshot.*)
    order by hsk_code
  ) as children_json,
  min(snapshot_basis_date) as snapshot_basis_date,
  max(refreshed_at) as refreshed_at
from public.domestic_hs_lookup_snapshots snapshot
group by hs6;

create unique index if not exists hs6_lookup_snapshot_hs6_idx
  on public.hs6_lookup_snapshot(hs6);

create index if not exists hs6_lookup_snapshot_hs4_idx
  on public.hs6_lookup_snapshot(hs4);

grant select on public.hs6_lookup_snapshot to anon, authenticated;

create materialized view if not exists public.hs4_lookup_snapshot as
select
  hs4,
  min(hs2) as hs2,
  min(label) as label,
  count(*)::integer as child_hs6_count,
  sum(child_hsk_count)::integer as child_hsk_count,
  jsonb_agg(
    jsonb_build_object(
      'hs6', hs6,
      'label', label,
      'childHskCount', child_hsk_count,
      'children', children_json
    )
    order by hs6
  ) as hs6_groups_json,
  min(snapshot_basis_date) as snapshot_basis_date,
  max(refreshed_at) as refreshed_at
from public.hs6_lookup_snapshot
group by hs4;

create unique index if not exists hs4_lookup_snapshot_hs4_idx
  on public.hs4_lookup_snapshot(hs4);

grant select on public.hs4_lookup_snapshot to anon, authenticated;

create or replace function public.refresh_hs_lookup_snapshots()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  refresh materialized view public.domestic_hs_lookup_snapshots;
  refresh materialized view public.hs6_lookup_snapshot;
  refresh materialized view public.hs4_lookup_snapshot;
end;
$$;

revoke all on function public.refresh_hs_lookup_snapshots() from public;
grant execute on function public.refresh_hs_lookup_snapshots() to service_role;

create or replace function public.lookup_hsk_detail(p_code text, p_basis_date date default current_date)
returns table (payload jsonb)
language sql
stable
security definer
set search_path = public
as $$
  with normalized as (
    select regexp_replace(coalesce(p_code, ''), '[^0-9]', '', 'g') as code
  ),
  rows as (
    select
      to_jsonb(snapshot.*)
      || jsonb_build_object(
        'standardNames',
        coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'name', standard.standard_name_kr,
              'requiredSpec', standard.required_spec_kr,
              'sourceName', standard.source_name,
              'sourceVersion', standard.source_version
            )
            order by standard.standard_name_kr
          )
          from public.standard_product_names standard
          where standard.hsk_code = snapshot.hsk_code
            and standard.status = 'published'
            and standard.effective_from <= p_basis_date
            and (standard.effective_to is null or standard.effective_to >= p_basis_date)
        ), '[]'::jsonb),
        'siblings',
        coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'hskCode', sibling.hsk_code,
              'koreanName', sibling.korean_name,
              'isSelected', sibling.hsk_code = snapshot.hsk_code
            )
            order by sibling.hsk_code
          )
          from public.hsk_lookup_snapshot sibling
          where sibling.hs6 = snapshot.hs6
            and sibling.snapshot_basis_date = p_basis_date
        ), '[]'::jsonb)
      ) as row_json
    from public.hsk_lookup_snapshot snapshot, normalized
    where snapshot.hsk_code = normalized.code
      and snapshot.snapshot_basis_date = p_basis_date
  )
  select jsonb_build_object(
    'lookupMode', 'hsk_detail',
    'basisDate', p_basis_date,
    'rows', coalesce(jsonb_agg(row_json), '[]'::jsonb)
  )
  from rows;
$$;

create or replace function public.lookup_hs6_explorer(p_hs6 text, p_basis_date date default current_date)
returns table (payload jsonb)
language sql
stable
security definer
set search_path = public
as $$
  with normalized as (
    select regexp_replace(coalesce(p_hs6, ''), '[^0-9]', '', 'g') as code
  )
  select jsonb_build_object(
    'lookupMode', 'hs6_explorer',
    'basisDate', p_basis_date,
    'rows', coalesce(jsonb_agg(to_jsonb(snapshot.*) order by snapshot.hs6), '[]'::jsonb)
  )
  from public.hs6_lookup_snapshot snapshot, normalized
  where snapshot.hs6 = normalized.code
    and snapshot.snapshot_basis_date = p_basis_date;
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
  )
  select jsonb_build_object(
    'lookupMode', 'hs4_explorer',
    'basisDate', p_basis_date,
    'rows', coalesce(jsonb_agg(to_jsonb(snapshot.*) order by snapshot.hs4), '[]'::jsonb)
  )
  from public.hs4_lookup_snapshot snapshot, normalized
  where snapshot.hs4 = normalized.code
    and snapshot.snapshot_basis_date = p_basis_date;
$$;

grant execute on function public.lookup_hsk_detail(text, date) to anon, authenticated;
grant execute on function public.lookup_hs6_explorer(text, date) to anon, authenticated;
grant execute on function public.lookup_hs4_explorer(text, date) to anon, authenticated;
