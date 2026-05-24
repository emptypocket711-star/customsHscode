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

  if actor_role <> 'developer'::public.user_role then
    raise exception '운영 처리는 지정된 개발자 권한 프로필만 수행할 수 있습니다.';
  end if;

  return actor;
end;
$$;

revoke all on function public.assert_current_user_staff() from public;
grant execute on function public.assert_current_user_staff() to authenticated;
