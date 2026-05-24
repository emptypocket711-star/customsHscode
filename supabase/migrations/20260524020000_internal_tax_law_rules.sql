create table if not exists public.internal_tax_law_rules (
  id uuid primary key default gen_random_uuid(),
  tax_type text not null,
  tax_name text not null,
  law_name text not null,
  article_ref text,
  rule_type text not null check (rule_type in ('hsk_exact', 'hs6', 'hs4', 'keyword_condition', 'statistical_code', 'manual_review')),
  hsk_pattern text,
  keyword_terms text[] not null default '{}',
  rate_text text,
  rate_formula text,
  condition_text text,
  source_name text not null,
  source_url text not null,
  source_version text not null,
  effective_from date not null,
  effective_to date,
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  status public.legal_record_status not null default 'draft',
  checksum text
);

create index if not exists internal_tax_law_rules_hsk_idx
  on public.internal_tax_law_rules(hsk_pattern, effective_from, effective_to, status);

create index if not exists internal_tax_law_rules_source_idx
  on public.internal_tax_law_rules(source_version, status);

create index if not exists internal_tax_law_rules_keywords_idx
  on public.internal_tax_law_rules using gin(keyword_terms);

alter table public.internal_tax_law_rules enable row level security;

create policy "published internal tax law rules readable by app users" on public.internal_tax_law_rules
  for select to anon, authenticated
  using (status = 'published');

create policy "staff writes internal tax law rules" on public.internal_tax_law_rules
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

delete from public.internal_tax_law_rules where source_version = 'internal-tax-law-test-rules-20260524';

insert into public.internal_tax_law_rules (
  tax_type,
  tax_name,
  law_name,
  article_ref,
  rule_type,
  hsk_pattern,
  keyword_terms,
  rate_text,
  rate_formula,
  condition_text,
  source_name,
  source_url,
  source_version,
  effective_from,
  effective_to,
  published_at,
  retrieved_at,
  status,
  checksum
) values
  (
    'vat',
    '부가가치세',
    '부가가치세법',
    '제30조',
    'hs4',
    null,
    array[]::text[],
    '10%',
    '부가가치세 과세표준 x 10%',
    '수입 재화의 일반 부가가치세율 테스트 룰. 면세·영세율·특례 품목은 별도 룰이 우선한다.',
    '내국세 법령 테스트 룰',
    'internal://seed/internal-tax-law-test-rules',
    'internal-tax-law-test-rules-20260524',
    date '2026-01-01',
    null,
    now(),
    now(),
    'published',
    encode(digest('internal-tax-law-test-rules-20260524|vat|general', 'sha256'), 'hex')
  ),
  (
    'individual_consumption_tax',
    '개별소비세',
    '개별소비세법 시행령',
    '별표 1 테스트 항목',
    'hs4',
    '3303',
    array['향수', '오드뚜왈렛', '화장수']::text[],
    '7%',
    '과세가격 x 7%',
    '향수·화장수류 테스트 룰. 실제 과세대상 범위와 면세 기준은 공식 별표 수령 후 재정의한다.',
    '내국세 법령 테스트 룰',
    'internal://seed/internal-tax-law-test-rules',
    'internal-tax-law-test-rules-20260524',
    date '2026-01-01',
    null,
    now(),
    now(),
    'published',
    encode(digest('internal-tax-law-test-rules-20260524|individual-consumption|3303', 'sha256'), 'hex')
  ),
  (
    'individual_consumption_tax',
    '개별소비세',
    '개별소비세법 시행령',
    '별표 1 테스트 항목',
    'keyword_condition',
    null,
    array['고급시계', '고급 시계', '귀금속', '보석']::text[],
    '20%',
    '과세가격 x 20%',
    '고가 시계·귀금속류 테스트 룰. 실제 기준금액과 과세표준은 공식 자료 수령 후 적용한다.',
    '내국세 법령 테스트 룰',
    'internal://seed/internal-tax-law-test-rules',
    'internal-tax-law-test-rules-20260524',
    date '2026-01-01',
    null,
    now(),
    now(),
    'published',
    encode(digest('internal-tax-law-test-rules-20260524|individual-consumption|luxury-watch', 'sha256'), 'hex')
  ),
  (
    'liquor_tax',
    '주세',
    '주세법',
    '주류 종류별 세율 테스트 항목',
    'hs4',
    '2208',
    array['위스키', '브랜디', '럼', '보드카', '리큐르']::text[],
    '종량/종가 혼합',
    '주종별 세율 별도 적용',
    '증류주류 테스트 룰. 주종·알코올분·용량별 공식 세율 자료 수령 후 세분화한다.',
    '내국세 법령 테스트 룰',
    'internal://seed/internal-tax-law-test-rules',
    'internal-tax-law-test-rules-20260524',
    date '2026-01-01',
    null,
    now(),
    now(),
    'published',
    encode(digest('internal-tax-law-test-rules-20260524|liquor|2208', 'sha256'), 'hex')
  ),
  (
    'transport_energy_environment_tax',
    '교통·에너지·환경세',
    '교통·에너지·환경세법',
    '석유류 테스트 항목',
    'hs4',
    '2710',
    array['휘발유', '경유', '등유', '석유']::text[],
    '종량세',
    '리터당 세액 별도 적용',
    '석유류 테스트 룰. 세부 유종·리터당 세액은 공식 자료 수령 후 세분화한다.',
    '내국세 법령 테스트 룰',
    'internal://seed/internal-tax-law-test-rules',
    'internal-tax-law-test-rules-20260524',
    date '2026-01-01',
    null,
    now(),
    now(),
    'published',
    encode(digest('internal-tax-law-test-rules-20260524|transport-energy|2710', 'sha256'), 'hex')
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
    select 'hs_master'::text as target_table, source_name, source_version, status, count(*)::bigint as row_count, max(retrieved_at) as latest_retrieved_at, max(published_at) as latest_published_at
    from public.hs_master
    group by source_name, source_version, status

    union all
    select 'standard_product_names'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at)
    from public.standard_product_names
    group by source_name, source_version, status

    union all
    select 'tariff_rates'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at)
    from public.tariff_rates
    group by source_name, source_version, status

    union all
    select 'export_destination_tariff_rates'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at)
    from public.export_destination_tariff_rates
    group by source_name, source_version, status

    union all
    select 'customs_confirmation_requirements'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at)
    from public.customs_confirmation_requirements
    group by source_name, source_version, status

    union all
    select 'integrated_public_notice_requirements'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at)
    from public.integrated_public_notice_requirements
    group by source_name, source_version, status

    union all
    select 'customs_statistical_codes'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at)
    from public.customs_statistical_codes
    group by source_name, source_version, status

    union all
    select 'internal_tax_law_rules'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at)
    from public.internal_tax_law_rules
    group by source_name, source_version, status

    union all
    select 'export_destination_import_requirements'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at)
    from public.export_destination_import_requirements
    group by source_name, source_version, status

    union all
    select 'export_destination_internal_taxes'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at)
    from public.export_destination_internal_taxes
    group by source_name, source_version, status

    union all
    select 'export_destination_data_sources'::text, source_name, source_version, status, count(*)::bigint, max(retrieved_at), max(published_at)
    from public.export_destination_data_sources
    group by source_name, source_version, status
  ) inventory
  where public.is_staff_or_admin()
  order by latest_retrieved_at desc nulls last, row_count desc;
$$;
