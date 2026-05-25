create table if not exists public.hs_lookup_history (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  query text not null,
  normalized_query text not null,
  direction public.request_direction not null default 'import',
  destination_country text not null default 'ALL',
  origin_country text,
  basis_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hs_lookup_history_query_not_blank check (length(trim(query)) > 0),
  constraint hs_lookup_history_user_query_unique unique (created_by, normalized_query, direction, destination_country, basis_date)
);

create index if not exists hs_lookup_history_user_updated_idx
  on public.hs_lookup_history(created_by, updated_at desc);

create index if not exists hs_lookup_history_company_updated_idx
  on public.hs_lookup_history(company_id, updated_at desc);

alter table public.hs_lookup_history enable row level security;

drop policy if exists "users insert own lookup history" on public.hs_lookup_history;
create policy "users insert own lookup history"
  on public.hs_lookup_history
  for insert
  with check (
    created_by = auth.uid()
    and company_id = public.current_company_id()
  );

drop policy if exists "users read own lookup history or staff reads all" on public.hs_lookup_history;
create policy "users read own lookup history or staff reads all"
  on public.hs_lookup_history
  for select
  using (
    created_by = auth.uid()
    or public.is_staff_or_admin()
  );

drop policy if exists "users update own lookup history" on public.hs_lookup_history;
create policy "users update own lookup history"
  on public.hs_lookup_history
  for update
  using (created_by = auth.uid())
  with check (
    created_by = auth.uid()
    and company_id = public.current_company_id()
  );

drop policy if exists "users delete own lookup history or staff deletes all" on public.hs_lookup_history;
create policy "users delete own lookup history or staff deletes all"
  on public.hs_lookup_history
  for delete
  using (
    created_by = auth.uid()
    or public.is_staff_or_admin()
  );

grant select, insert, update, delete on public.hs_lookup_history to authenticated;
