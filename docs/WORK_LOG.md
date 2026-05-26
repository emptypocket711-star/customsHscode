# Work Log

이 문서는 HS FINDER 개발 중 실제로 수행한 작업, 검증 결과, 커밋을 날짜별로 남긴다.

## 2026-05-26

### 런칭 전 조회 UX 정리

- `82427b9` Add Vercel Analytics tracking
  - Vercel Analytics를 앱 레이아웃에 추가해 방문자 수와 페이지 조회수 집계를 시작할 수 있게 했다.
  - 검증: typecheck, lint, build 통과.

- `3b3d8b7` Show prefix HS lookups as folder tree
  - 4자리/6자리 HS 조회 결과를 씨엘형 폴더 구조로 정리했다.
  - 왼쪽 네비게이터에서 HS4, HS6, HSK 10자리 계층을 확인할 수 있게 했다.
  - 검증: typecheck, lint, build 통과.

- `2c3623e` Sort import tariffs in Ciel-style display order
  - 수입 관세율을 기본관세, WTO, 주요 양허, FTA 순으로 사용자 친화적으로 정렬했다.
  - 모든국가와 특정국가 조회 모두 같은 정렬 규칙을 사용한다.
  - 검증: 관련 테스트, typecheck, lint, build 통과.

- `8f11fb2` Make AI product search ask branch questions first
  - 품명 검색 GPT 응답을 `needs_clarification`, `single_likely_candidate`, `ambiguous_multiple_meanings` 상태로 나누었다.
  - 애매한 품명은 후보를 길게 나열하기보다 HS 특정에 필요한 분기 질문을 먼저 보여주도록 정리했다.
  - 검증: 관련 테스트, typecheck, lint, build 통과.

- `2e361d8` Support single high-certainty AI HS candidates
  - GPT가 높은 확신도와 단일 후보를 반환하면 후보 1개만 노출하도록 했다.
  - 확정이 어려운 경우에는 복수 후보 또는 보완 질문을 유지한다.
  - 검증: 관련 테스트, typecheck, lint, build 통과.

- `f8ffcbf` Harden multilingual product HS normalization
  - 한글, 중국어, 일본어, 혼합언어 품명에서 GPT가 HS4/HS6 후보를 반환하지 못하는 경우를 줄이도록 프롬프트와 파서를 보강했다.
  - GPT 응답의 `hsCandidates`, `hsCodes`, `hs6`, `primaryHsCandidate` 같은 별칭 필드도 읽도록 했다.
  - 검증: 관련 테스트, typecheck, lint, 전체 테스트, build 통과.

## 2026-05-25

### 운영·런칭 준비

- `c0900ef` Add safe lookup telemetry
  - 품명 검색 AI 정규화와 후보 생성 구간에 운영용 telemetry를 추가했다.
  - `LOOKUP_TELEMETRY_ENABLED=true`일 때만 동작한다.
  - 품명 원문, 이메일, 문서 원문, 토큰, API key, prompt는 로그에 남기지 않고 후보 수, duration, provider/model, 입력 형태만 기록한다.
  - 검증: `npm run typecheck`, `npm run lint`, 관련 테스트, 전체 테스트, build 통과.

- `96651d4` Gate business registration live check
  - 기업회원 사업자등록번호는 런칭 전 숫자 10자리 형식만 검증하도록 정리했다.
  - 국세청/공공데이터 사업자 상태조회는 `BUSINESS_REGISTRATION_STATUS_LIVE_ENABLED=true`일 때만 호출한다.
  - 검증: 사업자 상태조회 테스트, auth schema 테스트, typecheck, lint 통과.

- `c5489b7` Paginate developer user listing
  - 개발자 사용자 관리에서 Supabase Auth 사용자 목록을 1,000명까지만 가져오던 제한을 제거했다.
  - Supabase Auth admin listUsers를 페이지 단위로 순회해 더 많은 사용자도 운영 화면에서 볼 수 있게 했다.
  - 검증: typecheck, lint 통과.

- `0f9e3d7` Guard route rate limit policy
  - 로그인, 인증, HS 조회, 문서, 관세계산 경로가 rate limit 보호 대상에서 빠지지 않도록 governance test를 추가했다.
  - 검증: governance test, typecheck 통과.

- `0f85421` Expose lookup health flags
  - 운영 점검 화면에 `LOOKUP_TELEMETRY_ENABLED`, `BUSINESS_REGISTRATION_STATUS_LIVE_ENABLED` 항목을 추가했다.
  - 운영자가 Vercel 환경변수 상태를 앱 내부에서 확인할 수 있게 했다.
  - 검증: typecheck, lint, 전체 테스트, build 통과.

### 품명 검색·HS 후보 UX

- `69cc352` Guard GPT product search contract
  - GPT 품명 검색 프롬프트 계약을 테스트로 고정했다.
  - 다국어, 브랜드명, 모델명, SKU, 오타, HS4/HS6 후보를 다루도록 확인했다.

- `8818f57` Prefer GPT HS code order over local hints
  - 품명 검색에서 GPT가 제시한 HS 후보 순서를 우선하도록 정리했다.
  - 로컬 품명 힌트나 저장 데이터가 GPT 후보를 덮어쓰지 않도록 했다.

