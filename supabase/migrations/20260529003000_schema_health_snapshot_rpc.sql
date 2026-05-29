create or replace function public.get_schema_health_snapshot()
returns jsonb
language sql
security definer
set search_path = public, pg_catalog
as $$
  select jsonb_build_object(
    'tables',
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'table', c.relname,
          'rlsEnabled', c.relrowsecurity
        )
        order by c.relname
      )
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind in ('r', 'p')
    ), '[]'::jsonb),
    'columns',
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'table', cols.table_name,
          'column', cols.column_name
        )
        order by cols.table_name, cols.ordinal_position
      )
      from information_schema.columns cols
      where cols.table_schema = 'public'
    ), '[]'::jsonb),
    'functions',
    coalesce((
      select jsonb_agg(function_name order by function_name)
      from (
        select distinct p.proname as function_name
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
      ) public_functions
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.get_schema_health_snapshot() from public;
grant execute on function public.get_schema_health_snapshot() to service_role;
