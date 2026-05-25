create table if not exists public.active_user_sessions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  session_id uuid not null,
  email text,
  account_type text not null default 'company',
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint active_user_sessions_account_type_check check (account_type in ('personal', 'company'))
);

create index if not exists active_user_sessions_updated_idx
  on public.active_user_sessions(updated_at desc);

alter table public.active_user_sessions enable row level security;

drop policy if exists "developer reads active user sessions" on public.active_user_sessions;
create policy "developer reads active user sessions"
  on public.active_user_sessions
  for select
  to authenticated
  using (public.current_user_role() = 'developer'::public.user_role);

drop policy if exists "service role manages active user sessions" on public.active_user_sessions;
create policy "service role manages active user sessions"
  on public.active_user_sessions
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

grant select on public.active_user_sessions to authenticated;
