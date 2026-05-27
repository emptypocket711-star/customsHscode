alter table public.cargo_watch_requests
  add column if not exists management_inspection_notified_at timestamptz,
  add column if not exists management_inspection_value text;
