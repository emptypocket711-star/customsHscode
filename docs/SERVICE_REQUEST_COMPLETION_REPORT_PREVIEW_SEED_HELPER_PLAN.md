# Completion Report Preview Seed Helper Plan

이 문서는 P42.3 기준 완료 리포트 preview e2e를 위한 local seed helper 구조를 정의한다.

목표는 실제 운영 데이터 없이도 요청자, 선정 파트너, 미선정 파트너, 운영자 권한으로 preview route를 검증할 수 있게 하는 것이다.

## Helper Shape

권장 파일:

- `tests/fixtures/completion-report-preview.fixture.ts`
- `tests/e2e/completion-report-preview.spec.ts`

fixture helper 책임:

- 테스트 회사 3개 생성
  - requester company
  - selected partner company
  - unmatched partner company
- 테스트 사용자 4개 생성
  - requester member
  - selected partner member
  - unmatched partner member
  - developer user
- completed freight request 1건 생성
- completed clearance request 1건 생성
- selected bid 생성
- locked completion report 생성
- submitted 또는 operator reviewed completion report 생성
- completion report document mapping 생성
- source snapshot 생성

## Seed Contracts

테스트 데이터는 다음 key를 반환한다.

```ts
type CompletionReportPreviewFixture = {
  clearanceRequestId: string;
  freightRequestId: string;
  requesterUserEmail: string;
  selectedPartnerUserEmail: string;
  unmatchedPartnerUserEmail: string;
  developerUserEmail: string;
};
```

비밀번호는 e2e 전용 env로 주입한다.

```text
E2E_TEST_PASSWORD
```

## Source Snapshot Fixture

source snapshot은 다음 최소 값을 포함한다.

```json
{
  "snapshot_version": "completion-report-source-v1",
  "request": {
    "request_status": "completed",
    "direction": "import",
    "basis_date": "2026-06-01",
    "source_hs_request_id": "00000000-0000-4000-8000-000000000001",
    "has_source_lookup_snapshot": true
  },
  "selected_bid": {
    "selected_bid_id": "00000000-0000-4000-8000-000000000002",
    "bid_type": "clearance",
    "bid_status": "selected",
    "selected_at": "2026-06-01T00:00:00.000Z"
  },
  "lookup": {
    "source_lookup_snapshot": {
      "source_locks": [
        {
          "source_name": "테스트 공식 출처",
          "source_url": "https://example.test/source",
          "source_version": "2026-test",
          "effective_from": "2026-01-01",
          "effective_to": null,
          "published_at": "2026-05-31T00:00:00.000Z",
          "retrieved_at": "2026-06-01T00:00:00.000Z",
          "checksum": "test-checksum"
        }
      ]
    }
  },
  "safety": {
    "legal_certainty": false,
    "hs_classification_final": false,
    "requires_staff_review_for_legal_outputs": true
  }
}
```

## E2E Assertions

요청자와 선정 파트너:

- `운송 완료 리포트 미리보기` 또는 `통관 완료 리포트 미리보기` 표시
- `출처 snapshot 버전 completion-report-source-v1` 표시
- `요청 상태 snapshot 완료` 표시
- `공표시각 2026-05-31T00:00:00.000Z` 표시
- `최종 B/L 또는 AWB` 또는 `수입신고필증` 표시
- 안전 고지 표시

미선정 파트너:

- preview 본문 미표시
- `/login`이 아니라 권한 차단 또는 not found로 처리되는지 확인

비로그인:

- `/login` 이동

Negative assertions:

- `fileName` 미표시
- `question` 미표시
- `answer` 미표시
- `message` 미표시
- `download` 미표시

## Implementation Order

1. Supabase local seed helper를 만든다.
2. role별 login storage state를 만든다.
3. Playwright e2e에서 storage state별 route 접근을 확인한다.
4. CI에는 local Supabase가 준비된 job에서만 실행되도록 분리한다.
