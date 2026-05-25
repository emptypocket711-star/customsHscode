create table if not exists public.account_access_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  company_id uuid references public.companies(id) on delete set null,
  event_type text not null,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  constraint account_access_events_type_check check (
    event_type in (
      'login_success',
      'login_failure',
      'signup_otp_requested',
      'signup_email_verified',
      'signup_completed',
      'password_reset_requested',
      'sign_out'
    )
  )
);

create index if not exists account_access_events_user_created_idx
  on public.account_access_events(user_id, created_at desc);

create index if not exists account_access_events_email_created_idx
  on public.account_access_events(lower(email), created_at desc);

create index if not exists account_access_events_company_created_idx
  on public.account_access_events(company_id, created_at desc);

alter table public.account_access_events enable row level security;

drop policy if exists "developer reads account access events" on public.account_access_events;
create policy "developer reads account access events"
  on public.account_access_events
  for select
  using (public.current_user_role() = 'developer'::public.user_role);

drop policy if exists "service role writes account access events" on public.account_access_events;
create policy "service role writes account access events"
  on public.account_access_events
  for insert
  with check (true);

grant select on public.account_access_events to authenticated;
