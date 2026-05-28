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
- 5분 단위 감시용 `/api/jobs/cargo-watch` 라우트를 추가했다.
  - Vercel Cron이 5분마다 호출할 수 있도록 `vercel.json`에 등록했다.
  - 목표 상태에 도달하면 Resend 기반 이메일 알림을 발송한다.
  - 메일 환경변수가 없으면 감시 결과에는 오류 메시지를 남긴다.
- 필요한 운영 환경변수:
  - `CUSTOMS_API_CARGO_PROGRESS_SERVICE_KEY`
  - `RESEND_API_KEY`
  - `NOTIFICATION_FROM_EMAIL`
  - `JOB_WORKER_SECRET` 또는 `CRON_SECRET`
- 2026-05-27 추가 정리:
  - Vercel에서 관세청 38010 포트 호출이 불안정해 API001 전용 Vultr relay를 구성했다.
  - relay health endpoint는 `http://158.247.223.35:8787/health`이며 systemd service 이름은 `hsfinder-cargo-relay`다.
  - API005 장치장정보조회 데이터를 `customs_shed_info`에 적재했다.
  - API005 `ldunPlcSnarYn = Y`는 CY, `N`은 CFS로 분류한다.
  - API001 이벤트의 `shedSgn`을 API005 `shed_code`와 매칭해 `CY 반입`, `CFS 반입` 감시 조건을 지원한다.
  - 감시 등록 시 이미 지나간 목표 상태가 있으면 즉시 메일을 보낸다.
  - API001 `mtTrgtCargYnNm` 관리대상검사여부가 `Y`이면 사용자가 선택한 목표 상태와 관계없이 관리대상검사 안내 메일을 동일 B/L/연도/이메일 기준으로 1회 발송한다.
  - 감시는 메일 발송 성공 시에만 종료한다. 메일 실패 시 active 상태로 유지하고 다음 주기에 재시도한다.
  - 상세 운영 절차는 `docs/CARGO_API001_RUNBOOK.md`를 기준으로 한다.

### 무역 뉴스 자동 수집

- `/trade-news`는 `trade_news_items` DB 캐시를 우선 조회한다.
- `/api/jobs/trade-news` cron job을 추가해 6시간마다 관세청 RSS, KOTRA API, 정책브리핑 RSS, 산업통상부, WTO RSS를 수집한다.
- 뉴스는 `content_hash` 기준으로 중복 저장을 방지한다.
- 원문 링크와 출처는 유지하고, 카드에는 짧은 요약과 국가 필터용 국가명을 저장한다.

### 자동차 제원 조회

- `/vehicle-spec` 페이지를 추가했다.
- 사용자가 제원관리번호를 입력하면 한국교통안전공단 사이버검사소 자동차 제원조회 화면을 서버에서 보조 호출한다.
- 자동차(`specType=CAR`) 기준으로 조회하고 제작사, 차명, 형식, 용도, 차종, 중량, 연료, 배기량 등 응답 필드를 요약 표시한다.
- CyberTS는 별도 계약 API가 아니라 화면 기반 조회이므로 보안 정책이나 화면 구조 변경 시 실패할 수 있다.
- 결과 화면에는 CyberTS 원문 링크와 조회시각을 표시한다.
- 2026-05-27 샘플 제원관리번호 `A08-1-00123-0042-1221` 직접 호출 점검 결과, CyberTS가 서버 자동 POST 요청을 `잘못된 접근`으로 처리하는 케이스를 확인했다.
- 앱에서는 이 경우 JSON 파싱 오류가 아니라 `CyberTS 보안 정책 제한` 안내로 노출한다.
- 조회는 rate limit과 캐시를 적용한다.

### 중고차 수출 컨테이너 확인

