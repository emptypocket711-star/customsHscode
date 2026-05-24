create or replace function public.is_staff_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('developer', 'admin', 'customs_staff'), false)
$$;

create or replace function public.assert_current_user_staff()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  actor_role public.user_role;
  actor_email text;
begin
  if actor is null then
    raise exception '로그인한 개발자 계정만 운영 처리를 할 수 있습니다.';
  end if;

  select role, email
    into actor_role, actor_email
  from public.profiles
  where id = actor;

  if lower(coalesce(actor_email, '')) <> 'emptypocket711@gmail.com' then
    raise exception '지정된 개발자 계정만 운영 처리를 할 수 있습니다.';
  end if;

  if actor_role not in ('developer', 'admin', 'customs_staff') then
    raise exception '개발자 권한 프로필이 필요합니다.';
  end if;

  return actor;
end;
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
begin
  v_company_name := coalesce(nullif(new.raw_user_meta_data->>'company_name', ''), split_part(coalesce(new.email, 'client'), '@', 1) || ' 회사');
  v_full_name := coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(coalesce(new.email, '사용자'), '@', 1));
  v_role := case when lower(coalesce(new.email, '')) = 'emptypocket711@gmail.com' then 'developer'::public.user_role else 'client'::public.user_role end;

  insert into public.companies (name, type)
  values (v_company_name, case when v_role = 'developer' then 'internal' else 'client' end)
  returning id into v_company_id;

  insert into public.profiles (id, email, full_name, role, company_id)
  values (new.id, new.email, v_full_name, v_role, v_company_id)
  on conflict (id) do update
    set email = excluded.email,
        role = case when lower(coalesce(excluded.email, '')) = 'emptypocket711@gmail.com' then 'developer'::public.user_role else public.profiles.role end;

  return new;
end;
$$;

create or replace function public.ensure_client_profile(
  p_company_name text default null,
  p_full_name text default null
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
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select *
    into v_user
  from auth.users
  where id = auth.uid();

  v_role := case when lower(coalesce(v_user.email, '')) = 'emptypocket711@gmail.com' then 'developer'::public.user_role else 'client'::public.user_role end;

  select company_id
    into v_existing_company_id
  from public.profiles
  where id = auth.uid();

  if v_existing_company_id is not null then
    update public.profiles
      set role = case when lower(coalesce(v_user.email, '')) = 'emptypocket711@gmail.com' then 'developer'::public.user_role else role end,
          email = coalesce(email, v_user.email)
    where id = auth.uid();

    return v_existing_company_id;
  end if;

  insert into public.companies (name, type)
  values (
    coalesce(nullif(p_company_name, ''), split_part(coalesce(v_user.email, 'client'), '@', 1) || ' 회사'),
    case when v_role = 'developer' then 'internal' else 'client' end
  )
  returning id into v_company_id;

  insert into public.profiles (id, email, full_name, role, company_id)
  values (
    auth.uid(),
    v_user.email,
    coalesce(nullif(p_full_name, ''), split_part(coalesce(v_user.email, '사용자'), '@', 1)),
    v_role,
    v_company_id
  )
  on conflict (id) do update
    set company_id = coalesce(public.profiles.company_id, excluded.company_id),
        email = coalesce(public.profiles.email, excluded.email),
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        role = case when lower(coalesce(excluded.email, '')) = 'emptypocket711@gmail.com' then 'developer'::public.user_role else public.profiles.role end;

  return v_company_id;
end;
$$;

update public.profiles
set role = 'developer'::public.user_role
where lower(coalesce(email, '')) = 'emptypocket711@gmail.com';
