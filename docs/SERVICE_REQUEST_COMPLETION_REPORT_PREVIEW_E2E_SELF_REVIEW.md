# Completion Report Preview E2E Self Review

이 문서는 P42.9 기준 seed/auth/e2e 스크립트 자체 리뷰 결과다.

## Reviewed Files

- `scripts/seed_completion_report_preview_fixture.mjs`
- `scripts/create_completion_report_preview_storage_states.mjs`
- `scripts/e2e_completion_report_preview_flow.mjs`
- `docs/SERVICE_REQUEST_COMPLETION_REPORT_PREVIEW_E2E_RUNBOOK.md`

## Security Findings

### Fixed: existing test user password drift

기존 테스트 사용자가 이미 있으면 seed script가 그대로 재사용하고 있었다. 이 경우 이전 비밀번호와 `E2E_TEST_PASSWORD`가 달라 storage state 생성이 실패할 수 있다.

조치:

- 기존 auth user가 있으면 `auth.admin.updateUserById`로 password, email confirmation, test metadata를 갱신하도록 수정했다.

### Fixed: Korean download token not checked

e2e negative assertion은 `download`만 확인하고 있었다. 실제 UI는 한국어 `다운로드`를 표시할 가능성이 있다.

조치:

- forbidden token에 `다운로드`를 추가했다.

### Accepted: service role seed is local-only

seed script는 service role key를 사용한다. production 오작동 위험을 줄이기 위해 `SUPABASE_URL` 또는 `NEXT_PUBLIC_SUPABASE_URL` hostname이 `localhost` 또는 `127.0.0.1`일 때만 실행한다.

남은 주의:

- 사용자가 production database를 localhost tunnel로 노출하면 스크립트가 구분할 수 없다. runbook에 local Supabase 전용이라고 명시되어 있다.

## QA Findings

### Covered

- 비로그인 preview 접근은 freight/clearance 양쪽 login redirect를 확인한다.
- requester는 freight/clearance preview 본문을 확인한다.
- selected partner는 freight/clearance preview 본문을 확인한다.
- developer는 freight/clearance preview 본문을 확인한다.
- unmatched partner는 freight/clearance preview 본문이 보이지 않는지 확인한다.
- route kind와 request type이 어긋나는 URL은 본문을 노출하지 않는지 확인한다.
- source snapshot version, request status, published_at, archive document label, safety notice를 확인한다.
- 파일명, 질문·답변 원문, 견적 메시지 원문, 다운로드 링크가 표시되지 않는지 확인한다.

### Remaining Gap

- storage state 생성 이후 stale session cleanup은 없다. `tmp/`가 gitignore이므로 보안상 저장소에는 남지 않지만 로컬 파일은 필요 시 삭제해야 한다.

## Next Recommendation

authenticated E2E matrix는 통과했다. 다음 보강은 stale storage state 정리 helper 또는 preview 모바일 본문 캡처 검증이다.
