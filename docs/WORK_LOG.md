# Work Log

이 문서는 HS FINDER 개발 중 실제로 수행한 작업, 검증 결과, 커밋을 날짜별로 남긴다.

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
