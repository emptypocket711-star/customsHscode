create table if not exists public.cargo_watch_status_notifications (
  id uuid primary key default gen_random_uuid(),
  notification_key text not null unique,
  notify_email text not null,
  lookup_value text not null,
  target_status text not null,
  source_watch_id uuid references public.cargo_watch_requests(id) on delete set null,
  send_status text not null default 'sending' check (send_status in ('sending', 'sent')),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cargo_watch_status_notifications_email_idx
  on public.cargo_watch_status_notifications(notify_email, created_at desc);

create index if not exists cargo_watch_status_notifications_status_idx
  on public.cargo_watch_status_notifications(send_status, created_at desc);

alter table public.cargo_watch_status_notifications enable row level security;
