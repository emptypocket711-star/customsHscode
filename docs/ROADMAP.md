# Roadmap

운영 작업 기록은 [WORK_LOG.md](./WORK_LOG.md), 주요 제품·기술 결정은 [DECISIONS.md](./DECISIONS.md)에 별도로 남긴다.

## 진행 보고 규칙

앞으로 작업 완료 보고에는 항상 아래 두 항목을 함께 표시한다.

- 완료된 작업: 이번 턴에서 실제 반영, 검증, 커밋, 배포 확인까지 끝난 항목
- 다음 작업: 아직 남은 항목 중 우선순위가 높은 작업

## Current Phase Status

현재 제품은 단순 MVP 부트스트랩 단계를 지나, 제한 공개 테스트와 운영 안정화 사이에 있다.

| Phase | 상태 | 목표 | 핵심 산출물 |
| --- | --- | --- | --- |
| Phase A. 조회 핵심 제품화 | 완료 | HS/품명/국가 기준 조회를 실제 사용 가능한 수준으로 정리 | 통합 조회, 씨엘형 HS 네비게이터, 관세율 정렬, 수입요건, 복사 안내문 |
| Phase B. 계정·운영 기반 | 완료 | 로그인, 회원가입, 개발자 운영 메뉴, 공지, 사용자 관리 구축 | Supabase Auth, 개인/기업회원 흐름, 개발자 전용 운영 화면, 공지 팝업 |
| Phase C. 외부 연동 실험 | 진행 | 관세청, KOTRA, CY/CFS, 자동차 제원, 터미널 조회 등 실무 보조 연동 검증 | API001 relay, API012 캐시, 적하목록 감시, 중고차 수출 도구, 무역뉴스 |
| Phase D. 운영 안정화 | 진행 | 공개 테스트 중 서버 오류, 누락 migration, 느린 route, 비용 폭증을 줄임 | rate limit, health check, production smoke, 운영 DB schema check |
| Phase E. 품명 AI 고도화 | 진행 | GPT를 단순 후보 생성기가 아니라 분류 인터뷰어로 사용 | 단일 후보/보완질문/다의어 분기, 다국어 품명 처리, 캐시와 telemetry |
| Phase F. 수익화 전 기능 완성 | 예정 | 유료화 전에 반복 실무 작업을 줄이는 기능 완성 | 일괄 조회, 파일 업로드/OCR, 보고서 출력, 사용량 제한, 요금제 |

## Next Phase Plan

### Phase D-1. 운영 신뢰도 고정

목표: 테스트 사용자가 늘어도 “페이지가 안 열린다”, “작업 중이 멈춘다”, “환경변수/DB 누락으로 기능이 죽는다”를 줄인다.

완료된 항목:

- route rate limit 추가
- production smoke test 추가
- 테스트 계정 로그인 기반 production smoke 지원
- runtime environment health check 추가
- production schema health check 추가
- 보호 페이지 proxy login guard 추가
- 외부 연동 오류 응답 표준화 1차
- 적하목록/관세환율 외부 API 실패 진단 표시
- 터미널별 컨테이너 조회 실패 시도 결과 표시
- 운영 점검 화면에 조회 품질 일자별 요약 추가
- 조회 품질 로그의 route별 실패율과 평균/최대 응답시간 표시
- 반입계 출력 실패 원인 코드 세분화
- 운영 점검 화면에 background job 대기/실패 상태 표시
- 운영 점검 화면에 외부 연동별 준비 상태와 호출 경로 표시
- 반입계 출력 실패 코드별 사용자 재시도 안내 표시

앞으로 할 항목:

1. Vercel/cron 실행 실패를 개발자 공지 또는 운영 알림으로 노출
2. 반입계 출력 실패 원인 코드를 운영 화면에서 통계화
3. route별 rate limit 초과 이벤트를 운영 화면에 표시

### Phase E-1. 품명 AI 검색 품질 고정

목표: 품명 검색에서 결과 없음이 잦거나 엉뚱한 후보가 나오는 문제를 구조적으로 줄인다.

완료된 항목:

- GPT 우선 후보 생성
- 단일 고확신 후보와 보완질문형 응답 분리
- 다국어/오타/제품명 입력 대응 보강
- 공식 품명 DB 대조 의존도 축소
- GPT 호출 실패, 후보 수준, 최종 후보 품질 telemetry 보강
- 운영 점검 화면에서 GPT 단계와 후보 품질 표시
- GPT가 HS4/HS6 예비 방향만 준 경우 결과 없음 화면에 예비 조회 링크 표시
- 한글 상품명과 제품코드형 입력의 GPT 예비 후보 회귀 테스트 추가

앞으로 할 항목:

