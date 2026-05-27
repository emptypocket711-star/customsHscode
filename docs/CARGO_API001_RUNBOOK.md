# API001 적하목록 조회·감시 런북

Last updated: 2026-05-27

이 문서는 다음 세션에서 적하목록 조회, CY/CFS 반입 감시, API001 relay, API005 장치장 데이터 작업을 바로 이어가기 위한 운영 메모다.

## 현재 완료 상태

- `/cargo` 화면에서 House B/L, Master B/L, 화물관리번호로 API001 화물통관진행정보를 조회한다.
- House B/L 입력칸에는 실제 B/L 예시를 넣지 않는다.
- 사용자는 여러 건의 감시를 등록할 수 있다.
- 감시 대상은 개인/회사별 `cargo_watch_requests` row로 저장된다.
- 활성 감시는 화면 상단에 로우 형태로 표시되고, `감시 해제하기`로 중지한다.
- 목표 상태 도달 시 Resend로 이메일을 발송한다.
- 이메일 발송 성공 시에만 감시가 종료된다.
- 목표 상태는 이미 지나간 이벤트도 감지한다. 감시 등록 시점에 즉시 API001을 조회하고, 이미 목표 상태가 있으면 즉시 메일을 보낸다.
- 메일 발송 실패 시에는 감시를 종료하지 않고 `active`로 유지해 다음 cron 주기에 재시도한다.
- 상태 배지는 사용자 화면에서 `active`, `matched` 대신 `감시중`, `메일 발송 완료`, `감시 해제` 등 한글로 표시한다.
- 2026-05-27 기준 개발자 메일 `emptypocket711@gmail.com`으로 Resend 테스트 메일 수신 확인 완료.

## 주요 파일

- 사용자 화면: `features/cargo/cargo-tracking-panel.tsx`
- 적하목록 페이지: `app/(app)/cargo/page.tsx`
- 대시보드 감시 카드: `features/dashboard/dashboard-home.tsx`
- 조회·감시 server action: `server/actions/cargo-tracking.actions.ts`
- cron job route: `app/api/jobs/cargo-watch/route.ts`
- 관세청 API 공통 클라이언트: `server/integrations/customs/customs-api.ts`
- CY/CFS 상태 분류: `server/services/cargo-status-classifier.ts`
- 감시 상태 옵션: `lib/cargo-watch-status.ts`
- API001 relay: `relays/cargo-progress-relay/server.mjs`
- API005 장치장 seed 생성: `scripts/generate_customs_shed_info_seed.py`
- API005 연계가이드 추출본: `docs/source-extracts/MYC_OpenAPI_guide_v3.7.txt`

## Supabase 테이블

### `cargo_watch_requests`

Migration:

- `supabase/migrations/20260526002000_cargo_watch_requests.sql`
- `supabase/migrations/20260526002100_cargo_watch_bl_year.sql`

중요 컬럼:

- `cargo_management_no`
- `master_bl_no`
- `house_bl_no`
- `bl_year`
- `target_status`
- `notify_email`
- `status`
- `last_status`
- `last_checked_at`
- `next_check_at`
- `matched_at`
- `notified_at`
- `last_error`

상태 의미:

- `active`: 아직 메일 발송이 끝나지 않은 감시. cron 조회 대상.
- `matched`: 목표 상태 도달 후 메일 발송 성공. 더 이상 조회하지 않음.
- `cancelled`: 사용자가 감시 해제.
- `error` 또는 `paused`: 향후 확장용.

종료 규칙:

- 목표 상태 도달만으로는 종료하지 않는다.
- `sendTransactionalEmail`이 성공해야 `status = matched`, `notified_at` 기록, `next_check_at = null`로 종료한다.
- 메일 실패 시 `status = active`, `last_error = 목표 상태 도달 확인, 메일 발송 실패: ...`, `next_check_at`을 다음 주기로 유지한다.

### `customs_shed_info`

Migration:

