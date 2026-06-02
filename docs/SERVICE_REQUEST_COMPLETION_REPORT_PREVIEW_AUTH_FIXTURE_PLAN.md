# Completion Report Preview Auth Fixture Plan

이 문서는 완료 리포트 preview 본문 렌더링을 자동 검증하기 위한 인증 fixture 계획이다.

P42.1에서는 비로그인 접근이 `/login`으로 이동하는 것만 확인했다. preview 본문은 요청 당사자, 선정 파트너, 운영자만 접근해야 하므로 테스트 데이터와 세션 fixture가 필요하다.

## Test Roles

1. 요청자 회사 구성원
   - 자기 회사가 생성한 요청의 완료 리포트를 볼 수 있어야 한다.
   - 파일명과 다운로드 링크 없이 preview 본문만 확인한다.

2. 선정 파트너 회사 구성원
   - 자기 회사가 선정된 요청의 완료 리포트를 볼 수 있어야 한다.
   - 미선정 파트너는 같은 request id로 접근 시 차단되어야 한다.

3. 운영자 또는 developer
   - 운영 목적으로 preview를 볼 수 있어야 한다.
   - 운영 상세에서도 파일명, 질문·답변 원문, 견적 메시지 원문은 계속 숨겨야 한다.

4. 비로그인 사용자
   - `/login`으로 이동해야 한다.

## Fixture Data

최소 seed:

- requester company
- selected partner company
- unmatched partner company
- developer user
- completed freight request
- completed clearance request
- selected bid
- completion report locked
- completion report submitted 또는 operator reviewed
- completion report document mappings
- source snapshot with:
  - `snapshot_version`
  - `request.request_status`
  - `request.basis_date`
  - `lookup.source_lookup_snapshot.source_locks[].published_at`

민감 fixture 금지:

- 실제 회사명
- 실제 신고번호
- 실제 B/L 번호
- 실제 invoice line item
- 실제 파일명
- 실제 개인 연락처

fixture 값은 `TEST-DECL-001`, `TEST-BL-001`처럼 테스트임이 분명한 값을 사용한다.

## Assertions

비로그인:

- `/requests/freight/{id}/completion-report/preview` -> `/login`
- `/requests/clearance/{id}/completion-report/preview` -> `/login`

요청자/선정 파트너/운영자:

- preview title 표시
- status watermark 표시
- `출처 snapshot 버전` 표시
- `요청 상태 snapshot` 표시
- `공표시각` 표시
- 보관 서류 role 한글 라벨 표시
- 안전 고지 표시

미선정 파트너:

- preview 본문 미표시
- not found 또는 접근 차단 응답

Negative assertions:

- `fileName` 미표시
- `question` 미표시
- `answer` 미표시
- `message` 미표시
- 다운로드 링크 미표시

## Implementation Recommendation

1. Supabase local test seed를 만든다.
2. Playwright storage state를 role별로 생성한다.
3. preview route e2e를 추가한다.
4. 운영 상세 route는 developer storage state로 별도 확인한다.

우선순위:

- P42.3 local seed helper 설계
- P42.4 Playwright storage state 생성
- P42.5 preview route e2e 추가

local seed helper 구조는 [SERVICE_REQUEST_COMPLETION_REPORT_PREVIEW_SEED_HELPER_PLAN.md](./SERVICE_REQUEST_COMPLETION_REPORT_PREVIEW_SEED_HELPER_PLAN.md)를 따른다.

실행 순서는 [SERVICE_REQUEST_COMPLETION_REPORT_PREVIEW_E2E_RUNBOOK.md](./SERVICE_REQUEST_COMPLETION_REPORT_PREVIEW_E2E_RUNBOOK.md)를 따른다.
