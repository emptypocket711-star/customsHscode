alter table public.app_notices
  add column if not exists popup_enabled boolean not null default false;

create index if not exists app_notices_popup_idx
  on public.app_notices (is_published, popup_enabled, pinned desc, published_at desc)
  where is_published = true and popup_enabled = true;
