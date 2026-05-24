create or replace function public.record_exchange_rate_source_snapshot(
  p_source_name text,
  p_source_url text,
  p_source_version text,
  p_effective_from date,
  p_retrieved_at timestamptz,
  p_checksum text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  snapshot_id uuid;
begin
  if p_source_version is null or p_source_version not like 'myc-openapi-api012%' then
    raise exception 'Only API012 exchange-rate snapshots can be recorded.';
  end if;

  if p_effective_from is null then
    raise exception 'effective_from is required.';
  end if;

  insert into public.legal_source_snapshots (
    source_type,
    source_name,
    source_url,
    source_version,
    published_at,
    retrieved_at,
    effective_from,
    effective_to,
    checksum,
    raw_file_path,
    status,
    created_by
  ) values (
    'exchange_rate',
    coalesce(nullif(trim(p_source_name), ''), '관세청 관세환율 정보'),
    coalesce(nullif(trim(p_source_url), ''), 'customs-api://exchange-rate'),
    p_source_version,
    null,
    coalesce(p_retrieved_at, now()),
    p_effective_from,
    null,
    p_checksum,
    null,
    'fetched',
    auth.uid()
  )
  returning id into snapshot_id;

  return snapshot_id;
end;
$$;

grant execute on function public.record_exchange_rate_source_snapshot(text, text, text, date, timestamptz, text) to anon, authenticated;
