alter table public.profiles
  add column if not exists company_role text not null default 'member';

alter table public.profiles
  drop constraint if exists profiles_company_role_check;

alter table public.profiles
  add constraint profiles_company_role_check check (company_role in ('admin', 'member'));

with first_profile as (
  select distinct on (company_id)
    id
  from public.profiles
  where company_id is not null
    and onboarding_completed_at is not null
  order by company_id, created_at asc
)
update public.profiles
set company_role = 'admin'
where id in (select id from first_profile);

update public.profiles
set company_role = 'admin'
where role = 'developer'::public.user_role;

create or replace function public.current_company_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select company_role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_company_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_company_role() = 'admin', false)
$$;

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
  v_company_role text;
begin
  v_company_name := coalesce(nullif(new.raw_user_meta_data->>'company_name', ''), split_part(coalesce(new.email, 'client'), '@', 1) || ' 회사');
  v_full_name := coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(coalesce(new.email, '사용자'), '@', 1));
  v_role := case when lower(coalesce(new.email, '')) = 'emptypocket711@gmail.com' then 'developer'::public.user_role else 'client'::public.user_role end;
  v_onboarding_completed_at := case when v_role = 'developer' then now() else null end;
  v_company_role := case when v_role = 'developer' then 'admin' else 'member' end;

  insert into public.companies (name, type)
  values (v_company_name, case when v_role = 'developer' then 'internal' else 'client' end)
  returning id into v_company_id;

  insert into public.profiles (id, email, full_name, role, company_id, company_role, onboarding_completed_at)
  values (new.id, new.email, v_full_name, v_role, v_company_id, v_company_role, v_onboarding_completed_at)
  on conflict (id) do update
    set email = excluded.email,
        company_role = case when lower(coalesce(excluded.email, '')) = 'emptypocket711@gmail.com' then 'admin' else public.profiles.company_role end,
        role = case when lower(coalesce(excluded.email, '')) = 'emptypocket711@gmail.com' then 'developer'::public.user_role else public.profiles.role end;

  return new;
end;
$$;

drop policy if exists "users read own join requests or staff reads all" on public.company_join_requests;
create policy "users read own join requests or company admins read company requests" on public.company_join_requests
  for select using (
    user_id = auth.uid()
    or public.is_staff_or_admin()
    or (
      public.is_company_admin()
      and company_id = public.current_company_id()
    )
  );

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
          company_role = 'admin',
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

  insert into public.profiles (id, email, full_name, role, company_id, company_role, onboarding_completed_at)
  values (
    auth.uid(),
    v_user.email,
    coalesce(nullif(p_full_name, ''), split_part(coalesce(v_user.email, '사용자'), '@', 1)),
    v_role,
    v_company_id,
    'admin',
    now()
  )
  on conflict (id) do update
    set company_id = coalesce(public.profiles.company_id, excluded.company_id),
        company_role = 'admin',
        email = coalesce(public.profiles.email, excluded.email),
        full_name = coalesce(nullif(p_full_name, ''), public.profiles.full_name, excluded.full_name),
        onboarding_completed_at = coalesce(public.profiles.onboarding_completed_at, now()),
        role = case when lower(coalesce(excluded.email, '')) = 'emptypocket711@gmail.com' then 'developer'::public.user_role else public.profiles.role end;

  return v_company_id;
end;
$$;

create or replace function public.review_company_join_request(
  p_request_id uuid,
  p_decision text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_company_id uuid;
  v_actor_company_role text;
  v_actor_role public.user_role;
  v_request public.company_join_requests%rowtype;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception '처리 상태가 올바르지 않습니다.';
  end if;

  select company_id, company_role, role
    into v_actor_company_id, v_actor_company_role, v_actor_role
  from public.profiles
  where id = auth.uid();

  select *
    into v_request
  from public.company_join_requests
  where id = p_request_id
    and status = 'pending'
  for update;

  if v_request.id is null then
    raise exception '대기 중인 합류 요청을 찾을 수 없습니다.';
  end if;

  if not (
    v_actor_role in ('developer', 'admin', 'customs_staff')
    or (v_actor_company_role = 'admin' and v_actor_company_id = v_request.company_id)
  ) then
    raise exception '회사 합류 요청을 처리할 권한이 없습니다.';
  end if;

  update public.company_join_requests
    set status = p_decision,
        reviewed_by = auth.uid(),
        reviewed_at = now()
  where id = p_request_id;

  if p_decision = 'approved' then
    update public.profiles
      set company_id = v_request.company_id,
          company_role = 'member',
          email = coalesce(email, v_request.email),
          full_name = coalesce(nullif(v_request.full_name, ''), full_name),
          onboarding_completed_at = now()
    where id = v_request.user_id;

    update public.companies
      set business_types = (
        select array(
          select distinct unnest(public.companies.business_types || coalesce(v_request.requested_business_types, '{}'::text[]))
          order by 1
        )
      )
    where id = v_request.company_id;
  end if;

  return p_request_id;
end;
$$;

grant execute on function public.review_company_join_request(uuid, text) to authenticated;
