alter table public.cargo_watch_requests
  alter column poll_interval_seconds set default 300;

update public.cargo_watch_requests
set poll_interval_seconds = 300,
    updated_at = now()
where status = 'active'
  and poll_interval_seconds < 300;
