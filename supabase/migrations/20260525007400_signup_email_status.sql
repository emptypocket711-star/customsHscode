create or replace function public.get_signup_email_status(p_email text)
returns table(user_exists boolean, onboarding_completed boolean)
language sql
security definer
set search_path = public, auth
as $$
  select
    exists(
      select 1
      from auth.users u
      where lower(u.email) = lower(trim(p_email))
    ) as user_exists,
    exists(
      select 1
      from auth.users u
      join public.profiles p on p.id = u.id
      where lower(u.email) = lower(trim(p_email))
        and p.onboarding_completed_at is not null
    ) as onboarding_completed;
$$;

revoke all on function public.get_signup_email_status(text) from public;
grant execute on function public.get_signup_email_status(text) to service_role;
