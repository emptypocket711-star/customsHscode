# Product Spec — 통관이음 AI

## One-line Definition

HS CODE 또는 품명으로 관세율, 표준품명, 수입요건, 수출상대국 관세율을 바로 조회하고, 선적서류가 있으면 자동 분석해서 수입·수출 요건, FTA, C/O, 전략물자, 요건 취득방법까지 현행 기준으로 진단하는 관세 실무 플랫폼.

## Target Users

1. 수입업체
2. 수출업체
3. 해외구매대행/쇼핑몰 셀러
4. 제조업체 무역팀
5. 관세사무소
6. 포워더/물류사무 담당자

## Paid Value

Users pay for reducing:
- 통관 지연
- 요건 미비
- FTA 적용 누락
- HS 오분류 리스크
- 고객-관세사무소 자료 왕복
- 수출 전략물자 리스크
- C/O 발급 준비 누락

## Entry Modes

### 1. Integrated HS/Product Lookup

User enters HS4, HS6, HSK10, or product name in one search box.

Lookup behavior:
- HS4 input shows matching HS6 groups and lower HSK rows.
- HS6 input shows all matching HSK rows under that HS6.
- HSK10 input shows the selected item detail, same-HS6 rows, tariff rates, standard names, and requirements.
- Product-name input shows matching HSK/HS6 rows with neutral match information.
- HSK and HS6 values are clickable and preserve import/export mode, country, and basis date.
- Import mode prioritizes Korean tariff and import requirement information.
- Export mode prioritizes selected destination-country tariff information.

### 2. Shipping Document Upload

User uploads documents and app extracts data.

## Customer-Facing Lookup Output

The customer-facing integrated lookup screen is informational and self-service. It should not present staff review workflow, advisory wording, or source-reference explanations as the primary UX.

- HS6/HSK hierarchy
- Korean and English item names
- quantity and weight units
- basic tariff
- WTO tariff
- FTA/agreement rates when available
- standard product names and required specs
- customs-confirmation import requirements
- selected destination-country tariff rates for export mode
- basis date and compact source/version metadata

## Import Diagnosis Output

- HSK candidate or selected HSK
- 품명 / 표준품명 / 필수규격
- 기본세율
- WTO 협정세율
- FTA 협정세율
- C/O 발급 가능성
- C/O 발급방식
- 원산지결정기준
- 직접운송 요건
- 세관장확인 수입요건
- 통합공고/개별법령 주의
- 요건 취득방법
- 고객 요청자료
- 담당자 검토 포인트
- 출처 및 조회기준일

## Export Diagnosis Output

- HSK candidate or selected HSK
- 수출신고 품명·규격 가이드
- 세관장확인 수출요건
- 통합공고/개별법령 수출요건
- 전략물자 예비 리스크
- 자가판정/전문판정 안내
- 수출허가/상황허가 가능성
- FTA C/O 발급 가능성
- 원산지증빙자료
- 상대국 수입세율 조회 메모
- 바이어 제출서류
- 출처 및 조회기준일

## Report Disclaimer

본 리포트는 업로드된 서류와 조회기준일 현재 수집·검토된 공식 데이터 및 내부 룰을 기반으로 한 AI 예비진단 자료입니다. 품목분류, 관세율, FTA 협정관세 적용, 원산지 충족 여부, 수출입요건 해당 여부, 전략물자 해당 여부는 신고시점의 법령, 세관 심사, 관계기관 확인 및 담당자 검토에 따라 달라질 수 있습니다.
