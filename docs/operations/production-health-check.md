# Production Health Check

HS Finder 운영 배포 전후에 Supabase 스키마가 현재 코드와 맞는지 확인하는 절차다.

## 환경변수 점검

다음 명령은 `.env.local` 또는 shell 환경변수를 읽어 운영 필수값과 주요 선택값의 설정 여부를 확인한다.

```bash
npm run health:env
```

점검 항목:

- Supabase URL, anon key, service role key
- AI 품명검색 provider, OpenAI key, model
- 관세청 OpenAPI, relay, 장치장 key
- KOTRA 공통 OpenAPI key와 무역뉴스 API URL
- Resend 알림 메일과 background job secret
- route rate limit, 반입계 출력, 터미널 helper, 차량 제원조회 제한값

키, 토큰, 비밀번호, DB 접속 문자열 원문은 출력하지 않고 `설정됨`으로만 표시한다.
필수값 누락은 `BLOCKER`, 선택값 누락은 `WARN`으로 표시한다.

전체 운영 점검은 아래 명령으로 실행한다.

```bash
npm run health
```

`health`는 `health:env` 다음 `health:db`를 순서대로 실행한다.

## DB 스키마 점검

다음 명령은 `supabase/migrations` 기준으로 운영 DB를 검사한다.

```bash
npm run health:db
```

점검 항목:

- migration이 생성해야 하는 public 테이블 존재 여부
- migration이 생성하거나 추가해야 하는 컬럼 존재 여부
- 코드가 사용하는 public RPC/function 존재 여부
- RLS 활성화가 선언된 테이블의 실제 RLS 상태

`DATABASE_URL`은 shell 환경변수 또는 `.env.local`에서 읽는다.
비밀번호, API 키, DB 접속 문자열은 출력하지 않는다.

## 결과 기준

- `OK`: 테이블, 컬럼, RPC/function 누락 없음
- `WARN`: 기능은 동작할 수 있으나 보안/운영상 점검 필요
- `BLOCKER`: 운영 기능이 실패할 수 있는 누락 있음

`BLOCKER`가 하나라도 있으면 스크립트는 종료 코드 `1`로 실패한다.
배포 전에는 반드시 `BLOCKER`를 해결해야 한다.

## 운영 화면 점검

개발자 계정으로 로그인한 뒤 `운영 > 운영 점검` 화면에서 다음을 확인한다.

- 필수 환경변수 누락 여부
- 운영 DB 스키마 점검 결과
- 최근 품명 AI 조회 품질 로그
- GPT 호출 성공/실패/미사용 상태
- 후보 품질: 10자리 후보, HS6 예비, 10자리 미확장, 후보 없음
- 반복 이슈 개선 큐 후보: 같은 조회 품질 분류가 최근 로그에서 3회 이상 반복되는지 확인
- 일자별 무결과/GPT 실패/HS6 예비 후보 요약
- route별 실패율과 평균/최대 응답시간

`LOOKUP_TELEMETRY_ENABLED=true`와 `SUPABASE_SERVICE_ROLE_KEY`가 설정되어야 조회 품질 로그가 저장된다.
로그에는 원문 품명, 이메일, 문서 내용, prompt, API key를 저장하지 않는다.

## 외부 연동 실패 점검

반입계 출력, 터미널 원문 이동, 관세청 API001/API012 같은 외부 연동은 사용자 화면에 내부 오류 원문을 그대로 노출하지 않는다.

반입계 출력 실패는 다음 코드로 원인을 구분한다.

- `browser_launch_failed`: 서버에서 Playwright/Chromium 실행 실패
- `terminal_helper_page_stalled`: 터미널 조회 helper 화면에서 실제 원사이트로 이동하지 못함
- `terminal_loading_not_settled`: 외부 터미널 사이트의 로딩 overlay가 사라지지 않음
- `terminal_container_not_confirmed`: 조회 화면에서 컨테이너 번호를 확인하지 못함
- `terminal_detail_not_populated`: 조회 상세 필드가 충분히 채워지지 않음
- `terminal_capture_failed`: 그 외 터미널 캡처 실패

동일 코드가 반복되면 해당 터미널 사이트 구조 변경, 로딩 지연, helper URL 또는 인증/네트워크 문제를 우선 확인한다.

## Production Smoke

배포 후 기본 공개 경로와 보호 페이지 redirect가 살아있는지 확인한다.

```bash
npm run smoke:production -- https://hsfinder.co.kr
```

운영 테스트 계정으로 보호 페이지까지 확인하려면 환경변수를 넣어 실행한다.

```bash
SMOKE_LOGIN_EMAIL=...
SMOKE_LOGIN_PASSWORD=...
npm run smoke:production -- https://hsfinder.co.kr
```

성공 기준은 전체 경로 `success=10 failed=0`이다.

## JSON 출력

CI나 별도 자동화에서 쓰려면 JSON으로 출력한다.

```bash
node scripts/check-production-schema.mjs --json
```

## 이번 장애와의 관계

적하목록 감시 등록 실패 원인은 운영 DB에
`cargo_watch_status_notifications` 테이블이 없었기 때문이다.
이 스크립트는 같은 유형의 누락 테이블/컬럼/RPC 문제를 배포 전에 잡기 위한 용도다.

## 다음 확장 후보

- Vercel/cron/job 실패 이력 저장
- rate limit 초과 이벤트 저장과 운영 화면 노출
- 반입계 출력 실패 코드별 집계
- 관세청 API001/API012 정기 job 성공/실패 이력 표시
