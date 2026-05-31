# Roadmap

운영 작업 기록은 [WORK_LOG.md](./WORK_LOG.md), 주요 제품·기술 결정은 [DECISIONS.md](./DECISIONS.md)에 별도로 남긴다.

## 진행 보고 규칙

앞으로 작업 완료 보고에는 항상 아래 두 항목을 함께 표시한다.

- 완료된 작업: 이번 턴에서 실제 반영, 검증, 커밋, 배포 확인까지 끝난 항목
- 다음 작업: 아직 남은 항목 중 우선순위가 높은 작업

## Current Phase Status

현재 제품은 단순 MVP 부트스트랩 단계를 지나, 제한 공개 테스트와 운영 안정화 사이에 있다.

## Platform MVP Rebaseline

제품 방향은 단순 HS CODE 안내 사이트가 아니라, 수출입 화주·해외 거래처·포워더·관세사를 이어주는 무역 실무 연결 플랫폼으로 재정의한다.

기존 HS CODE 조회, 품명 AI 검색, 관세율/요건 조회, 중고차 수출, 무역뉴스는 제거하지 않는다. 다만 핵심 목적은 정보 제공 자체가 아니라 견적 요청, 통관 의뢰, 파트너 매칭을 시작하게 만드는 신뢰 도구로 둔다.

### MVP Goal

1차 MVP는 아래 가설을 검증한다.

- 화주는 선적서류와 기본 정보를 올려 운송 견적 또는 통관 의뢰를 요청할 수 있다.
- 포워더와 관세사무소는 조건에 맞는 요청을 확인하고 견적을 제출할 수 있다.
- 화주는 받은 견적을 비교하고 업체를 선택할 수 있다.
- HS/품명/요건 조회 결과는 요청서를 더 정확하게 만드는 보조 데이터로 연결된다.
- 해외 수출자/수입자도 회사 정보와 증빙 서류를 제출해 한국 포워더/관세사무소와 연결될 수 있다.

### Rebased Phase Plan

| Phase | 상태 | 목표 | 핵심 산출물 |
| --- | --- | --- | --- |
| Platform Phase 0. 방향 전환 고정 | 진행 | HS 도구 중심에서 연결 플랫폼 중심으로 제품 문서와 IA 재정리 | PRODUCT_SPEC, ROADMAP, DECISIONS 갱신 |
| Platform Phase 1. 회원 유형·검증 기반 | 예정 | 화주, 포워더, 관세사무소, 해외 업체를 계정 구조에서 명확히 분리 | account type, company profile, verification status, 증빙 업로드 |
| Platform Phase 2. 운송 견적 요청 MVP | 예정 | 화주가 서류와 운송 조건을 올리고 포워더에게 견적을 받을 수 있게 함 | quote request, attachment, deadline, forwarder bid, shipper comparison |
| Platform Phase 3. 통관 의뢰 요청 MVP | 예정 | 화주가 통관 의뢰를 올리고 관세사무소가 수수료와 조건을 제안 | clearance request, broker bid, 추가서류 요청, 리드타임 |
| Platform Phase 4. 알림·관심 조건 | 예정 | 전체 알림 남발 없이 조건에 맞는 업체에게만 요청 노출·알림 | partner preferences, notification policy, reminder rules |
| Platform Phase 5. 조회 도구와 요청 연결 | 예정 | HS/품명/관세/요건/중고차 도구에서 견적·의뢰 요청으로 전환 | “이 품목으로 견적 요청”, “통관 의뢰 요청”, 조회 결과 첨부 |
| Platform Phase 6. 거래 신뢰·운영 관리 | 예정 | 최저가 경쟁만 막고 검증, 응답속도, 전문분야, 거래 이력 기반 비교 제공 | verification badges, response metrics, admin approval, abuse handling |

### Platform MVP Scope

반드시 포함:

1. 가입 단계에서 역할 선택
   - 수출/수입 화주
   - 포워더
   - 관세사무소
   - 해외 수입자/수출자
2. 회사 프로필과 검증 상태
   - 미검증
   - 이메일 인증
   - 서류 제출
   - 운영자 승인
   - 거래 이력 있음
3. 운송 견적 요청
   - 임시저장, 견적 모집중, 견적 도착, 업체 선정됨, 진행중, 완료, 취소, 만료
   - 서류 업로드
   - 마감 시간
   - 포워더 입찰
