alter table public.requirement_playbooks
  add column if not exists category text,
  add column if not exists risk_level text,
  add column if not exists workflow_type text,
  add column if not exists workflow_steps jsonb not null default '[]'::jsonb;

update public.requirement_playbooks
set
  category = case
    when requirement_document_name ~ '검역' or related_law in ('식물방역법', '가축전염병 예방법', '수산생물질병 관리법') then '검역'
    when related_law like '야생생물 보호%' and requirement_document_name like '%국제적멸종위기%' then 'CITES'
    when related_law like '%화학%' or related_law like '%오존층%' or related_law like '%석면%' or related_law = '농약관리법' or related_law = '비료관리법' then '화학물질'
    when related_law like '%원자력%' or related_law like '%방사선%' then '방사선'
    when related_law like '%식품%' or related_law = '먹는물관리법' or related_law = '위생용품관리법' or related_law = '사료관리법' then '식품'
    when related_law in ('약사법', '의료기기법', '마약류 관리에 관한 법률', '인체조직안전 및 관리 등에 관한 법률') then '의약'
    when related_law like '%전기용품%' or related_law like '%어린이제품%' or related_law like '%산업안전%' or related_law like '%고압가스%' or related_law like '%액화석유가스%' or related_law like '%계량%' or related_law like '%에너지%' then '안전인증'
    when related_law = '전파법' or related_law = '통신비밀보호법' then '통신기기'
    when related_law like '%목재%' or related_law = '종자산업법' then '농림자원'
    when related_law like '%외국환%' then '외환'
    when related_law like '%방위%' or related_law like '%총포%' then '통제물품'
    else '기타'
  end,
  workflow_type = case
    when requirement_document_name like '%허가%' then '허가'
    when requirement_document_name like '%승인%' then '승인'
    when requirement_document_name like '%신고%' then '신고'
    when requirement_document_name like '%검역%' then '검역'
    when requirement_document_name like '%인증%' then '인증'
    when requirement_document_name like '%검사%' then '검사'
    when requirement_document_name like '%확인%' then '확인'
    when requirement_document_name like '%보고%' then '보고'
    else '확인'
  end,
  risk_level = case
    when related_law like '%마약%' or related_law like '%방위%' or related_law like '%총포%' or related_law like '%원자력%' or related_law like '%방사선%' or related_law like '%감염병%' or related_law like '%화학무기%' then 'high'
    when requirement_document_name like '%허가%' or requirement_document_name like '%승인%' or related_law like '%화학%' or related_law like '%야생생물%' or related_law like '%폐기물%' then 'medium'
    else 'low'
  end,
  workflow_steps = case
    when requirement_document_name like '%검역%' then
      '["제품ㆍ원재료ㆍ학명ㆍ원산지 확인", "검역대상 및 수입금지ㆍ제한 조건 확인", "수출국 증명서 또는 처리증빙 확보", "수입신고ㆍ검역신청", "검사 결과에 따라 통관 또는 보완"]'::jsonb
    when requirement_document_name like '%허가%' then
      '["제품 성분ㆍ용도ㆍ최종사용자 확인", "허가대상 물품 또는 물질 해당성 확인", "필요 증빙과 취급ㆍ보관 계획 확보", "관할기관 허가 신청", "허가 결과 기준 통관 진행"]'::jsonb
    when requirement_document_name like '%승인%' then
      '["품목ㆍ모델ㆍ용도 확인", "승인대상 여부 및 예외 가능성 확인", "인증서ㆍ시험성적서ㆍ자격자료 확보", "관할기관 승인 또는 요건확인 신청", "승인 결과 기준 통관 진행"]'::jsonb
    when requirement_document_name like '%신고%' then
      '["제품 해당성 및 신고대상 여부 확인", "성분ㆍ규격ㆍ표시사항 자료 확보", "관할기관 신고 또는 확인 신청", "검사ㆍ보완 요청 대응", "신고필증 또는 통보서 기준 통관 진행"]'::jsonb
    when requirement_document_name like '%인증%' then
      '["제품 모델ㆍ규격ㆍ사용목적 확인", "인증ㆍ확인대상 유형 확인", "시험성적서 또는 기존 인증서 확인", "동일모델ㆍ표시사항 검토", "인증 확인 후 통관 진행"]'::jsonb
    when requirement_document_name like '%보고%' then
      '["제품 유형ㆍ성분ㆍ사용목적 확인", "허가ㆍ신고ㆍ등록 상태 확인", "표준통관예정보고 신청자료 준비", "협회 또는 관할기관 보고", "보고 결과 기준 통관 진행"]'::jsonb
    else
      '["제품 성격과 용도 확인", "관련 법령 대상 여부 확인", "필요 서류와 기관 확인", "보완 요청 대응", "확인 결과 기준 통관 진행"]'::jsonb
  end,
  updated_at = now()
where source_version like 'requirement-playbook-%';
