# Completion Report Authenticated Browser Review Unblock

이 문서는 완료 리포트 preview 본문 화면을 로컬 브라우저에서 확인하기 위해 먼저 풀어야 하는 조건을 기록한다.

## Current State

- local Next.js 서버는 `http://127.0.0.1:3100`에서 응답한다.
- 비로그인 preview 접근은 `/login`으로 이동한다.
- local Supabase fixture seed, role별 Playwright storage state 생성, authenticated preview E2E가 통과했다.
- requester, selected partner, developer가 보는 운송/통관 완료 리포트 본문과 unmatched partner 미노출을 브라우저 자동화로 확인했다.
- 화면에서 파일명, 질문·답변 원문, 견적 메시지 원문, `download`/`다운로드` 토큰이 노출되지 않는지 확인했다.

## Required Local Conditions

- `SUPABASE_URL` 또는 `NEXT_PUBLIC_SUPABASE_URL`은 `http://127.0.0.1:54321` 같은 local Supabase origin이어야 한다.
- `SUPABASE_SERVICE_ROLE_KEY`는 local Supabase service role key여야 한다.
- `E2E_TEST_PASSWORD`는 테스트 계정 생성과 로그인 storage state 생성에서 같은 값이어야 한다.
- local Next.js 서버는 `E2E_BASE_URL`에서 실행 중이어야 한다.

## Execution Order

```bash
E2E_BASE_URL=http://127.0.0.1:3100 \
npm run e2e:completion-preview:ready
```

```bash
SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_SERVICE_ROLE_KEY=... \
E2E_TEST_PASSWORD=... \
npm run e2e:completion-preview:seed
```

```bash
E2E_BASE_URL=http://127.0.0.1:3100 \
E2E_TEST_PASSWORD=... \
npm run e2e:completion-preview:auth
```

```bash
E2E_BASE_URL=http://127.0.0.1:3100 \
npm run e2e:completion-preview
```

## Browser Review Scope

- requester: freight/clearance preview 본문 확인
- selected partner: freight/clearance preview 본문 확인
- developer: freight/clearance preview 본문 확인
- unmatched partner: freight/clearance preview 본문 미노출 확인
- 화면에서 파일명, 질문·답변 원문, 견적 메시지 원문, 다운로드 링크가 노출되지 않는지 확인
- source snapshot version, 공표시각, 요청 상태 snapshot, 보관 서류 한글 라벨, 안전 고지가 보이는지 확인