- `supabase/migrations/20260527001000_customs_shed_info.sql`
- `supabase/migrations/20260527002000_customs_shed_info_unloading_flag.sql`

Source:

- 관세청 MYC OpenAPI `API005 장치장정보조회`
- endpoint: `https://unipass.customs.go.kr:38010/ext/rest/shedInfoQry/retrieveShedInfo`
- guide extract: `docs/source-extracts/MYC_OpenAPI_guide_v3.7.txt`

중요 컬럼:

- `shed_code`: API001 이벤트의 `shedSgn`과 매칭
- `shed_name`
- `customs_office_code`
- `unloading_place_bonded_area_yn`: API005 `ldunPlcSnarYn`
- `facility_type`: `cy`, `cfs`, `terminal`, `bonded_warehouse`, `airport`, `other`, `unknown`
- `facility_type_source`: `unloading_place_flag`, `auto_name_rule`, `manual`, `unclassified`
- `source_name`, `source_url`, `source_version`, `effective_from`, `effective_to`, `retrieved_at`, `status`, `checksum`

2026-05-27 적재 결과:

- 총 3,427건
- 주소 있음 3,241건
- 전화번호 있음 3,027건
- `ldunPlcSnarYn = Y` -> `facility_type = cy`: 896건
- `ldunPlcSnarYn = N` -> `facility_type = cfs`: 2,531건

현재 사용자 정의 규칙:

- 부두직통관 `Y`는 CY로 본다.
- 부두직통관 `N`은 CFS로 본다.
- 따라서 이름 기반 `CFS`, `CY` 판정은 보조 기준으로만 사용한다.

## CY/CFS 반입 판정

API001 이벤트 파싱 결과:

- `event.status`: 관세청 진행 상태명
- `event.shedCode`: `shedSgn`
- `event.shedName`: `shedNm`

분류 흐름:

1. API001 조회 결과의 이벤트 목록에서 `shedCode`를 모은다.
2. `customs_shed_info.shed_code`와 매칭한다.
3. 매칭 row의 `unloading_place_bonded_area_yn`을 우선 사용한다.
4. `Y`면 `CY 반입`, `N`이면 `CFS 반입` 후보를 생성한다.
5. 원문 상태가 `반입완료`이면 화면에는 `CY 반입완료`, `CFS 반입완료`처럼 표시한다.
6. 감시 매칭은 `CY 반입`이 `CY 반입완료`에 포함되어도 성공으로 본다.

관련 함수:

- `loadCargoShedInfoByCode`
- `classifyCargoEventStatus`
- `buildCargoStatusCandidates`
- `enrichCargoProgressResultWithShedInfo`
- `statusMatched`

## 감시 상태 옵션

정의 파일:

- `lib/cargo-watch-status.ts`

현재 옵션:

- `적하목록 제출`
- `입항보고`
- `하선신고 수리`
- `CY 반입`
- `CFS 반입`
- `반입`
- `수입신고`
- `수입신고수리`
- `반출`

기본 선택값:

- `CY 반입`

## API001 조회 입력 규칙

사용자 입력 필드:

- House B/L
- Master B/L
- 화물관리번호
- B/L 연도

실무상 House B/L 조회 빈도가 높아 House B/L 필드를 가장 앞에 둔다.

서버 입력 변환:

- `readCargoInput`이 화물관리번호 칸에 15자리 미만 값이 들어오고 Master/House가 비어 있으면 House B/L로 간주한다.
- House B/L 또는 Master B/L 조회에는 `blYear`가 필요하다.
- 화물관리번호는 15자리 이상이면 `cargMtNo`로 조회한다.

API001 query parameter:

- `cargMtNo`
- `mblNo`
- `hblNo`
- `blYy`

## API001 relay 구조

문제:

- Vercel에서 `unipass.customs.go.kr:38010` 호출 시 `ECONNRESET`, `outbound_port`, `520/525` 류 오류가 발생할 수 있다.
- 로컬에서는 정상이어도 Vercel serverless outbound에서 실패할 수 있다.