4. 통관 의뢰 요청
   - 서류 업로드
   - HS CODE 있음/없음
   - 관세사무소 입찰
   - 필요 추가서류와 예상 리드타임
5. 화주 견적 비교
   - 가격
   - 응답 속도
   - 견적 유효기간
   - 검증 상태
   - 전문 분야
6. 운영자 승인·숨김·차단
   - 업체 검증
   - 부적절 요청 숨김
   - 신고/차단

MVP에서 제외:

1. 국가별 해외 사업자번호 실시간 검증
2. 자동 결제·에스크로
3. 성공 수수료 정산 자동화
4. 모든 국가 언어 완성
5. 관세사 유료 HS 확정 검토 공개 노출
6. 최저가 자동 추천 단독 노출

### Role-Based Core Journeys

#### Journey P-A. 화주 운송 견적 요청

화주가 수출/수입 구분, 출발지, 도착지, 운송 방식, Incoterms, 품명, 포장 수량, 중량, CBM, 희망 일정, 서류를 입력하고 견적 모집을 시작한다. 포워더는 조건에 맞는 요청을 보고 견적을 제출한다.

#### Journey P-B. 화주 통관 의뢰 요청

화주가 수입/수출 통관 의뢰, 서류, HS CODE 여부, FTA 희망 여부, 요건 확인 필요 여부를 입력한다. 관세사무소는 통관 수수료, 검토 가능 여부, 필요 추가서류, 예상 리드타임을 제출한다.

#### Journey P-C. 포워더 입찰

포워더는 관심 조건에 맞는 운송 요청 목록을 확인하고, 상세 서류를 본 뒤 견적 단가, 견적서, 유효기간, 리드타임을 제출한다.

#### Journey P-D. 관세사무소 입찰

관세사무소는 통관 의뢰 목록을 확인하고, HS/요건/FTA 확인 필요 여부를 바탕으로 통관 수수료와 필요한 보완자료를 제시한다.

#### Journey P-E. 해외 업체 연결

해외 수출자/수입자는 국가, 회사 정보, 담당자, 웹사이트, 회사등록증 등 증빙을 제출한다. 운영자 승인 전에는 미검증 상태로 표시하고, 한국 포워더/관세사무소 연결은 제한된 범위에서 시작한다.

### Notification Direction

- 새 요청 생성 시 조건에 맞는 포워더/관세사무소에게 1회 알림
- 요청 마감 전 리마인드는 관심 조건이 맞고 아직 입찰하지 않은 업체에게 제한적으로 발송
- 요청 수정 알림은 이미 관심 표시 또는 입찰한 업체에게 우선 발송
- 업체별 관심 조건을 저장한다.
- 알림 피로도가 높아지면 즉시 digest 방식으로 전환한다.

### Existing Feature Repositioning

| 기존 기능 | 새 역할 |
| --- | --- |
| HS CODE 직접조회 | 요청서에 HS/관세/요건 근거를 붙이는 보조 도구 |
| 품명 AI 검색 | 화주가 품명을 몰라도 요청서를 시작하게 하는 진입 도구 |
| 수입/수출 진단 | 관세사무소 의뢰 전 보완자료를 정리하는 준비 도구 |
| 서류 업로드/OCR | 견적 요청과 통관 의뢰 자동작성의 핵심 입력 |
| 중고차 수출 | 중고차 수출 운송·통관 요청으로 연결되는 전문 업무 도구 |
| 무역뉴스 | 트래픽/신뢰 보조 콘텐츠, 기능 제거 금지 |
| 운영 통계 | 대표가 개발 수정 요청을 만들 수 있는 운영 보조 도구 |

### Immediate Next Work

1. PRODUCT_SPEC, ROADMAP, DECISIONS에 플랫폼 전환을 고정한다.
2. 가입/프로필 데이터 모델을 새 역할 기준으로 재검토한다.
3. 운송 견적 요청과 포워더 입찰의 최소 DB schema/RLS를 설계한다.
4. 통관 의뢰 요청과 관세사무소 입찰 schema를 운송 견적과 공통 구조로 설계한다.
5. 기존 대시보드 IA를 “조회 도구”보다 “내 요청/받은 견적/입찰 가능 요청” 중심으로 바꾼다.

