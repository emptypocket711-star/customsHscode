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
begin
  v_company_name := coalesce(nullif(new.raw_user_meta_data->>'company_name', ''), split_part(coalesce(new.email, 'client'), '@', 1) || ' 회사');
  v_full_name := coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(coalesce(new.email, '사용자'), '@', 1));

  insert into public.companies (name, type)
  values (v_company_name, 'client')
  returning id into v_company_id;

  insert into public.profiles (id, email, full_name, role, company_id)
  values (new.id, new.email, v_full_name, 'client', v_company_id)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;

create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

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
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select *
    into v_user
  from auth.users
  where id = auth.uid();

  select company_id
    into v_existing_company_id
  from public.profiles
  where id = auth.uid();

  if v_existing_company_id is not null then
    return v_existing_company_id;
  end if;

  insert into public.companies (name, type)
  values (
    coalesce(nullif(p_company_name, ''), split_part(coalesce(v_user.email, 'client'), '@', 1) || ' 회사'),
    'client'
  )
  returning id into v_company_id;

  insert into public.profiles (id, email, full_name, role, company_id)
  values (
    auth.uid(),
    v_user.email,
    coalesce(nullif(p_full_name, ''), split_part(coalesce(v_user.email, '사용자'), '@', 1)),
    'client',
    v_company_id
  )
  on conflict (id) do update
    set company_id = coalesce(public.profiles.company_id, excluded.company_id),
        email = coalesce(public.profiles.email, excluded.email),
        full_name = coalesce(public.profiles.full_name, excluded.full_name);

  return v_company_id;
end;
$$;

grant execute on function public.ensure_client_profile(text, text) to authenticated;
