create table if not exists public.cargo_management_inspection_notifications (
  id uuid primary key default gen_random_uuid(),
  notification_key text not null unique,
  notify_email text not null,
  lookup_value text not null,
  management_inspection_value text not null,
  source_watch_id uuid references public.cargo_watch_requests(id) on delete set null,
  notified_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists cargo_management_inspection_notifications_email_idx
  on public.cargo_management_inspection_notifications(notify_email, created_at desc);

alter table public.cargo_management_inspection_notifications enable row level security;
