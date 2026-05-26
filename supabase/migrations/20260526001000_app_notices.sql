create table if not exists public.app_notices (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 160),
  body text not null check (char_length(trim(body)) between 1 and 4000),
  category text not null default 'notice' check (category in ('notice', 'maintenance', 'data_update', 'release')),
  is_published boolean not null default true,
  pinned boolean not null default false,
  published_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_notices_dashboard_idx
  on public.app_notices (is_published, pinned desc, published_at desc, created_at desc);

create or replace function public.set_app_notices_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.app_notices enable row level security;

drop policy if exists "authenticated users read published notices" on public.app_notices;
create policy "authenticated users read published notices"
  on public.app_notices
  for select
  to authenticated
  using (is_published = true);

drop policy if exists "developer reads all notices" on public.app_notices;
create policy "developer reads all notices"
  on public.app_notices
  for select
  to authenticated
  using (
    public.current_user_role() = 'developer'::public.user_role
    and auth.jwt() ->> 'email' = 'emptypocket711@gmail.com'
  );

drop policy if exists "developer manages notices" on public.app_notices;
create policy "developer manages notices"
  on public.app_notices
  for all
  to authenticated
  using (
    public.current_user_role() = 'developer'::public.user_role
    and auth.jwt() ->> 'email' = 'emptypocket711@gmail.com'
  )
  with check (
    public.current_user_role() = 'developer'::public.user_role
    and auth.jwt() ->> 'email' = 'emptypocket711@gmail.com'
  );

drop trigger if exists set_app_notices_updated_at on public.app_notices;
create trigger set_app_notices_updated_at
  before update on public.app_notices
  for each row
  execute function public.set_app_notices_updated_at();
