create or replace function public.review_completion_report(
  p_report_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_confirmations jsonb;
  v_document_count integer;
  v_report public.service_request_completion_reports%rowtype;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if not public.is_staff_or_admin() then
    raise exception '완료 리포트 운영 검토 권한이 없습니다.';
  end if;

  select *
    into v_report
  from public.service_request_completion_reports
  where id = p_report_id
    and status <> 'voided'
  for update;

  if v_report.id is null then
    raise exception '완료 리포트를 찾을 수 없습니다.';
  end if;

  if v_report.status = 'locked' then
    raise exception '잠긴 완료 리포트는 다시 검토 상태로 변경할 수 없습니다.';
  end if;

  v_confirmations := coalesce(v_report.source_snapshot->'confirmations', '{}'::jsonb);
  if not (v_confirmations ? 'requester' and v_confirmations ? 'partner') then
    raise exception '운영 검토 전 화주와 파트너 확인을 모두 완료해 주세요.';
  end if;

  select count(*)::integer
    into v_document_count
  from public.service_request_completion_report_documents document
  where document.completion_report_id = p_report_id;

  if coalesce(v_document_count, 0) = 0 then
    raise exception '운영 검토 전 최종 보관 서류 연결을 확인해 주세요.';
  end if;

  update public.service_request_completion_reports
    set status = 'operator_reviewed',
        updated_at = now()
  where id = p_report_id;

  insert into public.audit_logs (
    actor_id,
    company_id,
    action,
    target_table,
    target_id,
    after_json
  )
  values (
    auth.uid(),
    public.current_company_id(),
    'service_request_completion_report_reviewed',
    'service_request_completion_reports',
    p_report_id,
    jsonb_build_object(
      'request_id', v_report.request_id,
      'request_type', v_report.request_type,
      'previous_status', v_report.status,
      'next_status', 'operator_reviewed',
      'linked_document_count', v_document_count,
      'requester_acknowledged', v_confirmations ? 'requester',
      'partner_acknowledged', v_confirmations ? 'partner'
    )
  );

  return p_report_id;
end;
$$;

revoke all on function public.review_completion_report(uuid) from public;
grant execute on function public.review_completion_report(uuid) to authenticated;
