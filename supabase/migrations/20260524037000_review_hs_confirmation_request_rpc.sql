create or replace function public.review_hs_confirmation_request(
  p_request_id uuid,
  p_decision text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid;
  v_before public.hs_confirmation_requests%rowtype;
  v_after jsonb;
  v_next_status public.review_status;
begin
  v_actor := public.assert_current_user_staff();

  if p_decision not in ('approve', 'reject') then
    raise exception '지원하지 않는 검토 결정입니다.';
  end if;

  v_next_status := case when p_decision = 'approve' then 'approved'::public.review_status else 'rejected'::public.review_status end;

  select *
    into v_before
  from public.hs_confirmation_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'HS 확정 요청을 찾을 수 없습니다.';
  end if;

  update public.hs_confirmation_requests
    set status = v_next_status,
        updated_at = now()
  where id = p_request_id;

  select to_jsonb(req.*)
    into v_after
  from public.hs_confirmation_requests req
  where req.id = p_request_id;

  update public.staff_review_assignments
    set status = v_next_status,
        reviewer_note = p_note,
        updated_at = now()
  where target_table = 'hs_confirmation_requests'
    and target_id = p_request_id;

  insert into public.audit_logs (
    actor_id,
    company_id,
    action,
    target_table,
    target_id,
    before_json,
    after_json
  )
  values (
    v_actor,
    v_before.company_id,
    'review_hs_confirmation_request_' || p_decision,
    'hs_confirmation_requests',
    p_request_id,
    to_jsonb(v_before),
    v_after
  );
end;
$$;

grant execute on function public.review_hs_confirmation_request(uuid, text, text) to authenticated;