현재 해결:

- Vultr Ubuntu VPS에 Node relay를 올려 API001 호출만 우회한다.
- Vercel은 관세청 38010 포트를 직접 호출하지 않고 relay URL을 호출한다.

Vultr 정보:

- provider: Vultr
- region: Seoul, KR
- OS: Ubuntu 24.04 LTS x64
- public IPv4: `158.247.223.35`
- app directory: `/opt/hsfinder-cargo-relay`
- service: `hsfinder-cargo-relay`
- env file: `/etc/hsfinder-cargo-relay.env`
- port: `8787`
- health: `http://158.247.223.35:8787/health`
- cargo endpoint: `http://158.247.223.35:8787/cargo-progress`

Vultr 확인 명령:

```bash
systemctl status hsfinder-cargo-relay --no-pager
journalctl -u hsfinder-cargo-relay -n 100 --no-pager
curl http://158.247.223.35:8787/health
```

Vultr env에 있어야 하는 값:

```text
CUSTOMS_API_CARGO_PROGRESS_SERVICE_KEY=API001_관세청_키
CUSTOMS_API_CARGO_PROGRESS_RELAY_TOKEN=Vercel과_동일한_긴_문자열
PORT=8787
```

비밀값은 repo 문서에 남기지 않는다. 실제 값은 Vultr env와 Vercel env에서 확인한다.

## Vercel 환경변수

API001 조회·감시:

```text
CUSTOMS_API_CARGO_PROGRESS_RELAY_URL=http://158.247.223.35:8787/cargo-progress
CUSTOMS_API_CARGO_PROGRESS_RELAY_TOKEN=Vultr_relay와_동일한_토큰
CUSTOMS_API_CARGO_PROGRESS_SERVICE_KEY=직접호출_fallback용_API001_키
JOB_WORKER_SECRET=cron_route_보호용_비밀값
```

Resend 알림 메일:

```text
RESEND_API_KEY=Resend_API_key
NOTIFICATION_FROM_EMAIL=verified_sender_email
```

API005 seed 생성용 로컬/운영 작업:

```text
CUSTOMS_API_SHED_INFO_SERVICE_KEY=API005_관세청_키
CUSTOMS_API_STATS_CODE_SERVICE_KEY=API019_통계부호내역조회_키
```

주의:

- Vercel env를 바꾸면 production redeploy가 필요하다.
- repo push가 Vercel 자동배포와 연결되어 있으면 `git push origin main` 후 production build가 시작된다.
- 사용자가 “배포는 내가 하랄 때만”이라고 했던 이력이 있으므로, 다음 세션에서는 push/deploy 전에 최신 의사를 확인한다.

## Cron

Route:

- `app/api/jobs/cargo-watch/route.ts`

호출:

- `GET /api/jobs/cargo-watch`
- `POST /api/jobs/cargo-watch`

인증:

- `Authorization: Bearer $JOB_WORKER_SECRET`
- 또는 `x-job-worker-secret: $JOB_WORKER_SECRET`
- 또는 query `?secret=...`

처리 방식:

- `status = active`
- `next_check_at <= now()`
- 최대 25건 조회
- API001 조회
- API005 장치장 DB와 매칭해 CY/CFS 후보 생성
- API001 `mtTrgtCargYnNm` 관리대상검사여부가 `Y`이면 목표 상태 도달 여부와 별개로 관리대상검사 안내 메일을 1회 발송
- 목표 상태 매칭
- 메일 발송 성공 시 종료
- 메일 실패 또는 API 실패 시 `last_error` 기록 후 다음 주기 재시도

## 장애 진단

### 조회 결과 없음

의미:

- API 호출은 성공했지만 관세청 응답에 조회 가능한 화물 정보가 없음.

확인:

- House B/L / Master B/L 오타
- B/L 연도
- 적하목록이 아직 생성되지 않았는지
- HBL이 아니라 MBL로 조회해야 하는 건인지

