create or replace function public.ensure_client_profile(
  p_account_type text default 'company',
  p_company_name text default null,
  p_full_name text default null,
  p_business_types text[] default null,
  p_business_no text default null
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
  v_business_no text;
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
  v_business_no := case when v_account_type = 'company' then nullif(regexp_replace(coalesce(p_business_no, ''), '\D', '', 'g'), '') else null end;

  if v_account_type = 'company'
    and exists (
      select 1
      from unnest(v_business_types) as business_type(value)
      where business_type.value <> 'foreign_shipper'
    )
    and (v_business_no is null or length(v_business_no) <> 10) then
    raise exception '국내 사업자 유형은 사업자등록번호 10자리를 입력해 주세요.';
  end if;

  select company_id
    into v_existing_company_id
  from public.profiles
  where id = auth.uid();

  if v_existing_company_id is not null then
    update public.companies
      set name = v_company_name,
          type = case when v_role = 'developer' then 'internal' else v_account_type end,
          business_no = v_business_no,
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

  insert into public.companies (name, type, business_no, business_types)
  values (
    v_company_name,
    case when v_role = 'developer' then 'internal' else v_account_type end,
    v_business_no,
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

grant execute on function public.ensure_client_profile(text, text, text, text[], text) to authenticated;
drop function if exists public.ensure_client_profile(text, text, text, text[]);