- `/used-car-export` 상위 메뉴를 추가하고 하위 메뉴로 차량 제원정보 조회와 컨테이너 반입 확인을 분리했다.
- `/used-car-export/container-check`는 컨테이너 번호를 입력하면 운송현황을 먼저 조회한다.
- 운송현황 최신 이력의 터미널명과 터미널코드로 최종 반입지를 판단한다.
  - 한진인천컨테이너터미널: 원문 자동 POST 조회 지원
  - 선광신컨테이너터미널: 원문 자동 POST 조회 지원
  - 인천컨테이너터미널: 원문 자동 POST 조회 지원
  - 인천항국제페리부두: Nexacro `nxCtr.do` 직접 조회 기반 요약 표시와 원문 사이트 연결 지원
  - BNCT: JSON 조회 엔드포인트 기반 요약 표시와 원문 사이트 연결 지원
  - 평택컨테이너터미널: JSON 조회 엔드포인트 기반 요약 표시와 `cntrNo` 원문 URL 연결 지원
  - 평택동방아이포트: 메인 WebBrowser 내부 `Container 양하예정시간 조회` 엔드포인트 기반 요약 표시와 원문 URL 연결 지원
- 운송현황 최신 상태가 `반출`이면 “아직 최종 반입지에 반입이 되지 않았습니다” 안내를 표시한다.
- 운송현황 조회 결과가 없으면 컨테이너 번호 오류 또는 이미 선적된 컨테이너 가능성을 안내한다.
- 2026-05-28 샘플 `TBJU7406466` 확인 결과 운송현황 최신 이력은 `인천신국제여객터미널 / IFPCC / 반입완료`로 식별된다.
- IFPC는 `guest` 세션 로그인 후 `isu_010Qry.selectContainerDup`로 수출/수입 중복 구분값을 받고, `isu_010Qry.selectContainer` 상세 조회를 직접 호출한다. 상세 결과가 없을 때만 운송현황 최신 이력 요약으로 대체한다.
- 컨테이너 조회 결과는 화면 내 로우 데이터 요약을 기본으로 유지하고, 사용자가 `원문 화면 보기`를 누를 때만 원문 팝업을 연다.
- `반입계 출력`은 Playwright 기반 API에서 실제 터미널 조회 화면을 렌더링해 PNG로 다운로드한다. IFPC는 원사이트를 직접 열어 컨테이너 번호 입력 후 조회 버튼을 눌러 캡처하는 방식으로 검증했다.
- 2026-05-28 샘플 `UETU6784452` 확인 결과 운송현황 최신 이력은 `인천컨테이너터미널 / ICTPC / 반입완료`로 식별된다.
- 인천컨테이너터미널은 `https://service.psa-ict.co.kr/webpage/general/contInfo.jsp` 구형 JSP 조회를 사용한다.
- BNCT는 `https://info.bnctkorea.com/esvc/cntr/cntrSrch/search?CNTR_NO=` JSON 조회를 사용한다. 샘플 컨테이너가 없어 실제 운영 컨테이너 검증은 추후 필요하다.
- 평택컨테이너터미널은 `http://www.pctc21.com/esvc/cntr/info2/data?cntrNo=` JSON 조회를 사용한다. 원문 화면은 `cntrNo` URL 파라미터 자동 검색을 지원한다.
- 평택동방아이포트(PNCT) `http://www.pnct.co.kr/infoservice/index.html`는 Nexacro 단일 앱 구조다. Playwright 조사로 팝업 공지 닫기 후 메인 화면의 `Container 양하예정시간 조회` 입력창이 `http://www.pnct.co.kr/infoservice/jsp/main/mainPage_SteveTime.jsp?cntrNo=`를 호출하는 것을 확인했다.
- PNCT는 현재 해당 양하예정시간 조회 엔드포인트를 직접 호출한다. 전체 `컨테이너 조회` 메뉴(`C006M129`)의 상세 항목은 추가 XFDL/트랜잭션 추적이 필요하다.

### 품명 AI 검색 보강