### `outbound_port` / `ECONNRESET`

의미:

- Vercel에서 관세청 38010 포트 직접 호출 실패 가능성.

확인:

- Vercel env `CUSTOMS_API_CARGO_PROGRESS_RELAY_URL`
- relay health
- Vultr service status

### `API001 relay 호출 실패`

확인:

- relay URL이 `/cargo-progress`까지 포함되어 있는지
- relay token 일치 여부
- Vultr에서 직접 관세청 API 호출 가능한지
- `journalctl -u hsfinder-cargo-relay`

### 메일 미발송

확인:

- Vercel env `RESEND_API_KEY`
- Vercel env `NOTIFICATION_FROM_EMAIL`
- Resend domain verification
- Resend dashboard activity
- `cargo_watch_requests.last_error`

정상 동작:

- 메일 성공: `status = matched`, `notified_at` not null
- 메일 실패: `status = active`, `last_error` 기록, 다음 주기에 재시도

## API005 장치장 데이터 갱신 절차

전제:

- `.env.local` 또는 shell env에 `CUSTOMS_API_SHED_INFO_SERVICE_KEY`, `CUSTOMS_API_STATS_CODE_SERVICE_KEY`, `DATABASE_URL`이 있어야 한다.
- API019 `A09` 세관코드를 이용해 전체 관할세관을 순회한다.

seed 생성:

```bash
CUSTOMS_API_SHED_INFO_SERVICE_KEY='...' \
CUSTOMS_API_STATS_CODE_SERVICE_KEY='...' \
python3 scripts/generate_customs_shed_info_seed.py
```

DB 적용:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260527001000_customs_shed_info.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260527002000_customs_shed_info_unloading_flag.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/seed/generated/customs_shed_info_api005_seed.sql
```

검증:

```sql
select unloading_place_bonded_area_yn, facility_type, facility_type_source, count(*)
from public.customs_shed_info
group by unloading_place_bonded_area_yn, facility_type, facility_type_source
order by unloading_place_bonded_area_yn nulls last, facility_type;
```

2026-05-27 정상 기대값:

```text
N | cfs | unloading_place_flag | 2531
Y | cy  | unloading_place_flag | 896
```

## 검증 명령

적하목록 관련 변경 후 최소 검증:

```bash
npm run typecheck
npm run lint
npm run test -- server/services/cargo-status-classifier.test.ts server/integrations/customs/customs-api.test.ts
```

여유가 있으면:

```bash
npm test
npm run build
```

## 최근 관련 커밋

- `06c895a Add customs shed info ingest`
  - API005 장치장 migration, guide extract, seed script 추가
- `53abd85 Classify shed info by unloading flag`
  - `ldunPlcSnarYn = Y/N` 기준으로 CY/CFS 재분류
- `f44ada2 Add CY CFS cargo watch matching`
  - 감시 옵션에 CY/CFS 반입 추가
  - API001 이벤트와 API005 장치장 매칭
  - 이미 지나간 목표 상태 즉시 메일 발송
- `858133f End cargo watch after email delivery`
  - 메일 발송 성공 시에만 감시 종료
  - 메일 실패 시 active 유지 후 재시도

## 다음 작업 후보

1. 운영 Vercel에서 API001 relay env 최종 확인
2. production에서 House B/L 조회 스모크 테스트
3. production에서 `CY 반입`, `CFS 반입` 감시 등록 테스트
4. 메일 실패 재시도 케이스 테스트
5. 감시 중복 등록 방지
6. 감시 상세 이력 테이블 추가
7. 대시보드에는 active 감시만 노출할지, 최근 완료 감시도 노출할지 UX 결정
8. Vultr 방화벽/ufw 최소 설정 및 root password rotation
9. relay를 `api.hsfinder.co.kr` 같은 HTTPS 도메인으로 전환
10. relay health check 또는 uptime monitor 추가