1. 실제 사용자 검색 실패 케이스를 운영 화면에서 케이스별 drill-down으로 확인
2. “제품명/브랜드명/모델명만 입력” 시 웹 근거 또는 보완질문 분기 정확도 추가 개선
3. GPT 응답이 HS6만 줄 때 하위 HSK 선택 UI를 더 명확하게 분리
4. 복사 안내문을 짧은 버전/상세 버전/언어별 버전으로 안정화

### Phase C-1. 외부 연동의 운영 가능성 정리

목표: 외부 사이트나 공공 API가 불안정해도 사용자에게 실패 이유와 대체 행동을 명확히 보여준다.

완료된 항목:

- API001 관세청 relay 구성
- API012 관세환율 DB 캐시 구조
- 터미널별 컨테이너 조회와 반입계 이미지 출력
- 자동차 제원정보 조회
- KOTRA 무역뉴스 기반
- 외부 터미널 helper/반입계 출력 오류 JSON 표준화
- 컨테이너 조회 실패 시 터미널별 시도 결과 표시
- KOTRA/WTO/정부 뉴스 국가 필터 영문명·약칭 매칭 보강
- API key와 endpoint 설정 상태를 운영 화면에서 기능 단위로 구분
- 반입계 출력 실패 원인별 재시도 안내 개선
- 무역 뉴스 비한글 원문 카드에 출처 기반 짧은 안내와 원문 발췌 표시

앞으로 할 항목:

1. 터미널 반입계 출력 실패 원인별 통계
2. API001/API012 정기 job 실패 이력을 운영 화면에 노출
3. 뉴스 원문 자동 번역/요약은 비용·저작권 검토 후 별도 기능으로 분리

### Phase F-1. 유료화 전 핵심 생산성 기능

목표: 사용자가 돈을 낼 이유가 되는 반복 업무 절감 기능을 만든다.

앞으로 할 항목:

1. HS CODE 일괄 조회 업로드와 엑셀 출력
2. 관부가세 계산의 내국세 매핑 데이터 보강
3. 적하목록 상태 알림의 사용자별 사용량 제한
4. 즐겨찾기/최근조회 기반 개인 대시보드 편집
5. 문서 업로드 OCR/XLS 변환 worker 분리

## Phase 0 — Project Bootstrap

- Next.js project
- Tailwind/shadcn
- Supabase client/server setup
- app shell
- auth placeholder
- route groups

## Phase 1 — Schema and RLS

- core schema
- roles
- companies
- hs requests
- candidates
- reports
- legal source snapshots
- audit logs
- RLS policies

## Phase 2 — HS Direct Lookup

- input form
- HSK candidate display
- mock HS data seed
- basis date UI
- source footer

## Phase 3 — Product Name HS Recommendation

- product info form
- candidate generator abstraction
- mock heuristic generator
- required questions
- staff select/reject/confirm

## Phase 4 — Import Diagnosis

- tariff result placeholder
- FTA placeholder
- import requirement placeholder
- requirement playbook placeholder
- customer request template

## Phase 5 — Export Diagnosis

- export requirement placeholder
- export-control preliminary screen
- FTA C/O for export
- buyer document list

## Phase 6 — Legal Update Engine

- snapshot upload/import
- checksum
- diff events
- review dashboard
- publish/reject
- impacted report marking

## Phase 7 — Document Upload

- private storage
- document metadata
- extracted line items
- manual correction UI
- connect to HS recommendation

## Phase 8 — Report Output

- report preview
- source locks
- staff approval
- PDF download

## Phase 9 — Billing

- plans
- case limits
- report credits
- paid report checkout

## Phase 10 — AI-Assisted Clarification

- provider adapter for GPT/Gemini behind a server-only interface
- product-name ambiguity detector
- invoice and packing-list extraction assist for varied formats
- AI-generated missing-information questions
- GPT product-name normalization returns provisional HS4/HS6/HSK lookup hints first, then official HS/tariff/requirement data is used for detail expansion and downstream checks
- invoice HS code conflict check against product description
- redacted prompt/audit logging without confidential document contents
- staff-review handoff for user-selected HS confirmation requests

## Launch Backlog

1. Improve dashboard and direct lookup density for daily broker/forwarder use.
2. Expand destination-country HS, tariff, internal tax, requirement datasets beyond the current priority countries.
3. Replace temporary internal-tax law rules with official HS-mapped internal-tax data once received.
4. Keep document upload hidden from ordinary users until OCR/XLS conversion workers are deployed.
5. Add production observability for lookup latency, AI timeout count, cache hit rate, and rate-limit events.
6. Add source-publish cache invalidation and scheduled monthly Customs API018 ingestion.
7. Load-test `/hs/direct`, `/hs/overseas`, `/dashboard`, and login flows before wider launch.
