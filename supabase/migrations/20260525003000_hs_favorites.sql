create table if not exists public.hs_favorites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  hsk_code text not null,
  display_name text,
  basis_date date,
  created_at timestamptz not null default now(),
  constraint hs_favorites_hsk_code_digits check (hsk_code ~ '^[0-9]{10}$'),
  constraint hs_favorites_user_code_unique unique (company_id, created_by, hsk_code)
);

create index if not exists hs_favorites_user_created_idx on public.hs_favorites(created_by, created_at desc);
create index if not exists hs_favorites_company_created_idx on public.hs_favorites(company_id, created_at desc);

alter table public.hs_favorites enable row level security;

drop policy if exists "users read own hs favorites or staff reads all" on public.hs_favorites;
create policy "users read own hs favorites or staff reads all" on public.hs_favorites
  for select using (created_by = auth.uid() or public.is_staff_or_admin());

drop policy if exists "users insert own hs favorites" on public.hs_favorites;
create policy "users insert own hs favorites" on public.hs_favorites
  for insert with check (
    created_by = auth.uid()
    and company_id = public.current_company_id()
  );

drop policy if exists "users update own hs favorites or staff updates all" on public.hs_favorites;
create policy "users update own hs favorites or staff updates all" on public.hs_favorites
  for update using (created_by = auth.uid() or public.is_staff_or_admin())
  with check (created_by = auth.uid() or public.is_staff_or_admin());

drop policy if exists "users delete own hs favorites or staff deletes all" on public.hs_favorites;
create policy "users delete own hs favorites or staff deletes all" on public.hs_favorites
  for delete using (created_by = auth.uid() or public.is_staff_or_admin());
