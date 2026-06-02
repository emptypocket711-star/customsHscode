# Platform Request Lifecycle

## Purpose

선정 이후 운송/통관 요청이 실제 업무로 이어지는 상태 모델을 정의한다.

현재 `service_request_status` enum에는 `in_progress`, `completed`가 포함되어 있고, 후속 상태 전이는 `start_selected_service_request`, `complete_selected_service_request` RPC로만 처리한다. 직접 update RLS는 열지 않는다.

## Current Implemented States

| Status | Meaning | Current UI |
| --- | --- | --- |
| `draft` | 화주가 요청 초안을 저장한 상태 | 필수값 보완, 서류 첨부, 공개 설정 |
| `open` | 파트너에게 공개되어 견적을 기다리는 상태 | 질문·견적 대기 |
| `bids_received` | 하나 이상의 견적이 도착한 상태 | 견적 비교, 업체 선정 |
| `partner_selected` | 화주가 포워더/관세사무소를 선정한 상태 | 선정 후 후속 안내, 진행 시작 |
| `in_progress` | 선정 파트너와 실제 운송/통관 진행 중 | 완료 처리 |
| `completed` | 운송/통관 업무 완료 | 완료 상태 표시 |
| `cancelled` | 요청 취소 상태 | 아직 전용 UI 없음 |
| `expired` | 마감 만료 상태 | 아직 전용 UI 없음 |
| `hidden` | 운영자 숨김 상태 | 운영자 전용 |

## Post-Selection States

| Status | Meaning | Allowed Transition |
| --- | --- | --- |
| `in_progress` | 선정 파트너와 실제 운송/통관 진행 중 | `partner_selected -> in_progress` |
| `completed` | 운송/통관 업무 완료 | `in_progress -> completed` |

## Transition Rules

### `partner_selected -> in_progress`

Allowed actors:

- requester company admin/member for its own request
- selected partner company admin/member
- staff/admin

Required checks:

- request status is `partner_selected`
- selected bid exists and status is `selected`
- actor is requester, selected bidder company, or staff/admin
- company is not suspended/blocked

Required audit event:

- `service_request_started`

Audit metadata:

- `request_id`
- `request_type`
- `selected_bid_id`
- `actor_company_role`: `requester`, `selected_partner`, or `staff`
- no document file names
- no invoice contents
- no personal identifiers beyond internal UUIDs

### `in_progress -> completed`

Allowed actors:

- requester company admin/member for its own request
- selected partner company admin/member
- staff/admin

Required checks:

- request status is `in_progress`
- selected bid exists and status is `selected`
- actor is requester, selected bidder company, or staff/admin

Required audit event:

- `service_request_completed`

Audit metadata:

- `request_id`
- `request_type`
- `selected_bid_id`
- `actor_company_role`
- optional completion note length-limited and redacted

## RPC Plan

Create RPCs instead of opening direct `service_requests` update policies:

1. `start_selected_service_request(p_request_id uuid)`
2. `complete_selected_service_request(p_request_id uuid, p_completion_note text default null)`

Both RPCs should:

- lock `service_requests` row with `for update`
- find selected bid with `for update`
- validate actor company
- update status
- write audit log
- return `{ request_id, status }`

## UI Plan

Requester detail page:

- `partner_selected`: show selected partner next steps and `진행 시작` button
- `in_progress`: show progress checklist and `완료 처리` button
- `completed`: show completion summary and report/archive CTA

Partner opportunity detail page:

- `partner_selected`: show selected partner handoff checklist and `진행 시작` button
- `in_progress`: show active job checklist and `완료 처리` button
- `completed`: show completed state, no mutation except future feedback/report

## RLS Policy Notes

Do not add broad update policy to `service_requests`.

Read access remains:

- requester can read own request
- staff/admin can read
- matched partner can read `open`/`bids_received`
- selected bidder can read `partner_selected`, `in_progress`, `completed`

Write access remains RPC-only.

## Non-Goals

- No payment escrow.
- No chat room.
- No legal final-confirmation.
- No file download expansion.
- No automatic completion from external logistics status.
