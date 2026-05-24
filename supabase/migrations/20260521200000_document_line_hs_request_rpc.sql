create or replace function public.create_hs_request_from_document_line_item(
  p_line_item_id uuid,
  p_direction public.request_direction,
  p_basis_date date,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_line public.extracted_document_line_items%rowtype;
  v_request_id uuid;
begin
  perform public.assert_current_user_staff();

  select *
    into v_line
  from public.extracted_document_line_items
  where id = p_line_item_id
  for update;

  if not found then
    raise exception '문서 추출 라인아이템을 찾을 수 없습니다.';
  end if;

  insert into public.hs_search_requests (
    company_id,
    created_by,
    direction,
    search_type,
    input_product_name,
    model_name,
    origin_country,
    export_country,
    shipment_country,
    destination_country,
    basis_date,
    status
  )
  values (
    v_line.company_id,
    v_actor,
    p_direction,
    'document',
    v_line.product_name,
    v_line.model_name,
    v_line.origin_country,
    v_line.export_country,
    v_line.shipment_country,
    v_line.destination_country,
    p_basis_date,
    'pending_review'
  )
  returning id into v_request_id;

  update public.extracted_document_line_items
    set status = 'approved',
        updated_at = now()
  where id = p_line_item_id;

  insert into public.audit_logs (
    actor_id,
    company_id,
    action,
    target_table,
    target_id,
    after_json
  )
  values (
    v_actor,
    v_line.company_id,
    'create_hs_request_from_document_line_item',
    'hs_search_requests',
    v_request_id,
    jsonb_build_object(
      'line_item_id', p_line_item_id,
      'document_id', v_line.document_id,
      'direction', p_direction,
      'basis_date', p_basis_date,
      'note', p_note
    )
  );

  return v_request_id;
end;
$$;
