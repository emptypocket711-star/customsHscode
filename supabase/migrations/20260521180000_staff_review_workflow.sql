create table if not exists public.staff_review_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id),
  target_table text not null check (target_table in ('hs_candidates', 'ai_reports', 'legal_change_events', 'case_documents', 'extracted_document_line_items')),
  target_id uuid not null,
  assigned_to uuid references auth.users(id),
  status public.review_status not null default 'pending_review',
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'critical')),
  reviewer_note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists staff_review_assignments_target_idx on public.staff_review_assignments(target_table, target_id);
create index if not exists staff_review_assignments_assigned_to_idx on public.staff_review_assignments(assigned_to);

alter table public.staff_review_assignments enable row level security;

create policy "staff reads review assignments" on public.staff_review_assignments
  for select using (public.is_staff_or_admin());

create policy "staff manages review assignments" on public.staff_review_assignments
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "company reads own review assignment status" on public.staff_review_assignments
  for select using (company_id = public.current_company_id());
