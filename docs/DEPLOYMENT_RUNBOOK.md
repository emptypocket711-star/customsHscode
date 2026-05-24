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

## 2. Vercel 환경변수

필수:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AI_PROVIDER=openai`
- `OPENAI_API_KEY`
- `OPENAI_MODEL=gpt-5.4-mini`

권장:

- `RATE_LIMIT_ENABLED=true`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `JOB_WORKER_SECRET`
- `NEXT_PUBLIC_APP_URL`

초기 런칭에서는 아래 값을 유지한다.

- `CUSTOMS_API_PRODUCT_SEARCH_LIVE_ENABLED=false`
- `BACKGROUND_JOBS_ENABLED`는 worker/cron 준비 전까지 미설정 또는 `false`

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

## 5. 롤백

- Vercel 배포 목록에서 직전 성공 배포로 rollback한다.
- Supabase migration은 되돌리는 대신 후속 migration으로 정책/함수를 수정한다.
- 데이터 source publish가 잘못된 경우 해당 source version을 `staged` 또는 `archived`로 내리고 새 버전을 publish한다.
