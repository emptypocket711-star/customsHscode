alter table public.operations_issue_events
  add column if not exists assigned_to_label text,
  add column if not exists operator_note text,
  add column if not exists resolution_reason text,
  add column if not exists status_updated_by uuid references auth.users(id),
  add column if not exists status_updated_at timestamptz;

create index if not exists operations_issue_events_assigned_to_label_idx
  on public.operations_issue_events(assigned_to_label)
  where assigned_to_label is not null;
