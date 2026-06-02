# Completion Report Preview E2E Runbook

이 문서는 완료 리포트 preview e2e를 로컬에서 실행하는 순서다.

## Preconditions

- 로컬 Next.js 서버 실행
  - 기본 URL: `http://localhost:3100`
- 로컬 Supabase 사용
  - `SUPABASE_URL` 또는 `NEXT_PUBLIC_SUPABASE_URL`은 `localhost` 또는 `127.0.0.1`이어야 한다.
  - production URL에서는 seed/auth/e2e 스크립트가 실행되지 않는다.
- service role key 준비
  - `SUPABASE_SERVICE_ROLE_KEY`
- 테스트 계정 비밀번호 준비
  - `E2E_TEST_PASSWORD`

## Command Order

빠른 실행:

```bash
E2E_BASE_URL=http://localhost:3100 \
npm run e2e:completion-preview:local
```

이 명령은 local 전용 preflight를 통과한 경우에만 seed, role별 storage state 생성, preview e2e를 순서대로 실행한다. `SUPABASE_URL`이 원격 Supabase이면 실행을 중단한다.

0. local readiness check

```bash
E2E_BASE_URL=http://localhost:3100 \
npm run e2e:completion-preview:ready
```

이 명령은 `.env.local`, local Supabase URL, service role key 존재 여부, 테스트 비밀번호 존재 여부, local Next.js `/login`, local Supabase auth health, role별 storage state 파일 존재 여부를 확인한다. 비밀번호와 service role key 값은 출력하지 않는다.

1. local DB seed

```bash
SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_SERVICE_ROLE_KEY=... \
E2E_TEST_PASSWORD=... \
npm run e2e:completion-preview:seed
```

2. role별 storage state 생성

```bash
E2E_BASE_URL=http://localhost:3100 \
E2E_TEST_PASSWORD=... \
npm run e2e:completion-preview:auth
```

생성 위치:

```text
tmp/e2e-auth/completion-preview-requester.json
tmp/e2e-auth/completion-preview-selected-partner.json
tmp/e2e-auth/completion-preview-unmatched-partner.json
tmp/e2e-auth/completion-preview-developer.json
```

3. preview e2e 실행

```bash
E2E_BASE_URL=http://localhost:3100 \
npm run e2e:completion-preview
```

## What It Verifies

- 비로그인 사용자는 `/login`으로 이동한다.
- 요청자는 운송/통관 완료 리포트 preview를 볼 수 있다.
- 선정 파트너는 운송/통관 완료 리포트 preview를 볼 수 있다.
- developer는 운송/통관 완료 리포트 preview를 볼 수 있다.
- 미선정 파트너는 운송/통관 완료 리포트 preview 본문을 볼 수 없다.
- source snapshot version, request status snapshot, published_at이 표시된다.
- 보관 서류 role은 한글 라벨로 표시된다.
- 안전 고지가 표시된다.
- 파일명, 질문·답변 원문, 견적 메시지 원문, 다운로드 링크가 표시되지 않는다.

## Expected Safe Failures

- env가 없으면 seed script는 실행을 중단한다.
- readiness script는 누락된 env, 꺼져 있는 local 서버, 없는 storage state를 안전하게 알려주고 실패한다.
- local runner는 원격 Supabase URL, 꺼져 있는 local 서버, 없는 필수 env를 발견하면 seed를 실행하기 전에 중단한다.
- base URL이 localhost/127.0.0.1이 아니면 auth/e2e script는 실행을 중단한다.
- storage state가 없으면 e2e script는 auth script를 먼저 실행하라고 안내한다.

## Current Limitation

이 e2e는 로컬 Supabase fixture 전용이다. production smoke와 섞지 않는다.

## Cleanup

role별 storage state를 정리하려면 먼저 dry-run으로 삭제 대상을 확인한다.

```bash
npm run e2e:storage:cleanup
```

실제로 삭제할 때만 `-- --apply`를 붙인다.

```bash
npm run e2e:storage:cleanup -- --apply
```

스크립트 자체 리뷰 결과는 [SERVICE_REQUEST_COMPLETION_REPORT_PREVIEW_E2E_SELF_REVIEW.md](./SERVICE_REQUEST_COMPLETION_REPORT_PREVIEW_E2E_SELF_REVIEW.md)를 따른다.
