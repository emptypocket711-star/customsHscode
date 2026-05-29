# 배포 런북

## 1. Supabase

1. Supabase 프로젝트를 생성한다.
2. SQL editor 또는 CLI로 `supabase/migrations` 전체를 순서대로 적용한다.
3. `DATABASE_URL`을 준비한 뒤 lookup seed를 적용한다.

```bash
APPLY_MIGRATIONS=1 DATABASE_URL='postgresql://postgres:...@...:5432/postgres' npm run db:apply-lookup-seeds
```

4. 대시보드 통계는 배포 후 한 번 갱신한다.

```sql
select public.refresh_dashboard_metrics(current_date);
```

또는 로컬/CI에서 DB 접속 문자열을 지정해 실행한다.

```bash
DATABASE_URL='postgresql://postgres:...@...:5432/postgres' npm run db:refresh-dashboard-metrics
```

운영 화면에서는 개발자 계정으로 `/legal-updates`에 접속해 `운영 집계 갱신` 버튼을 누르면 `refresh_dashboard_metrics`와 목적국 커버리지 materialized view를 함께 갱신한다.

## 2. Vercel 환경변수

필수:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AI_PROVIDER=openai`
- `OPENAI_API_KEY`
- `OPENAI_MODEL=gpt-5.4-mini`
- `OPENAI_PRODUCT_SEARCH_TIMEOUT_MS=12000`

권장:

- `OPENAI_CLARIFICATION_TIMEOUT_MS=2000`
- `RATE_LIMIT_ENABLED=true`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `JOB_WORKER_SECRET`
- `NEXT_PUBLIC_APP_URL`

초기 런칭에서는 아래 값을 유지한다.

- `CUSTOMS_API_PRODUCT_SEARCH_LIVE_ENABLED=false`
- `BACKGROUND_JOBS_ENABLED`는 worker/cron 준비 전까지 미설정 또는 `false`

적하목록 조회·알림 기능을 켤 때 추가:

- `CUSTOMS_API_CARGO_PROGRESS_RELAY_URL`
- `CUSTOMS_API_CARGO_PROGRESS_RELAY_TOKEN`
- `CUSTOMS_API_CARGO_PROGRESS_SERVICE_KEY`
- `JOB_WORKER_SECRET`
- `RESEND_API_KEY`
- `NOTIFICATION_FROM_EMAIL`

무역 뉴스 KOTRA OpenAPI를 켤 때 추가:

- `KOTRA_OPENAPI_SERVICE_KEY`
- `KOTRA_OVERSEAS_MARKET_NEWS_URL=https://apis.data.go.kr/B410001/kotra_overseasMarketNews/ovseaMrktNews/ovseaMrktNews`
- `KOTRA_USA_GLOBAL_ISSUE_URL=https://apis.data.go.kr/B410001/usaGlobalIssueMonitoring/getUsaGlobalIssueMonitoring`
- `KOTRA_TRADE_FRAUD_CASE_URL=https://apis.data.go.kr/B410001/cmmrcFraudCase/cmmrcFraudCase`

KOTRA 뉴스 API는 공공누리 제4유형(출처표시, 상업적 이용금지, 변경금지) 조건이므로 원문 링크와 출처 표시를 유지한다.
해외시장뉴스 API는 본문을 함께 받기 위해 `search8=Y`를 사용한다.
뉴스 자동 수집은 `/api/jobs/trade-news`가 6시간마다 실행하며, `trade_news_items`에 중복 없이 저장한다. 수동 실행은 `GET /api/jobs/trade-news?secret=$JOB_WORKER_SECRET`로 확인할 수 있다.

API001은 Vercel에서 관세청 `38010` 포트 직접 호출이 실패할 수 있어 현재 Vultr relay를 사용한다. 상세 운영 절차, relay 서버 정보, CY/CFS 판정 기준은 `docs/CARGO_API001_RUNBOOK.md`를 따른다.
API012 관세환율도 같은 `38010` 포트를 사용하므로 운영에서는 직접 호출보다 DB 캐시를 사용한다. 금요일 15:00 KST에 `/api/jobs/exchange-rates`가 실행되어 `customs_exchange_rates`에 수입/수출 관세환율을 저장한다. Vercel에서 직접 호출이 실패하면 Vultr relay의 `/exchange-rate`를 사용하도록 아래 값을 추가한다.

