alter table public.profiles
  add column if not exists account_type text not null default 'company',
  add column if not exists allowed_ip_count integer not null default 5;

alter table public.profiles
  drop constraint if exists profiles_account_type_check;

alter table public.profiles
  add constraint profiles_account_type_check check (account_type in ('personal', 'company'));

alter table public.profiles
  drop constraint if exists profiles_allowed_ip_count_check;

alter table public.profiles
  add constraint profiles_allowed_ip_count_check check (allowed_ip_count > 0 and allowed_ip_count <= 100);

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
  v_company_name := coalesce(nullif(new.raw_user_meta_data->>'company_name', ''), split_part(coalesce(new.email, 'client'), '@', 1) || ' 업무공간');
  v_full_name := coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(coalesce(new.email, '사용자'), '@', 1));
  v_role := case when lower(coalesce(new.email, '')) = 'emptypocket711@gmail.com' then 'developer'::public.user_role else 'client'::public.user_role end;
  v_onboarding_completed_at := case when v_role = 'developer' then now() else null end;
  v_company_role := case when v_role = 'developer' then 'admin' else 'member' end;

  insert into public.companies (name, type)
  values (v_company_name, case when v_role = 'developer' then 'internal' else 'pending' end)
  returning id into v_company_id;

  insert into public.profiles (id, email, full_name, role, company_id, company_role, account_type, allowed_ip_count, onboarding_completed_at)
  values (new.id, new.email, v_full_name, v_role, v_company_id, v_company_role, 'company', 5, v_onboarding_completed_at)
  on conflict (id) do update
    set email = excluded.email,
        company_role = case when lower(coalesce(excluded.email, '')) = 'emptypocket711@gmail.com' then 'admin' else public.profiles.company_role end,
        role = case when lower(coalesce(excluded.email, '')) = 'emptypocket711@gmail.com' then 'developer'::public.user_role else public.profiles.role end;

  return new;
end;
$$;

create or replace function public.ensure_client_profile(
  p_account_type text default 'company',
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
  v_account_type text;
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
  v_account_type := case when p_account_type = 'personal' then 'personal' else 'company' end;
  v_company_name := case
    when v_account_type = 'personal' then coalesce(nullif(trim(p_full_name), ''), split_part(coalesce(v_user.email, '개인회원'), '@', 1)) || ' 개인회원'
    else coalesce(nullif(trim(p_company_name), ''), split_part(coalesce(v_user.email, 'client'), '@', 1) || ' 회사')
  end;
  v_business_types := case when v_account_type = 'personal' then '{}'::text[] else coalesce(p_business_types, '{}'::text[]) end;

  select company_id
    into v_existing_company_id
  from public.profiles
  where id = auth.uid();

  if v_existing_company_id is not null then
    update public.companies
      set name = v_company_name,
          type = case when v_role = 'developer' then 'internal' else v_account_type end,
          business_types = (
            select array(
              select distinct unnest(v_business_types)
              order by 1
            )
          )
    where id = v_existing_company_id;

    update public.profiles
      set role = case when lower(coalesce(v_user.email, '')) = 'emptypocket711@gmail.com' then 'developer'::public.user_role else role end,
          company_role = case when v_account_type = 'company' or v_role = 'developer' then 'admin' else 'member' end,
          account_type = v_account_type,
          allowed_ip_count = case when v_account_type = 'company' then greatest(allowed_ip_count, 5) else 1 end,
          email = coalesce(email, v_user.email),
          full_name = coalesce(nullif(p_full_name, ''), full_name),
          onboarding_completed_at = coalesce(onboarding_completed_at, now())
    where id = auth.uid();

    return v_existing_company_id;
  end if;

  insert into public.companies (name, type, business_types)
  values (
    v_company_name,
    case when v_role = 'developer' then 'internal' else v_account_type end,
    v_business_types
  )
  returning id into v_company_id;

  insert into public.profiles (id, email, full_name, role, company_id, company_role, account_type, allowed_ip_count, onboarding_completed_at)
  values (
    auth.uid(),
    v_user.email,
    coalesce(nullif(p_full_name, ''), split_part(coalesce(v_user.email, '사용자'), '@', 1)),
    v_role,
    v_company_id,
    case when v_account_type = 'company' or v_role = 'developer' then 'admin' else 'member' end,
    v_account_type,
    case when v_account_type = 'company' then 5 else 1 end,
    now()
  )
  on conflict (id) do update
    set company_id = coalesce(public.profiles.company_id, excluded.company_id),
        company_role = excluded.company_role,
        account_type = excluded.account_type,
        allowed_ip_count = excluded.allowed_ip_count,
        email = coalesce(public.profiles.email, excluded.email),
        full_name = coalesce(nullif(p_full_name, ''), public.profiles.full_name, excluded.full_name),
        onboarding_completed_at = coalesce(public.profiles.onboarding_completed_at, now()),
        role = case when lower(coalesce(excluded.email, '')) = 'emptypocket711@gmail.com' then 'developer'::public.user_role else public.profiles.role end;

  return v_company_id;
end;
$$;

grant execute on function public.ensure_client_profile(text, text, text, text[]) to authenticated;
