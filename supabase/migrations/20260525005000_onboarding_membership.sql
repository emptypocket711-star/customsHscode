alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz;

update public.profiles
set onboarding_completed_at = coalesce(onboarding_completed_at, created_at, now())
where company_id is not null
  and onboarding_completed_at is null;

create table if not exists public.company_join_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  full_name text,
  requested_business_types text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint company_join_requests_one_pending unique (company_id, user_id, status)
);

create index if not exists company_join_requests_user_status_idx
  on public.company_join_requests(user_id, status, created_at desc);

create index if not exists company_join_requests_company_status_idx
  on public.company_join_requests(company_id, status, created_at desc);

alter table public.company_join_requests enable row level security;

drop policy if exists "users read own join requests or staff reads all" on public.company_join_requests;
create policy "users read own join requests or staff reads all" on public.company_join_requests
  for select using (user_id = auth.uid() or public.is_staff_or_admin());

drop policy if exists "staff manages company join requests" on public.company_join_requests;
create policy "staff manages company join requests" on public.company_join_requests
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_company_name text;
  v_full_name text;
  v_role public.user_role;
  v_onboarding_completed_at timestamptz;
begin
  v_company_name := coalesce(nullif(new.raw_user_meta_data->>'company_name', ''), split_part(coalesce(new.email, 'client'), '@', 1) || ' 회사');
  v_full_name := coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(coalesce(new.email, '사용자'), '@', 1));
  v_role := case when lower(coalesce(new.email, '')) = 'emptypocket711@gmail.com' then 'developer'::public.user_role else 'client'::public.user_role end;
  v_onboarding_completed_at := case when v_role = 'developer' then now() else null end;

  insert into public.companies (name, type)
  values (v_company_name, case when v_role = 'developer' then 'internal' else 'client' end)
  returning id into v_company_id;

  insert into public.profiles (id, email, full_name, role, company_id, onboarding_completed_at)
  values (new.id, new.email, v_full_name, v_role, v_company_id, v_onboarding_completed_at)
  on conflict (id) do update
    set email = excluded.email,
        role = case when lower(coalesce(excluded.email, '')) = 'emptypocket711@gmail.com' then 'developer'::public.user_role else public.profiles.role end;

  return new;
end;
$$;

create or replace function public.ensure_client_profile(
  p_company_name text default null,
  p_full_name text default null,
  p_business_types text[] default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user auth.users%rowtype;
  v_company_id uuid;
  v_existing_company_id uuid;
  v_role public.user_role;
  v_company_name text;
  v_business_types text[];
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select *
    into v_user
  from auth.users
  where id = auth.uid();

  v_role := case when lower(coalesce(v_user.email, '')) = 'emptypocket711@gmail.com' then 'developer'::public.user_role else 'client'::public.user_role end;
  v_company_name := coalesce(nullif(trim(p_company_name), ''), split_part(coalesce(v_user.email, 'client'), '@', 1) || ' 회사');
  v_business_types := coalesce(p_business_types, '{}'::text[]);

  select company_id
    into v_existing_company_id
  from public.profiles
  where id = auth.uid();

  if v_existing_company_id is not null then
    update public.companies
      set name = case when nullif(trim(p_company_name), '') is not null then v_company_name else name end,
          business_types = (
            select array(
              select distinct unnest(public.companies.business_types || v_business_types)
              order by 1
            )
          )
    where id = v_existing_company_id;

    update public.profiles
      set role = case when lower(coalesce(v_user.email, '')) = 'emptypocket711@gmail.com' then 'developer'::public.user_role else role end,
          email = coalesce(email, v_user.email),
          full_name = coalesce(nullif(p_full_name, ''), full_name),
          onboarding_completed_at = coalesce(onboarding_completed_at, now())
    where id = auth.uid();

    return v_existing_company_id;
  end if;

  insert into public.companies (name, type, business_types)
  values (
    v_company_name,
    case when v_role = 'developer' then 'internal' else 'client' end,
    v_business_types
  )
  returning id into v_company_id;

  insert into public.profiles (id, email, full_name, role, company_id, onboarding_completed_at)
  values (
    auth.uid(),
    v_user.email,
    coalesce(nullif(p_full_name, ''), split_part(coalesce(v_user.email, '사용자'), '@', 1)),
    v_role,
    v_company_id,
    now()
  )
  on conflict (id) do update
    set company_id = coalesce(public.profiles.company_id, excluded.company_id),
        email = coalesce(public.profiles.email, excluded.email),
        full_name = coalesce(nullif(p_full_name, ''), public.profiles.full_name, excluded.full_name),
        onboarding_completed_at = coalesce(public.profiles.onboarding_completed_at, now()),
        role = case when lower(coalesce(excluded.email, '')) = 'emptypocket711@gmail.com' then 'developer'::public.user_role else public.profiles.role end;

  return v_company_id;
end;
$$;

create or replace function public.request_company_join(
  p_company_id uuid,
  p_full_name text default null,
  p_business_types text[] default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user auth.users%rowtype;
  v_request_id uuid;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select *
    into v_user
  from auth.users
  where id = auth.uid();

  if not exists (select 1 from public.companies where id = p_company_id) then
    raise exception '선택한 회사를 찾을 수 없습니다.';
  end if;

  update public.profiles
    set email = coalesce(email, v_user.email),
        full_name = coalesce(nullif(p_full_name, ''), full_name)
  where id = auth.uid();

  insert into public.company_join_requests (
    company_id,
    user_id,
    email,
    full_name,
    requested_business_types,
    status
  )
  values (
    p_company_id,
    auth.uid(),
    v_user.email,
    coalesce(nullif(p_full_name, ''), split_part(coalesce(v_user.email, '사용자'), '@', 1)),
    coalesce(p_business_types, '{}'::text[]),
    'pending'
  )
  on conflict (company_id, user_id, status) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        requested_business_types = excluded.requested_business_types,
        created_at = now()
  returning id into v_request_id;

  return v_request_id;
end;
$$;

grant execute on function public.ensure_client_profile(text, text, text[]) to authenticated;
grant execute on function public.request_company_join(uuid, text, text[]) to authenticated;