- GPT 정규화 cache version을 `product-search-normalization-v14`로 올렸다.
- GPT가 성공 응답을 반환했지만 HS 후보가 비어 있는 경우, 한 번 더 단순한 “이 품명 HS CODE가 뭘까” 인터뷰어 방식으로 재질문한다.
- 분기 질문이 필요한 품명이라도 넓은 HS4/HS6 방향이 유용하면 예비 후보를 표시하고, 필요한 보완 정보는 질문으로 남긴다.
- 명확한 단일 후보가 있는 경우에는 약한 대안 후보를 더 강하게 줄여 사용자 혼란을 낮춘다.

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

### HS 통합조회 다국어 2차

- 해외 HS 조회 결과 테이블과 수입국 HS 상세 화면의 헤더, 빈 상태, 매칭 라벨을 `hs-direct` dictionary로 추가 분리했다.
- 목적국 품명, 세율, 내국세, 수입요건 등 공식 데이터 값은 그대로 유지하고, 화면 chrome만 한국어/영어/중국어로 전환한다.
- 수입국 요건/내국세가 표시되지 않는 경우에도 “없음”으로 단정하지 않고 “표시할 데이터가 없음” 수준의 표현을 유지했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm test -- lib/i18n/documents.test.ts`
- `npm run build`
- `npm run lint`
- `npm test`
- `npm test -- lib/i18n/report-preview.test.ts`
- `npm run build`
- `npm run lint`
- `npm test`
- `npm test -- lib/i18n/diagnosis.test.ts`
- `npm run build`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm test`
- `npm test -- lib/i18n/used-car-export.test.ts`
- `npm run build`
- `npm run lint`
- `npm test`
- `npm test -- lib/i18n/used-car-export.test.ts`
- `npm run build`
- `npm run lint`
- `npm test -- lib/i18n/hs-direct.test.ts`
- `npm test`
- `npm run build`

### HS 통합조회 다국어 3차

- 수입 10자리 상세 화면의 품목 기본정보, 내국세, 표준품명, 수입요건, 신고품명 통계 섹션 chrome을 `hs-direct` dictionary로 추가 분리했다.
- 세율, 공식 품명, 요건명, 법령명, 기관명, 신고품명 통계값은 원문 데이터로 유지한다.
- 수입요건 빈 상태는 “요건 없음”으로 단정하지 않고 통합공고·개별법령·표시·인증·유통규제 가능성을 계속 안내한다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test -- lib/i18n/hs-direct.test.ts`
- `npm test`
- `npm run build`

### HS 통합조회 다국어 4차

- 한국 수출 기준 조회 결과의 기본정보, 목적국 연결 폼, 수출요건, 전략물자/수출통제, FTA C/O 섹션 chrome을 dictionary로 분리했다.
- 수출통제 결과는 계속 예비 스크리닝으로만 표시하며 “필요 가능성 있음” 수준의 표현을 유지한다.
- 수출요건명, 법령명, 기관명, 전략물자 키워드, 원산지증빙 값은 데이터 원문으로 유지한다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test -- lib/i18n/hs-direct.test.ts`
- `npm test`
- `npm run build`

### 예상 납세액 산출 다국어 1차

- 예상 납세액 산출 페이지와 계산 패널의 주요 UI chrome을 `duty-estimator` dictionary로 분리했다.
- HS 조회에서 전달된 세율, 내국세명, FTA 후보 라벨, 서버 액션 응답 메시지는 원문 데이터 또는 기존 응답값으로 유지했다.
- 결과 복사 문구의 기본 라벨도 locale별로 분리하되, 납세액은 계속 “예상/estimate” 표현을 사용한다.
- dictionary 누락과 영어권 단정 표현을 방지하는 테스트를 추가했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test -- lib/i18n/duty-estimator.test.ts`
- `npm test`
- `npm run build`

### 진입 화면 다국어 1차

- `/entry` 조회 시작 화면의 제목, 설명, 주요 업무 카드 4개를 `entry` dictionary로 분리했다.
- 화면마다 같은 workflow 순서가 유지되도록 dictionary 테스트를 추가했다.
- 각 카드의 링크와 아이콘은 기존 구조를 유지하고, 표시 chrome만 locale별로 전환한다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test -- lib/i18n/entry.test.ts`
- `npm test`
- `npm run build`

