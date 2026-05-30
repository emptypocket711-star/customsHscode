create or replace function public.cleanup_background_job_history(p_retention_days integer default 90)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted_runs integer := 0;
  v_deleted_jobs integer := 0;
begin
  if p_retention_days is null or p_retention_days < 1 then
    raise exception 'retention_days must be at least 1';
  end if;

  delete from public.background_job_runs
  where created_at < now() - make_interval(days => p_retention_days);
  get diagnostics v_deleted_runs = row_count;

  delete from public.background_jobs
  where status in ('succeeded', 'canceled', 'dead')
    and coalesce(finished_at, updated_at, created_at) < now() - make_interval(days => p_retention_days);
  get diagnostics v_deleted_jobs = row_count;

  return jsonb_build_object(
    'deletedRuns', v_deleted_runs,
    'deletedJobs', v_deleted_jobs
  );
end;
$$;

revoke all on function public.cleanup_background_job_history(integer) from public;
grant execute on function public.cleanup_background_job_history(integer) to service_role;
