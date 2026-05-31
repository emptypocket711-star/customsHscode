create table if not exists public.lookup_cache_entries (
  namespace text not null,
  cache_key text not null,
  encoded_value text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (namespace, cache_key)
);

create index if not exists lookup_cache_entries_expires_idx
  on public.lookup_cache_entries(expires_at);

alter table public.lookup_cache_entries enable row level security;

drop policy if exists "developer reads lookup cache entries" on public.lookup_cache_entries;
create policy "developer reads lookup cache entries"
  on public.lookup_cache_entries
  for select
  using (public.current_user_role() = 'developer'::public.user_role);

drop policy if exists "service role manages lookup cache entries" on public.lookup_cache_entries;
create policy "service role manages lookup cache entries"
  on public.lookup_cache_entries
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

grant select on public.lookup_cache_entries to authenticated;
grant select, insert, update, delete on public.lookup_cache_entries to service_role;
