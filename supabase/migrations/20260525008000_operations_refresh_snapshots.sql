create or replace function public.refresh_operations_snapshots(p_basis_date date default current_date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_has_destination_coverage boolean;
begin
  perform public.refresh_dashboard_metrics(p_basis_date);

  select exists (
    select 1
    from pg_matviews
    where schemaname = 'public'
      and matviewname = 'export_destination_country_coverage'
  )
  into v_has_destination_coverage;

  if v_has_destination_coverage then
    refresh materialized view public.export_destination_country_coverage;
  end if;

  return jsonb_build_object(
    'basisDate', p_basis_date,
    'dashboardMetricsRefreshed', true,
    'destinationCoverageRefreshed', v_has_destination_coverage,
    'refreshedAt', now()
  );
end;
$$;

revoke all on function public.refresh_operations_snapshots(date) from public;
grant execute on function public.refresh_operations_snapshots(date) to service_role;
