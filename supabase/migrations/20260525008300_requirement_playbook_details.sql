delete from public.requirement_playbooks
where source_version = 'requirement-playbook-import-food-20260525';

insert into public.requirement_playbooks (
  requirement_document_name,
  related_law,
  agency,
  application_method,
  required_documents,
  expected_lead_time,
  exemption_possibility,
  common_rejection_reasons,
  customer_request_template,
  staff_checklist,
  source_name,
  source_url,
  source_version,
  effective_from,
  published_at,
  retrieved_at,
  status,
  checksum
) values (
  '수입식품등 수입신고확인증',
  '수입식품안전관리 특별법',
  '식품의약품안전처',
  '판매 목적 또는 영업상 사용 목적의 수입식품등은 매 수입 시 통관장소 관할 지방식품의약품안전청에 수입신고를 하고, 통관 전 검사 결과 적합한 경우 수입신고확인증을 발급받습니다.',
  '["수입식품등 수입신고서", "송장 또는 거래명세서", "한글표시사항 또는 표시 견본", "성분ㆍ배합비율ㆍ제조공정 등 제품 설명자료", "해외제조업소 등록 정보", "필요 시 위생증명서ㆍ검사성적서ㆍ수출계획서 등 품목별 증빙"]'::jsonb,
  '서류검사ㆍ현장검사ㆍ정밀검사ㆍ무작위표본검사 여부와 보완 요구에 따라 달라집니다.',
  '식품, 식품첨가물, 기구, 용기ㆍ포장, 건강기능식품, 축산물에 해당하지 않거나 식품과 직접 접촉하지 않는 용도라면 대상 제외 가능성이 있습니다. 외화획득용, 연구ㆍ전시 등 특수 목적은 별도 증빙과 검사 방식ㆍ제출서류 차이를 확인합니다.',
  '["해외제조업소 미등록 또는 정보 불일치", "식품 접촉 용도 여부 불명확", "성분ㆍ원재료ㆍ첨가물 기준규격 확인 부족", "한글표시사항 누락 또는 표시 기준 부적합", "검사 대상인데 사전 증빙 또는 사진 자료 부족"]'::jsonb,
  '해당 물품이 식품, 식품첨가물, 기구, 용기ㆍ포장, 건강기능식품, 축산물 중 어디에 해당하는지 확인할 수 있도록 제품 카탈로그, 용도 설명, 재질ㆍ성분표, 식품 접촉 여부, 제조사와 해외제조업소 정보를 보내주세요. 수입식품등에 해당하면 수입신고 및 검사 후 수입신고확인증 발급 대상 가능성이 있습니다.',
  '["판매 목적 또는 영업상 사용 목적 여부 확인", "식품등ㆍ건강기능식품ㆍ축산물ㆍ기구ㆍ용기포장 해당성 확인", "해외제조업소 등록 필요 여부 확인", "품목별 검사 방식과 제출서류 확인", "한글표시사항과 기준규격 적합성 확인", "부적합ㆍ반송ㆍ폐기 이력 또는 재수입 제한 이슈 확인"]'::jsonb,
  '국가법령정보센터 및 식품의약품안전처 수입식품정보마루',
  'https://impfood.mfds.go.kr/CFAGG01F01',
  'requirement-playbook-import-food-20260525',
  '2026-05-25',
  now(),
  now(),
  'published',
  encode(digest('수입식품등 수입신고확인증|수입식품안전관리 특별법|requirement-playbook-import-food-20260525', 'sha256'), 'hex')
);

create or replace function public.get_legal_source_version_inventory()
returns table (
  target_table text,
  source_name text,
  source_version text,
  status public.legal_record_status,
  row_count bigint,
  latest_retrieved_at timestamptz,
  latest_published_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select *
  from (
    select 'hs_master'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at) from public.hs_master group by source_name, source_version, status
    union all select 'standard_product_names'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at) from public.standard_product_names group by source_name, source_version, status
    union all select 'tariff_rates'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at) from public.tariff_rates group by source_name, source_version, status
    union all select 'export_destination_tariff_rates'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at) from public.export_destination_tariff_rates group by source_name, source_version, status
    union all select 'customs_confirmation_requirements'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at) from public.customs_confirmation_requirements group by source_name, source_version, status
    union all select 'integrated_public_notice_requirements'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at) from public.integrated_public_notice_requirements group by source_name, source_version, status
    union all select 'requirement_playbooks'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at) from public.requirement_playbooks group by source_name, source_version, status
    union all select 'customs_statistical_codes'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at) from public.customs_statistical_codes group by source_name, source_version, status
    union all select 'internal_tax_law_rules'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at) from public.internal_tax_law_rules group by source_name, source_version, status
    union all select 'origin_marking_targets'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at) from public.origin_marking_targets group by source_name, source_version, status
    union all select 'origin_marking_methods'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at) from public.origin_marking_methods group by source_name, source_version, status
  ) inventory(target_table, source_name, source_version, status, row_count, latest_retrieved_at, latest_published_at)
  where public.is_staff_or_admin()
  order by latest_retrieved_at desc nulls last, row_count desc;
$$;


create or replace function public.publish_legal_source_version(
  p_target_table text,
  p_source_version text,
  p_match_prefix boolean default false,
  p_note text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid;
  affected_count integer := 0;
  sql_text text;
begin
  actor := public.assert_current_user_staff();

  if p_target_table not in (
    'hs_master',
    'standard_product_names',
    'tariff_rates',
    'export_destination_tariff_rates',
    'customs_confirmation_requirements',
    'integrated_public_notice_requirements',
    'customs_statistical_codes',
    'internal_tax_law_rules',
    'requirement_playbooks',
    'export_destination_import_requirements',
    'export_destination_internal_taxes',
    'export_destination_customs_codes',
    'export_destination_additional_tariffs',
    'export_destination_trade_remedy_cases',
    'export_destination_data_sources',
    'origin_marking_targets',
    'origin_marking_methods'
  ) then
    raise exception '게시할 수 없는 원천 테이블입니다: %', p_target_table;
  end if;

  if p_source_version is null or length(trim(p_source_version)) = 0 then
    raise exception 'source_version이 필요합니다.';
  end if;

  sql_text := format(
    'update public.%I
       set status = ''published''::public.legal_record_status,
           published_at = coalesce(published_at, now()),
           retrieved_at = retrieved_at
     where status in (''staged''::public.legal_record_status, ''reviewed''::public.legal_record_status)
       and %s',
    p_target_table,
    case
      when p_match_prefix then 'source_version like $1'
      else 'source_version = $1'
    end
  );

  execute sql_text using case when p_match_prefix then p_source_version || '%' else p_source_version end;
  get diagnostics affected_count = row_count;

  insert into public.audit_logs (actor_id, action, target_table, target_id, after_json)
  values (actor, 'publish_legal_source_version', p_target_table, null, jsonb_build_object(
    'source_version', p_source_version,
    'match_prefix', p_match_prefix,
    'affected_count', affected_count,
    'note', p_note
  ));

  return affected_count;
end;
$$;
