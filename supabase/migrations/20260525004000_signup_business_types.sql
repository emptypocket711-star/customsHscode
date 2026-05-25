create extension if not exists "pg_trgm";

alter table public.companies
  add column if not exists business_types text[] not null default '{}';

create index if not exists companies_name_trgm_idx
  on public.companies using gin (name gin_trgm_ops);

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
          full_name = coalesce(nullif(p_full_name, ''), full_name)
    where id = auth.uid();

    return v_existing_company_id;
  end if;

  select id
    into v_company_id
  from public.companies
  where lower(trim(name)) = lower(trim(v_company_name))
  order by created_at asc
  limit 1;

  if v_company_id is null then
    insert into public.companies (name, type, business_types)
    values (
      v_company_name,
      case when v_role = 'developer' then 'internal' else 'client' end,
      v_business_types
    )
    returning id into v_company_id;
  else
    update public.companies
      set business_types = (
        select array(
          select distinct unnest(public.companies.business_types || v_business_types)
          order by 1
        )
      )
    where id = v_company_id;
  end if;

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
        full_name = coalesce(nullif(p_full_name, ''), public.profiles.full_name, excluded.full_name),
        role = case when lower(coalesce(excluded.email, '')) = 'emptypocket711@gmail.com' then 'developer'::public.user_role else public.profiles.role end;

  return v_company_id;
end;
$$;

grant execute on function public.ensure_client_profile(text, text, text[]) to authenticated;