| Phase | 상태 | 목표 | 핵심 산출물 |
| --- | --- | --- | --- |
| Phase A. 조회 핵심 제품화 | 완료 | HS/품명/국가 기준 조회를 실제 사용 가능한 수준으로 정리 | 통합 조회, 씨엘형 HS 네비게이터, 관세율 정렬, 수입요건, 복사 안내문 |
| Phase B. 계정·운영 기반 | 완료 | 로그인, 회원가입, 개발자 운영 메뉴, 공지, 사용자 관리 구축 | Supabase Auth, 개인/기업회원 흐름, 개발자 전용 운영 화면, 공지 팝업 |
| Phase C. 외부 연동 실험 | 진행 | 관세청, KOTRA, CY/CFS, 자동차 제원, 터미널 조회 등 실무 보조 연동 검증 | API001 relay, API012 캐시, 적하목록 감시, 중고차 수출 도구, 무역뉴스 |
| Phase D. 운영 안정화 | 진행 | 공개 테스트 중 서버 오류, 누락 migration, 느린 route, 비용 폭증을 줄임 | rate limit, health check, production smoke, 운영 DB schema check |
| Phase E. 품명 AI 고도화 | 진행 | GPT를 단순 후보 생성기가 아니라 분류 인터뷰어로 사용 | 단일 후보/보완질문/다의어 분기, 다국어 품명 처리, 캐시와 telemetry |
| Phase F. 실무 생산성 기능 | 진행 | 관세사무원·포워더의 반복 답변과 일괄 확인 업무를 줄임 | 일괄 조회, 엑셀 출력, 복사 안내문, 적하목록 일괄 감시, 고객사별 품목 |
| Phase G. 해외 수출자·수입자 확장 | 예정 | 해외에서 한국으로 수출하려는 사용자와 국내 수입자에게 직접 쓸 수 있는 화면 제공 | 영어/중국어 화면, 한국 수입요건 안내, 예상 관부가세, FTA/원산지 체크 |
| Phase H. 유료화·확장 운영 | 예정 | 유료화 전에 사용량 제한, 요금제, 데이터 품질 운영을 정리 | 요금제, 사용량 제한, 기능별 사용량, 운영 로그, 장애 알림 |

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
- 복사 안내문 언어와 짧은/상세 분량 선택 UI 보강
- 복사 안내문에 예비 안내, 재확인 문구, 다국어 보완 요청 항목 1차 반영

앞으로 할 항목:

1. 실제 사용자 검색 실패 케이스를 운영 화면에서 케이스별 drill-down으로 확인
2. “제품명/브랜드명/모델명만 입력” 시 웹 근거 또는 보완질문 분기 정확도 추가 개선
3. GPT 응답이 HS6만 줄 때 하위 HSK 선택 UI를 더 명확하게 분리
4. 복사 안내문 문구를 실사용 피드백 기준으로 계속 다듬기

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

### Phase F-1. 실무 생산성 기능

목표: 사용자가 돈을 낼 이유가 되는 반복 업무 절감 기능을 만든다.

완료된 항목:

- HS CODE 10자리 필수 일괄 조회 1차 화면 추가
- XLSX/CSV 업로드와 탭/쉼표 붙여넣기 입력 지원
- 중복 HS CODE를 합치지 않고 입력 행 순서 그대로 결과 출력
- 수입국가 필터 기준 관세율, FTA, 수입요건, 원산지표시 요약 출력
- 실제 `.xlsx` 결과 파일 다운로드
- 화면 결과를 전체/완료/보완 필요/오류 탭으로 분리
- `.xlsx` 파일에 보완 필요 시트를 별도 생성

앞으로 할 항목:

1. 일괄조회 결과에 품명 AI 보완질문과 HS6 하위 선택 UI 연결
2. 일괄조회 대량 처리용 background job 전환
3. 일괄조회 결과 파일을 업체 답변용 양식으로 개선
4. 조회 결과 복사 안내문 고도화
   - 짧은 안내문: 관세율, 수입요건, 필요 서류 유무 중심
   - 상세 안내문: 보완 필요 정보, 예비 HS 방향, FTA/내국세/요건 주의사항 포함
   - 수출자 안내용 영문·중문 문구 선택
   - 현재 1차 UI와 실무형 문구 반영 완료, 문구 품질은 테스트 피드백으로 계속 보정