- `ddd42b9` Clarify stored HS candidate wording
  - “관세청 HS부호검색 저장본”처럼 사용자가 공식 확정으로 오해할 수 있는 문구를 완화했다.
  - 표시 문구를 “저장 HS 검색 데이터”로 바꿨다.
  - 검증: HS candidate service 테스트, governance test, typecheck, lint 통과.

### 사용자·보안·권한

- `9cf8296` Harden recent user data RLS
  - `hs_favorites`, `account_access_events` 등 최근 사용자 데이터 RLS를 강화했다.
  - 계정 접속 이벤트는 service role만 쓸 수 있게 정리했다.
  - 원격 Supabase migration 적용 완료.

- `9b4b3fa` Audit password update events
  - 비밀번호 변경 이벤트를 감사 로그에 남기도록 추가했다.
  - 원격 Supabase migration 적용 완료.

- `a75b520` Show company IP usage in user management
  - 기업회원 접속 IP 사용 현황을 개발자 사용자 관리 화면에서 볼 수 있게 했다.

### 문서·작업 분리

- `1d01f98` Gate deferred document upload
  - 문서 업로드는 일반 사용자에게 숨기고 개발자에게만 내부 테스트 패널을 노출했다.
  - XLS/OCR/worker 준비 전까지 런칭 동선에서 제외했다.

- `7c967d6` Add operations snapshot refresh
  - 운영 화면에서 dashboard metrics와 목적국 데이터 커버리지 materialized view를 refresh하는 service-role RPC와 UI를 추가했다.
  - 원격 Supabase migration 적용 완료.

- `b50e997` Update launch roadmap
  - 런칭 전 작업 목록을 현재 방향성에 맞게 갱신했다.

### 해외 HS·목적국 데이터

- `7e8f155` Track overseas lookup history
  - 해외 HS 조회도 최근 조회 이력에 남기도록 추가했다.
  - 대시보드 최근 조회에서 수출 목적국 조회는 `/hs/overseas`로 이동하도록 처리했다.

- `f9702c3` Summarize destination coverage status
  - 목적국 데이터 커버리지 요약 카드를 추가했다.
  - 대시보드가 아니라 운영 영역에서 국가별 데이터 보강 상태를 확인하는 방향으로 정리했다.

## Verification Baseline

### 적하목록 조회·상태 알림

- API001 화물통관진행정보 조회 화면을 추가했다.
  - `/cargo`에서 화물관리번호, Master B/L, House B/L 중 하나로 조회한다.
  - 조회 결과는 현재 상태와 진행 이력으로 분리해 표시한다.
- 사용자가 여러 건의 적하목록 감시를 등록할 수 있게 했다.
  - 활성 감시는 화면 상단에 로우 데이터 형태로 노출한다.
  - 각 감시 행에서 `감시 해제하기`로 즉시 중지할 수 있다.
- 1분 단위 감시용 `/api/jobs/cargo-watch` 라우트를 추가했다.
  - Vercel Cron이 매분 호출할 수 있도록 `vercel.json`에 등록했다.
  - 목표 상태에 도달하면 Resend 기반 이메일 알림을 발송한다.
  - 메일 환경변수가 없으면 감시 결과에는 오류 메시지를 남긴다.
- 필요한 운영 환경변수:
  - `CUSTOMS_API_CARGO_PROGRESS_SERVICE_KEY`
  - `RESEND_API_KEY`
  - `NOTIFICATION_FROM_EMAIL`
  - `JOB_WORKER_SECRET` 또는 `CRON_SECRET`

### 운영 공지사항

- 대시보드 공지사항은 `app_notices` 테이블에서 published 항목만 표시한다.
- 작성, 수정, 삭제는 `emptypocket711@gmail.com` 개발자 계정과 `developer` 프로필 역할이 모두 맞을 때만 허용한다.
- 공지 변경은 `app_notice_create`, `app_notice_update`, `app_notice_delete` 감사 로그로 기록한다.
- `popup_enabled` 공지는 대시보드 접속 시 자동으로 열 수 있고, 사용자가 선택하면 브라우저 기준 1일 동안 숨긴다.

### 국내 수입 10자리 조회 스냅샷

- 운영 Supabase에 관세청 품목번호별 관세율표 20260211 데이터를 중복 제거 후 380,229개 published row로 적재했다.
- 10자리 HSK 기준 `domestic_hs_lookup_snapshots` materialized view를 추가했다.
- 스냅샷은 품명, 관세율, 세관장확인 수입요건, 통합공고, 내국세 후보를 HSK10 단위로 미리 묶는다.
- 2026-05-25 기준 커버리지: HSK10 11,327개 중 11,326개 관세율 보유. 누락 1개는 `2424.00-0000 이사화물`.
- 6자리 HS에는 관세율을 추론 표시하지 않고, 10자리 exact 관세율만 사용자 화면에 사용한다.

최근 전체 검증 기준:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

2026-05-25 기준 전체 테스트 결과:

- 52 test files passed
- 246 tests passed