### 무역 뉴스 다국어 1차

- `/trade-news` 페이지 제목, 설명, hero, 국가 필터, 카테고리 카드, 빈 상태, 원문 열기 버튼 chrome을 `trade-news` dictionary로 분리했다.
- 뉴스 제목, 원문 URL, 출처명, 국가명 등 수집 데이터는 자동 번역하지 않는다.
- WTO와 일반 뉴스의 기본 요약 fallback만 locale별 문구로 표시한다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test -- lib/i18n/trade-news.test.ts`
- `npm test`
- `npm run build`

2026-05-25 기준 전체 테스트 결과:

- 52 test files passed
- 246 tests passed

## 2026-05-29 작업 기록

### 병렬 에이전트 점검 및 성능·안정화

- 백엔드, AI 검색, UI, QA 관점으로 나누어 병렬 리뷰를 진행했다.
- 반입계 다운로드는 실제 터미널 조회 화면을 계속 사용하되, 캡처 전 1초 간격으로 화면 준비 여부를 확인하도록 바꿨다.
- 반입계 PNG는 세로 전체 페이지 캡처 대신 1680x1050 가로형 뷰포트 캡처로 변경했다.
- 반입계 출력 버튼은 생성 경과 초를 표시해 사용자가 진행 여부를 볼 수 있게 했다.
- Playwright/외부 사이트 내부 오류 원문은 사용자에게 직접 노출하지 않고, 사용자 문구는 고정 안내로 정리했다.

### 품명 AI 검색 보강

- GPT가 단일 후보를 높은 확신으로 제시한 경우 최종 후보를 1개로 집중한다.
- 분기 정보가 부족한 경우에는 넓은 HS 후보와 최소 보완 질문을 유지한다.
- Supabase 공식 데이터 검색 경로를 `hs_master`, `customs_hs_code_search_items`, `standard_product_names`까지 확장했다.
- 한글·중국어·일본어 2글자 품명 단서도 검색어로 인정해 짧은 원어 품명 검색 실패 가능성을 낮췄다.
- GPT 후보가 있는데 공식 HSK exact row가 없어서 화면이 비는 케이스를 방지하는 테스트를 추가했다.

### 관부가세 계산기·환율

- HS 10자리 조회 화면에서 선택한 수입국가와 FTA/협정 후보 라벨을 관부가세 계산기로 넘긴다.
- 계산기에서 HS 조회 화면으로 돌아갈 때도 수입국가와 기준일을 유지한다.
- 차주 환율이 아직 DB에 없으면 “차주 관세환율은 아직 저장되지 않았습니다”로 명확히 안내한다.
- 저장 환율을 적용할 때 조회기준일 이전 최신 고시일이면 해당 날짜를 함께 표시한다.

### 적하목록 감시 메일 중복 방지

- `cargo_watch_status_notifications` 테이블을 추가해 동일 조회값, 목표상태, 이메일 기준 상태 알림 메일 발송 이력을 기록한다.
- 감시 등록 즉시 이미 목표 상태를 지난 건도 동일 조건 발송 이력이 있으면 새 메일을 생략한다.
- cron 감시 작업에서도 `sending/sent` claim 구조를 사용해 동시 실행이나 재시작 상황의 중복 메일 발송을 줄인다.
- 메일 발송 실패 시 claim을 해제해 다음 주기에 재시도할 수 있게 했다.

### 운영·UI

- 운영 점검 화면의 조회 품질 로그에 정상/점검/무결과 요약을 추가했다.
- 개발자 유저 관리 화면은 운영 권한 수, 필터 적용 여부, 권한 badge, 최근 로그/IP 요약을 더 잘 보이게 정리했다.
- 대시보드 공지사항은 본문 미리보기와 최근 공지 건수를 표시한다.
- HS 조회 진행 메시지는 수출 목적국 조회와 일반 HS 조회를 구분해 표시한다.

### 검증

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

2026-05-29 기준 전체 테스트 결과:

- 53 test files passed
- 286 tests passed

### 다국어 1차 기반

- 공통 locale을 `ko-KR`, `en-US`, `zh-CN`으로 정의했다.
- 헤더와 사이드 내비게이션은 공통 chrome dictionary를 통해 한국어, 영어, 중국어 간 전환할 수 있다.
- 선택 언어는 `hsfinder_locale` 쿠키에 저장하고, `profiles.preferred_locale` 컬럼이 적용된 환경에서는 프로필에도 best effort로 저장한다.
- 루트 레이아웃의 `<html lang>` 값을 선택 언어에 맞춰 변경한다.
- AI/법적 안전문구는 별도 dictionary helper로 분리해 “예비진단”, “확정 아님”, “검토 필요” 흐름을 유지한다.
- 프로필 언어 컬럼용 Supabase migration `20260529002000_profile_preferred_locale.sql`을 추가했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test -- lib/i18n/locales.test.ts lib/i18n/hs-finder-locale.test.ts`