- `CUSTOMS_API_EXCHANGE_RATE_RELAY_URL`
- `CUSTOMS_API_EXCHANGE_RATE_RELAY_TOKEN`

## 3. 접근 제어

- 첫 화면은 `/login`으로 진입한다.
- 로그인 후 `/dashboard`로 이동한다.
- 운영 메뉴는 `emptypocket711@gmail.com` 계정이면서 `profiles.role = 'developer'`인 경우만 접근한다.
- 일반 사용자는 운영 메뉴 링크가 보이지 않고, 직접 URL 접근 시 차단 화면을 본다.

## 4. 배포 후 스모크 테스트

아래 흐름을 실제 로그인 계정으로 확인한다.

- 로그인/로그아웃
- `/dashboard` 메인 조회창
- `/hs/direct?query=3304.99-1000&direction=import&destinationCountry=ALL`
- `/hs/direct?query=작업용%20조끼&direction=import&destinationCountry=ALL`
- `/hs/overseas?query=3304991000&destinationCountry=CHN`
- `/duty-estimator`
- 개발자 계정의 `/legal-updates`
- 일반 계정의 `/legal-updates` 접근 차단

자동 스모크 테스트:

```bash
npm run smoke:production -- https://hsfinder.co.kr
```

로그인 쿠키 없이 실행하면 보호 페이지가 로그인으로 막히는지 확인한다. 실제 보호 페이지 내용까지 확인하려면 브라우저 개발자도구에서 로그인 세션 쿠키를 복사해 `SMOKE_COOKIE`에 넣고 실행한다. 쿠키 원문은 커밋하거나 로그에 공유하지 않는다.

```bash
SMOKE_COOKIE='...' \
SMOKE_REQUIRE_AUTHENTICATED=true \
npm run smoke:production -- https://hsfinder.co.kr
```

## 5. Vercel CLI 운영 확인

로컬 프로젝트는 Vercel 프로젝트 `koo-apps/customs-hscode`에 연결되어 있다. 운영 서버 함수 오류나 환경변수 상태를 확인할 때 아래 명령을 사용한다.

```bash
npm run ops:vercel:logs
npm run ops:vercel:env
npm run ops:vercel:deployments
```

원본 Vercel CLI 명령은 아래와 같다.

```bash
vercel logs hsfinder.co.kr --limit 50
vercel env ls
vercel ls
vercel inspect <deployment-url>
```

`vercel logs`는 서버 함수/API route가 실제로 호출된 이후의 운영 로그를 보여준다. 관세청 API, GPT 품명 검색, 반입계 출력, cron job 오류를 확인할 때 먼저 확인한다.

KOTRA 해외시장뉴스 URL은 정상 이름 `KOTRA_OVERSEAS_MARKET_NEWS_URL`을 사용한다. 과거 오타 값 `OTRA_OVERSEAS_MARKET_NEWS_URL`은 코드에서 fallback으로만 호환한다.

보호된 운영 job을 수동 실행할 때는 로컬 셸에 `JOB_WORKER_SECRET` 또는 `CRON_SECRET`을 넣고 실행한다. 비밀값은 커밋하지 않는다.

```bash
JOB_WORKER_SECRET='...' npm run ops:job:cargo-watch
JOB_WORKER_SECRET='...' npm run ops:job:exchange-rates
JOB_WORKER_SECRET='...' npm run ops:job:trade-news
JOB_WORKER_SECRET='...' npm run ops:job:background
```

`OPERATIONS_BASE_URL`을 지정하면 다른 배포 URL에도 호출할 수 있다.

```bash
OPERATIONS_BASE_URL='https://customs-hscode-....vercel.app' JOB_WORKER_SECRET='...' npm run ops:job:trade-news
```

## 6. 롤백

- Vercel 배포 목록에서 직전 성공 배포로 rollback한다.
- Supabase migration은 되돌리는 대신 후속 migration으로 정책/함수를 수정한다.
- 데이터 source publish가 잘못된 경우 해당 source version을 `staged` 또는 `archived`로 내리고 새 버전을 publish한다.