5. 적하목록 일괄 감시
   - 여러 BL 일괄 등록
   - 반입, 검사대상, 수입신고수리, 반출 등 상태별 안내 문구
   - 목표 상태 도달 또는 최종 상태 도달 시 1회 발송 후 자동 종료
6. 고객사별 품목 관리
   - 회사별 자주 쓰는 HS CODE
   - 최근 조회, 즐겨찾기, 내부 메모
   - 고객별 반복 품목 리스트
7. 문서 업로드 OCR/XLS 변환 worker 분리
   - Commercial Invoice, Packing List, B/L, C/O, 카탈로그/스펙 추출
   - 추출 품목별 HS 후보와 보완 질문 연결
8. 보고서/문의 답변 출력
   - 고객 문의 답변용 복사문
   - 내부 검토 메모
   - 출력/저장 가능한 요약 보고서

### Phase G-1. 해외 수출자·국내 수입자 직접 사용 화면

목표: 관세사무소 내부 사용자를 넘어, 해외 수출자와 국내 수입자가 스스로 한국 수입 정보를 확인하고 문의 준비를 할 수 있게 한다.

앞으로 할 항목:

1. 해외 수출자용 한국 수입 조회 화면
   - 영어/중국어 UI
   - product name, material, use, model 입력
   - Korea import duty, VAT, import requirements, documents required 표시
   - 한국 수입자에게 전달할 summary 생성
2. 국내 수입자용 예상 관부가세 계산 완성
   - 외화/원화 물품값
   - 운임/보험료
   - 관세환율, 차주 환율
   - 관세, 부가세, 내국세
   - FTA 세율 선택
3. 수입요건 실무 플레이북
   - 요건명, 기관, 근거 법령
   - 필요한 기본 서류
   - 사전 준비 여부
   - 업체에 요청할 문구
4. FTA/원산지 검토 보조
   - 원산지, 선적국, 수출자 국가, 제조국, 판매자 국가 분리
   - FTA 가능성, C/O 방식, 직접운송, 증빙자료 안내
   - 확정 표현 없이 예비 검토/추가 확인 필요 구조 유지

### Phase H-1. 유료화·확장 운영

목표: 공개 테스트 이후 사용자가 늘어도 비용, 품질, 권한, 장애 대응을 통제한다.

앞으로 할 항목:

1. 사용자별 사용량 제한
   - 품명 AI 검색
   - 적하목록 감시
   - 일괄 조회
   - 반입계 출력
2. 요금제 설계
   - 개인회원
   - 기업회원
   - 관세사무소/포워딩용 다중 사용자
   - 개발자/관리자 권한
   - HS 확정 요청, 담당자 검토 크레딧, 검토 유료화는 협업 관세사무소와 가격 정책이 정해질 때까지 고객 화면에서 숨김
3. 운영 로그 기반 품질 개선
   - 무결과 검색어
   - GPT 실패 로그
   - 많이 검색한 품명
   - API 실패율
   - 느린 route
   - 기능별 사용량
4. 데이터 갱신 운영
   - 관세청 API018/관세율/통계부호 월별 갱신
   - KOTRA 뉴스 정기 수집
   - API012 관세환율 금요일 정기 캐시
   - legal/source snapshot checksum 관리

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
- staff-review handoff remains dormant until a review partner and pricing policy exist

## Launch Backlog

1. Improve dashboard and direct lookup density for daily broker/forwarder use.
   - Done: HS batch lookup now preserves invoice row order, separates result statuses, exports XLSX, includes row-level customer guidance text in both the UI copy button and downloaded file, supports copying the currently filtered guidance rows at once, and provides a downloadable upload template.
2. Expand destination-country HS, tariff, internal tax, requirement datasets beyond the current priority countries.
3. Replace temporary internal-tax law rules with official HS-mapped internal-tax data once received.
4. Keep document upload hidden from ordinary users until OCR/XLS conversion workers are deployed.
5. Add production observability for lookup latency, AI timeout count, cache hit rate, and rate-limit events.
6. Add source-publish cache invalidation and scheduled monthly Customs API018 ingestion.
7. Load-test `/hs/direct`, `/hs/overseas`, `/dashboard`, and login flows before wider launch.