### 대시보드 다국어 확장

- 대시보드 hero, 통합 검색 폼, 공지사항 chrome, 바로가기, 즐겨찾기, 최근 검색, 적하목록 감시 카드의 UI 문구를 dashboard dictionary로 분리했다.
- 공지사항 제목과 본문은 운영자가 작성한 원문 콘텐츠이므로 자동 번역하지 않고, 카테고리·버튼·빈 상태 등 chrome만 locale별로 표시한다.
- 진행 게이지는 `<html lang>` 기준으로 한국어, 영어, 중국어 메시지를 표시하도록 확장했다.
- 인증 app layout과 dashboard page는 `profiles.preferred_locale`이 있으면 이를 우선 사용하고, 없으면 쿠키/브라우저 언어로 fallback한다.
- “예상 납세액 계산”처럼 확정 산출로 읽힐 수 있는 dashboard 문구는 “예상 납세액 산출”, “입력값 기준 예비 산출”로 완화했다.
- 대시보드 dictionary 누락과 영어권 단정 표현을 방지하는 테스트를 추가했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test -- lib/i18n/dashboard.test.ts lib/i18n/locales.test.ts lib/i18n/hs-finder-locale.test.ts`

### HS 통합조회 다국어 1차

- HS 통합조회와 해외 HS 조회의 페이지 제목, 설명, 검색 폼, 기준일 옵션, 품명 후보 카드, 주요 상세 섹션 chrome을 `hs-direct` dictionary로 분리했다.
- HS 코드, 공식 품명, 법령명, 기관명, source data는 원문 신뢰도를 위해 자동 번역하지 않는다.
- 해외 HS 조회 화면도 같은 dictionary를 사용하되, 페이지 제목과 설명은 목적국 조회 흐름에 맞는 별도 문구를 사용한다.
- 영어/중국어 화면에서도 조회 로직, 최근 검색 저장, 즐겨찾기, 관세율/요건 조회 로직은 변경하지 않았다.
- HS direct dictionary 누락과 영어권 단정 표현을 방지하는 테스트를 추가했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

### 적하목록 조회 다국어 1차

- `/cargo` 페이지 제목, 조회 폼, 현재 상태 요약, 진행 이력, 감시 등록, 내 알림 감시 UI chrome을 `cargo` dictionary로 분리했다.
- 감시 목표 상태 라벨은 한국어, 영어, 중국어 화면에서 각각 표시되도록 매핑했다.
- 관세청 응답 메시지, 진행 상태 원문, 화물 이벤트 데이터는 원문 신뢰도를 위해 자동 번역하지 않는다.
- Cargo dictionary 누락과 영어권 단정 표현을 방지하는 테스트를 추가했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm test -- lib/i18n/cargo.test.ts`
- `npm run build`

### 중고차 수출 화면 다국어 1차

