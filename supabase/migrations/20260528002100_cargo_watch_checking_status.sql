alter table public.cargo_watch_requests
  drop constraint if exists cargo_watch_requests_status_check;

alter table public.cargo_watch_requests
  add constraint cargo_watch_requests_status_check
  check (status in ('active', 'checking', 'matched', 'paused', 'error', 'cancelled'));

create index if not exists cargo_watch_requests_checking_updated_idx
  on public.cargo_watch_requests(status, updated_at)
  where status = 'checking';
