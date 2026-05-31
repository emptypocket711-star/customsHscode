create or replace function public.refresh_domestic_hs_lookup_snapshots()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  set local timezone = 'Asia/Seoul';
  set local statement_timeout = '120s';
  refresh materialized view public.domestic_hs_lookup_snapshots;
end;
$$;

grant execute on function public.refresh_domestic_hs_lookup_snapshots() to service_role;

create or replace function public.refresh_hs_lookup_snapshots()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  set local timezone = 'Asia/Seoul';
  set local statement_timeout = '120s';
  refresh materialized view public.domestic_hs_lookup_snapshots;
  refresh materialized view public.hs6_lookup_snapshot;
  refresh materialized view public.hs4_lookup_snapshot;
end;
$$;

revoke all on function public.refresh_hs_lookup_snapshots() from public;
grant execute on function public.refresh_hs_lookup_snapshots() to service_role;