- `/used-car-export` 개요, 제원정보 조회, 컨테이너 반입 확인 페이지의 제목, 탭, 조회 폼, 결과 영역, 안내 문구 UI chrome을 `used-car-export` dictionary로 분리했다.
- 제원조회와 컨테이너 조회의 외부 사이트 응답값, 터미널명, 원문 데이터는 자동 번역하지 않고 그대로 표시한다.
- 반입계 이미지 파일명 접미사와 출력 진행 문구도 locale별로 분리했다.
- Used-car export dictionary 누락 방지 테스트를 추가했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm test -- lib/i18n/used-car-export.test.ts`
- `npm run build`

### Locale 해석 helper 정리

- `resolveCurrentUserLocale` helper를 추가해 쿠키/브라우저 언어와 `profiles.preferred_locale` fallback 흐름을 공통화했다.
- 관부가세 계산기, 통합 진입점, 무역뉴스, 적하목록 조회, 중고차 수출 페이지의 반복된 locale 해석 코드를 제거했다.
- 이미 user id를 확보한 화면은 같은 helper에 user id를 넘겨 Supabase Auth 조회를 중복하지 않도록 했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

### 수입·수출 진단 화면 다국어 1차

- `/diagnosis/import`와 `/diagnosis/export`의 페이지 제목, 조회 폼, 빈 상태, 결과 헤더, 섹션명, 테이블 헤더 UI chrome을 `diagnosis` dictionary로 분리했다.
- HS 코드, 품명, 법령, 기관, 출처, 요건 설명, mock/source 데이터는 원문 신뢰도를 위해 자동 번역하지 않는다.
- 수출통제의 “필요 가능성 있음” 문구도 locale별 dictionary로 분리해 법적 확정 표현을 피한다.
- Diagnosis dictionary 누락과 영어권 단정 표현을 방지하는 테스트를 추가했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm test -- lib/i18n/diagnosis.test.ts`
- `npm run build`

### 리포트 미리보기 다국어 1차

- `/reports/preview` 페이지 제목, 담당자 검토 상태, 생성 메타 라벨, Source Locks, 담당자 메모, PDF 출력, 고지사항 UI chrome을 `report-preview` dictionary로 분리했다.
- 보고서 제목, 본문 섹션, source lock 데이터, disclaimer는 생성/원천 데이터이므로 자동 번역하지 않는다.
- 자동 예비진단과 담당자 검토 전 상태 라벨을 locale별로 분리하되 법적 확정 표현은 피했다.
- Report preview dictionary 누락과 영어권 단정 표현을 방지하는 테스트를 추가했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm test -- lib/i18n/report-preview.test.ts`
- `npm run build`

### 선적서류 업로드 페이지 다국어 1차

- `/documents/upload` 페이지 헤더와 일반 사용자에게 보이는 “준비 중” 안내 카드 UI chrome을 `documents` dictionary로 분리했다.
- 개발자 전용 mock extraction preview와 업로드 form 상세 문구는 아직 원문 유지하며, 기능 확장은 하지 않았다.
- Documents dictionary 누락 방지 테스트를 추가했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm test -- lib/i18n/documents.test.ts`
- `npm run build`

### 언어 전환 즉시 반영 수정

- 로그인 후 화면에서 `profiles.preferred_locale`가 locale cookie보다 우선되어 언어 버튼 클릭 직후 기존 언어로 되돌아가던 문제를 수정했다.
- locale cookie를 런타임 기준값으로 두고, Supabase 프로필 저장값은 cookie가 없을 때만 fallback으로 사용하도록 서버 locale 해석 순서를 정리했다.
- 언어 변경 server action이 layout cache를 무효화한 뒤 현재 경로로 돌아가도록 해 헤더와 사이드바가 즉시 다시 렌더되게 했다.
- cookie, profile, Accept-Language 우선순위를 검증하는 `lib/i18n/server.test.ts`를 추가했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm test -- lib/i18n/server.test.ts lib/i18n/locales.test.ts`
- `npm run build`
