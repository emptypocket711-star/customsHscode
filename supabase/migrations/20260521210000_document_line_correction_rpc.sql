create or replace function public.correct_document_line_item(
  p_line_item_id uuid,
  p_product_name text,
  p_model_name text default null,
  p_origin_country text default null,
  p_shipment_country text default null,
  p_destination_country text default null,
  p_incoterms text default null,
  p_quantity numeric default null,
  p_unit text default null,
  p_unit_price numeric default null,
  p_total_amount numeric default null,
  p_currency text default null,
  p_required_corrections jsonb default '[]'::jsonb,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid;
  before_row public.extracted_document_line_items%rowtype;
  after_json jsonb;
begin
  actor := public.assert_current_user_staff();

  select *
    into before_row
  from public.extracted_document_line_items
  where id = p_line_item_id
  for update;

  if before_row.id is null then
    raise exception '문서 추출 라인아이템을 찾을 수 없습니다.';
  end if;

  update public.extracted_document_line_items
  set
    product_name = nullif(trim(p_product_name), ''),
    model_name = nullif(trim(coalesce(p_model_name, '')), ''),
    origin_country = nullif(upper(trim(coalesce(p_origin_country, ''))), ''),
    shipment_country = nullif(upper(trim(coalesce(p_shipment_country, ''))), ''),
    destination_country = nullif(upper(trim(coalesce(p_destination_country, ''))), ''),
    incoterms = nullif(trim(coalesce(p_incoterms, '')), ''),
    quantity = p_quantity,
    unit = nullif(upper(trim(coalesce(p_unit, ''))), ''),
    unit_price = p_unit_price,
    total_amount = p_total_amount,
    currency = nullif(upper(trim(coalesce(p_currency, ''))), ''),
    required_corrections = coalesce(p_required_corrections, '[]'::jsonb),
    raw_extraction = raw_extraction || jsonb_build_object(
      'last_correction_note', p_note,
      'last_corrected_by', actor,
      'last_corrected_at', now()
    ),
    status = 'pending_review',
    updated_at = now()
  where id = p_line_item_id;

  select to_jsonb(line.*)
    into after_json
  from public.extracted_document_line_items line
  where line.id = p_line_item_id;

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
    'correct_document_line_item',
    'extracted_document_line_items',
    p_line_item_id,
    to_jsonb(before_row),
    after_json
  );
end;
$$;
