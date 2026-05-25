# UI Spec

## Tone

Professional Korean B2B SaaS.

Avoid casual copy. Use clear action labels.

## Main Navigation

- 대시보드
- 통합 조회
- 서류 조회
- 리포트
- 법령 업데이트 센터
- 설정

## Dashboard Cards

- 오늘 생성된 진단
- 법령/세율 업데이트 검토 대기
- 최근 리포트
- 고위험 수출통제 검토
- 선적서류 처리 현황

## Entry Page

Title:
`HS FINDER`

Cards:
1. `통합 조회`
2. `선적서류 조회`

Mode toggle:
- 수입
- 수출

Primary lookup:
- 첫 화면에 `HS CODE 또는 품명` 조회창을 배치한다.
- 같은 입력창에서 HSK, HS6, HS4, 품명을 모두 받는다.
- 숫자 입력은 HS/HSK 조회로 처리하고, 문자 입력은 품명 검색 결과로 처리한다.
- 수출 모드에서는 목적국 콤보박스를 함께 노출한다.

## Integrated Lookup

The customer-facing lookup screen is a self-service information view.

Do not use these labels in the customer-facing lookup screen:
- 공식자료 참고조회
- 예비진단
- 담당자 검토 필요
- 후보 추천
- 추가 확인 필요

Use neutral information labels:
- 품명 검색 결과
- 같은 HS6 품목
- 품목 상세
- 관세율
- 수입요건
- 수출상대국 관세율
- 표준품명/필수규격

Search behavior:
- 4-digit HS input displays matching HS6 groups and their lower HSK rows.
- 6-digit HS input displays all matching HSK rows under that HS6.
- 4-digit and 6-digit result tables show HS6 grouping headers and total HS6/HSK counts so users can scan the classification tree before opening a 10-digit item.
- 10-digit HSK input displays the selected item detail and same-HS6 row list.
- Product-name input displays ranked matching rows by HSK/HS6, and HSK/HS6 values are clickable.
- Product-name input expands practical trade terms and synonyms such as 립밤/입술화장, 폼클렌저/피부세척, 가방/핸드백 before matching.
- Clicking an HSK or HS6 navigates to the corresponding integrated lookup result while preserving direction, destination country, and basis date.
- In import mode, the tariff table displays common tariff rows such as 기본관세 and WTO 관세 plus only the FTA/RCEP tariff rows applicable to the selected country.
- APTA/아·태협정 tariff rows are filtered by selected country: general APTA countries show the 일반 row, Bangladesh shows the 방글라데시 row, Laos shows the 라오스 row, and non-APTA countries do not show APTA rows.
- Other common tariff families with suffix codes such as W1/W2, P1/P3, G1/G2, and C1-C6 must preserve the suffix in the user-facing label and detail popup rather than merging them into one generic row.
- FTA tariff codes are shown with customer-friendly labels, for example `FCN` as `한-중 FTA 관세율` and `FUS` as `한-미 FTA 관세율`.
- FTA/RCEP detail popups include origin-document method, direct-transport check, and supporting evidence notes where the agreement can be identified from the selected country.
- Customer-facing tariff tables do not show source version columns; import tariff rows show calculated `적용 순위` based on the 세율적용순서 priority guide.
- The tariff table provides a `세율 적용순서` button that opens an in-app priority guide popup. Do not embed third-party screenshots or PDFs.
- Tariff code `U` is treated as `북한산 관세율` and hidden from ordinary country-selected import lookup results unless the selected country is North Korea.
- Each tariff row has a `상세` action. For WTO concession-style rates, the popup must expose the tariff code, country-condition field, usage-rate-condition field, and a plain Korean explanation of when the rate may matter.
- Tariff detail popups must explain basic tariff, WTO tariff, FTA, CEPA, and RCEP in user-friendly Korean rather than only showing tariff codes.
- 해설 and 분류사례 tabs are deferred and should not be shown until data is available.

HS display format:
- 10-digit Korean HSK values are displayed as `3401.30-0000`.
- 6-digit HS values are displayed as `3401.30`.
- Search input may still accept digits, dots, hyphens, and spaces.

## Warning Components

Use badges:

- 예비진단
- HSK 확정 필요
- 담당자 검토 필요
- 법령 변경 검토중
- 출처 확인 필요
- 전략물자 리스크

## Report Layout

1. 요약
2. 입력정보
3. HS 후보
4. 관세율/FTA
5. 수입요건 or 수출요건
6. 요건 취득방법
7. 고객 요청자료
8. 담당자 검토사항
9. 출처 및 조회기준일
10. 면책/주의 문구

## Source Footer

Internal diagnosis and report views must show:

- 조회기준일
- 데이터 기준일
- source_version
- retrieved_at
- 담당자 승인 여부

Customer-facing integrated lookup may show compact source metadata, but the UI copy should focus on the retrieved fields rather than advisory or review wording.

## Document Lookup

- Extracted document line items expose a `통합조회` action.
- The action opens integrated lookup with product name, direction, destination country, and basis date prefilled.
- Two-letter country codes extracted from documents are normalized to the three-letter country values used by the lookup country selector when possible.
