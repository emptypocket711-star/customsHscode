drop policy if exists "company updates own document processing status" on public.case_documents;
drop policy if exists "company inserts own extracted line items" on public.extracted_document_line_items;
drop policy if exists "company deletes own extracted line items" on public.extracted_document_line_items;
drop policy if exists "company updates own extracted line items" on public.extracted_document_line_items;

create or replace function public.persist_document_extraction(
  p_document_id uuid,
  p_request_id uuid,
  p_status public.document_processing_status,
  p_line_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_document public.case_documents%rowtype;
  v_line_count integer := 0;
begin
  if v_actor is null then
    raise exception '로그인 후 문서 추출 결과를 저장할 수 있습니다.';
  end if;

  if p_status not in ('extracted', 'needs_correction') then
    raise exception '문서 추출 저장 상태를 확인해 주세요.';
  end if;

  select *
    into v_document
  from public.case_documents
  where id = p_document_id
    and request_id = p_request_id
  for update;

  if not found then
    raise exception '문서 접근 권한 또는 회사 정보를 확인할 수 없습니다.';
  end if;

  if not (v_document.company_id = public.current_company_id() or public.is_staff_or_admin()) then
    raise exception '문서 접근 권한 또는 회사 정보를 확인할 수 없습니다.';
  end if;

  delete from public.extracted_document_line_items
  where document_id = p_document_id
    and request_id = p_request_id
    and company_id = v_document.company_id;

  if jsonb_array_length(coalesce(p_line_items, '[]'::jsonb)) > 0 then
    insert into public.extracted_document_line_items (
      document_id,
      request_id,
      company_id,
      line_no,
      product_name,
      model_name,
      origin_country,
      export_country,
      shipment_country,
      destination_country,
      incoterms,
      quantity,
      unit,
      unit_price,
      total_amount,
      currency,
      confidence_score,
      required_corrections,
      raw_extraction
    )
    select
      p_document_id,
      p_request_id,
      v_document.company_id,
      line_no,
      product_name,
      model_name,
      origin_country,
      export_country,
      shipment_country,
      destination_country,
      incoterms,
      quantity,
      unit,
      unit_price,
      total_amount,
      currency,
      confidence_score,
      coalesce(required_corrections, '[]'::jsonb),
      coalesce(raw_extraction, '{}'::jsonb)
    from jsonb_to_recordset(p_line_items) as row(
      line_no integer,
      product_name text,
      model_name text,
      origin_country text,
      export_country text,
      shipment_country text,
      destination_country text,
      incoterms text,
      quantity numeric,
      unit text,
      unit_price numeric,
      total_amount numeric,
      currency text,
      confidence_score numeric,
      required_corrections jsonb,
      raw_extraction jsonb
    );

    get diagnostics v_line_count = row_count;
  end if;

  update public.case_documents
    set status = p_status,
        updated_at = now()
  where id = p_document_id
    and request_id = p_request_id
    and company_id = v_document.company_id;

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
    v_document.company_id,
    'persist_document_extraction',
    'case_documents',
    p_document_id,
    jsonb_build_object(
      'request_id', p_request_id,
      'status', p_status,
      'line_item_count', v_line_count
    )
  );

  return jsonb_build_object(
    'status', p_status,
    'line_item_count', v_line_count
  );
end;
$$;

grant execute on function public.persist_document_extraction(uuid, uuid, public.document_processing_status, jsonb) to authenticated;
