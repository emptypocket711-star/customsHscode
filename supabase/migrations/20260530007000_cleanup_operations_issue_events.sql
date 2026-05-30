create or replace function public.cleanup_operations_issue_events(p_retention_days integer default 180)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer := 0;
begin
  if p_retention_days is null or p_retention_days < 1 then
    raise exception 'retention_days must be at least 1';
  end if;

  delete from public.operations_issue_events
  where status in ('resolved', 'ignored')
    and coalesce(resolved_at, updated_at, created_at) < now() - make_interval(days => p_retention_days);

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.cleanup_operations_issue_events(integer) from public;
grant execute on function public.cleanup_operations_issue_events(integer) to service_role;
