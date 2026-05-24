# 내국세 법령 기반 HS 후보/세액 룰

## 목적

국민신문고 또는 공식 법령 자료로 HS별 내국세 매핑 자료를 받기 전까지, 내국세 법령 문구를 구조화해 다음 두 흐름에 사용한다.

- HS CODE 조회 시 내국세 가능성 표시
- 품명 검색 시 내국세 법령 단서를 HS 후보 추천 보조 신호로 사용

이 룰은 HS 확정 용도가 아니라 후보 축소와 세액 계산 입력값 보조용이다.

## 테이블

`public.internal_tax_law_rules`

주요 컬럼:

- `tax_type`: `vat`, `individual_consumption_tax`, `liquor_tax` 등
- `tax_name`: 화면 표시명
- `law_name`, `article_ref`: 법령명과 조문/별표
- `rule_type`: `hsk_exact`, `hs6`, `hs4`, `keyword_condition`, `statistical_code`, `manual_review`
- `hsk_pattern`: HS 10/6/4자리 패턴
- `keyword_terms`: 품명 검색 보조 단서
- `rate_text`, `rate_formula`: 세율 또는 계산식
- `tax_base_type`: 계산 시 과세표준 기준
- `condition_text`: 적용 조건 설명
- `source_name`, `source_url`, `source_version`
- `effective_from`, `effective_to`, `status`, `checksum`

## 테스트 룰

마이그레이션 `20260524020000_internal_tax_law_rules.sql`에 다음 테스트 룰을 넣었다.

- 부가가치세 10% 공통 룰
- `3303` 향수/화장수 개별소비세 테스트 룰
- 고급 시계/귀금속 키워드 개별소비세 테스트 룰
- `2208` 위스키 등 증류주 주세 테스트 룰
- `2710` 석유류 교통·에너지·환경세 테스트 룰

## 조회 동작

HS CODE 조회:

1. HSK 10자리 직접 매칭
2. HS6 매칭
3. HS4 매칭
4. 품명 키워드 조건 매칭
5. 부가가치세 공통 룰

품명 검색:

1. 표준품명 후보 조회
2. 내국세 법령 키워드와 품명 매칭
3. 매칭된 룰의 `hsk_pattern` 하위 HS를 후보에 추가
4. 관세청 HS부호검색 API 후보와 병합

예: `위스키` 검색 시 `주세법` 룰의 `2208` 패턴이 매칭되어 `2208.30-1000` 등 위스키 후보가 올라온다.

## 실제 자료 수령 후 반영 절차

1. 법령/별표 항목을 `internal_tax_law_rules` 행으로 변환한다.
2. 법령에 HS가 있으면 `hsk_exact`, `hs6`, `hs4` 중 하나를 사용한다.
3. 법령에 품명만 있으면 `keyword_condition`으로 넣고 `keyword_terms`를 충분히 작성한다.
4. 시행일/폐지일을 `effective_from`, `effective_to`에 넣는다.
5. 테스트 source_version과 분리된 실제 `source_version`을 사용한다.
6. `status = staged`로 적재한 뒤 검수 후 `published`로 전환한다.

CSV/XLSX 자료는 스크립트로 seed SQL을 만들 수 있다.

```bash
python3 scripts/generate_internal_tax_law_rules_seed.py \
  ~/Downloads/internal-tax-law-rules.xlsx \
  --output supabase/seed/generated/internal_tax_law_rules_seed.sql \
  --source-name "국민신문고 회신 내국세 매핑 자료" \
  --source-url "manual://civil-complaint/internal-tax-rules" \
  --source-version internal-tax-law-rules-YYYYMMDD \
  --status staged
```

지원 헤더:

- `세목코드`, `세목명`, `법령명`, `조문`
- `룰유형`, `HS패턴`, `키워드`
- `세율`, `계산식`, `조건`
- `과세표준`
- `출처URL`, `시행일`, `종료일`

`룰유형`이 비어 있으면 HS 자리수와 키워드 여부로 `hsk_exact`, `hs6`, `hs4`, `keyword_condition`, `manual_review`를 추론한다.

## 검증 예시

```bash
curl -s 'http://localhost:3000/hs/direct?query=%EC%9C%84%EC%8A%A4%ED%82%A4&direction=import&destinationCountry=ALL&basisDate=2026-05-24'
```

확인 포인트:

- 품명 검색 결과에 2208 계열 후보 표시
- 후보 사유에 주세법 과세대상 단서 표시
- HS 상세 내국세 섹션에 주세/부가가치세 표시
