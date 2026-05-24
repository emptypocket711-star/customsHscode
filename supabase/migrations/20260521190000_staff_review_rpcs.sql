create or replace function public.assert_current_user_staff()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  actor_role public.user_role;
begin
  if actor is null then
    raise exception '로그인한 담당자만 검토 처리를 할 수 있습니다.';
  end if;

  select role into actor_role
  from public.profiles
  where id = actor;

  if actor_role not in ('admin', 'customs_staff') then
    raise exception '담당자 또는 관리자만 검토 처리를 할 수 있습니다.';
  end if;

  return actor;
end;
$$;

create or replace function public.review_hs_candidate(
  p_candidate_id uuid,
  p_decision text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid;
  before_row jsonb;
  after_row jsonb;
  next_status text;
begin
  actor := public.assert_current_user_staff();

  if p_decision not in ('approve', 'reject') then
    raise exception '지원하지 않는 검토 결정입니다.';
  end if;

  next_status := case when p_decision = 'approve' then 'staff_confirmed' else 'rejected' end;

  select to_jsonb(c.*) into before_row
  from public.hs_candidates c
  where c.id = p_candidate_id
  for update;

  if before_row is null then
    raise exception 'HS 후보를 찾을 수 없습니다.';
  end if;

  update public.hs_candidates
  set
    status = next_status,
    reviewed_by = actor,
    reviewed_at = now()
  where id = p_candidate_id;

  select to_jsonb(c.*) into after_row
  from public.hs_candidates c
  where c.id = p_candidate_id;

  update public.staff_review_assignments
  set
    status = case when p_decision = 'approve' then 'approved'::public.review_status else 'rejected'::public.review_status end,
    reviewer_note = p_note,
    updated_at = now()
  where target_table = 'hs_candidates'
    and target_id = p_candidate_id;

  insert into public.audit_logs (
    actor_id,
    action,
    target_table,
    target_id,
    before_json,
    after_json
  ) values (
    actor,
    'staff_review_' || p_decision,
    'hs_candidates',
    p_candidate_id,
    before_row,
    after_row
  );
end;
$$;

create or replace function public.review_report(
  p_report_id uuid,
  p_decision text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid;
  before_row public.ai_reports%rowtype;
  before_json jsonb;
  after_json jsonb;
  next_status public.review_status;
begin
  actor := public.assert_current_user_staff();

  if p_decision not in ('approve', 'reject') then
    raise exception '지원하지 않는 검토 결정입니다.';
  end if;

  next_status := case when p_decision = 'approve' then 'approved'::public.review_status else 'rejected'::public.review_status end;

  select * into before_row
  from public.ai_reports
  where id = p_report_id
  for update;

  if before_row.id is null then
    raise exception '리포트를 찾을 수 없습니다.';
  end if;

  before_json := to_jsonb(before_row);

  update public.ai_reports
  set
    status = next_status,
    reviewed_by = actor,
    reviewed_at = now(),
    staff_notes = coalesce(p_note, staff_notes)
  where id = p_report_id;

  select to_jsonb(r.*) into after_json
  from public.ai_reports r
  where r.id = p_report_id;

  insert into public.report_approval_events (
    report_id,
    company_id,
    actor_id,
    from_status,
    to_status,
    staff_notes
  ) values (
    p_report_id,
    before_row.company_id,
    actor,
    before_row.status,
    next_status,
    p_note
  );

  update public.staff_review_assignments
  set
    status = next_status,
    reviewer_note = p_note,
    updated_at = now()
  where target_table = 'ai_reports'
    and target_id = p_report_id;

  insert into public.audit_logs (
    actor_id,
    company_id,
    action,
    target_table,
    target_id,
    before_json,
    after_json
  ) values (
    actor,
    before_row.company_id,
    'staff_review_' || p_decision,
    'ai_reports',
    p_report_id,
    before_json,
    after_json
  );
end;
$$;

create or replace function public.review_legal_change(
  p_change_id uuid,
  p_decision text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid;
  before_row jsonb;
  after_row jsonb;
  next_status text;
begin
  actor := public.assert_current_user_staff();

  if p_decision not in ('approve', 'reject') then
    raise exception '지원하지 않는 검토 결정입니다.';
  end if;

  next_status := case when p_decision = 'approve' then 'approved' else 'rejected' end;

  select to_jsonb(c.*) into before_row
  from public.legal_change_events c
  where c.id = p_change_id
  for update;

  if before_row is null then
    raise exception '법령 변경 이벤트를 찾을 수 없습니다.';
  end if;

  update public.legal_change_events
  set review_status = next_status
  where id = p_change_id;

  select to_jsonb(c.*) into after_row
  from public.legal_change_events c
  where c.id = p_change_id;

  update public.staff_review_assignments
  set
    status = case when p_decision = 'approve' then 'approved'::public.review_status else 'rejected'::public.review_status end,
    reviewer_note = p_note,
    updated_at = now()
  where target_table = 'legal_change_events'
    and target_id = p_change_id;

  insert into public.audit_logs (
    actor_id,
    action,
    target_table,
    target_id,
    before_json,
    after_json
  ) values (
    actor,
    'staff_review_' || p_decision,
    'legal_change_events',
    p_change_id,
    before_row,
    after_row
  );
end;
$$;
