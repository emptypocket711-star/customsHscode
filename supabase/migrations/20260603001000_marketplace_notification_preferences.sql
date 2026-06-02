create table if not exists public.marketplace_notification_preferences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null check (channel in ('email')),
  notification_kind text not null check (notification_kind in ('initial', 'deadline_reminder')),
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id, channel, notification_kind)
);

create index if not exists marketplace_notification_preferences_profile_idx
  on public.marketplace_notification_preferences(profile_id, channel, notification_kind);

create index if not exists marketplace_notification_preferences_enabled_email_idx
  on public.marketplace_notification_preferences(notification_kind, profile_id)
  where channel = 'email' and enabled = true;

alter table public.marketplace_notification_preferences enable row level security;

grant select, insert, update, delete on public.marketplace_notification_preferences to authenticated;
grant select, insert, update, delete on public.marketplace_notification_preferences to service_role;

drop policy if exists "users read own marketplace notification preferences or staff re"
  on public.marketplace_notification_preferences;
drop policy if exists "users read own marketplace notification prefs or staff reads"
  on public.marketplace_notification_preferences;
drop policy if exists "users insert own marketplace notification preferences"
  on public.marketplace_notification_preferences;
drop policy if exists "users update own marketplace notification preferences"
  on public.marketplace_notification_preferences;
drop policy if exists "users delete own marketplace notification preferences"
  on public.marketplace_notification_preferences;
drop policy if exists "service role manages marketplace notification preferences"
  on public.marketplace_notification_preferences;

create policy "users read own marketplace notification prefs or staff reads"
  on public.marketplace_notification_preferences
  for select using (
    profile_id = auth.uid()
    or public.is_staff_or_admin()
  );

create policy "users insert own marketplace notification preferences"
  on public.marketplace_notification_preferences
  for insert with check (
    profile_id = auth.uid()
  );

create policy "users update own marketplace notification preferences"
  on public.marketplace_notification_preferences
  for update using (
    profile_id = auth.uid()
  )
  with check (
    profile_id = auth.uid()
  );

create policy "users delete own marketplace notification preferences"
  on public.marketplace_notification_preferences
  for delete using (
    profile_id = auth.uid()
  );

create policy "service role manages marketplace notification preferences"
  on public.marketplace_notification_preferences
  for all using (
    auth.role() = 'service_role'
  )
  with check (
    auth.role() = 'service_role'
  );
