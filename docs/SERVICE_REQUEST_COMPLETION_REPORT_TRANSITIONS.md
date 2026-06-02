# Service Request Completion Report Transitions

이 문서는 완료 리포트가 `draft`에서 제출, 양측 확인, 운영 검토, 잠금으로 넘어갈 때의 권한과 검증 기준을 고정한다.

완료 리포트는 운송·통관 거래 종료 기록이며, HS/FTA/요건의 법적 확정 판정 도구가 아니다. 통관 결과에 HSK, FTA, 세관장확인, 통합공고, 개별법령 내용이 포함되면 “예비 조회 출처”와 “실제 신고 결과 기준”을 분리해 표시한다.

## State Model

| Status | 의미 | 수정 가능 여부 | 다음 상태 |
| --- | --- | --- | --- |
| `draft` | requester, selected partner, staff가 완료 결과를 작성·보완하는 상태 | 가능 | `submitted`, `voided` |
| `submitted` | 한쪽이 완료 리포트를 제출했고 상대방 확인을 기다리는 상태 | 금액·결과 수정 차단 권장, 보관 서류 추가는 제한적으로 허용 | `requester_acknowledged`, `partner_acknowledged`, `operator_reviewed`, `voided` |
| `requester_acknowledged` | 화주가 제출 리포트를 확인한 상태 | 일반 수정 차단 | `partner_acknowledged`, `operator_reviewed`, `locked`, `voided` |
| `partner_acknowledged` | 선정 파트너가 제출 리포트를 확인한 상태 | 일반 수정 차단 | `requester_acknowledged`, `operator_reviewed`, `locked`, `voided` |
| `operator_reviewed` | 운영자가 민감정보, 서류 연결, 분쟁 가능성을 검토한 상태 | 운영자만 보완 가능 | `locked`, `voided` |
| `locked` | 보관용 완료 리포트가 잠긴 상태 | 불가 | 없음 |
| `voided` | 잘못 생성한 리포트를 무효 처리한 상태 | 불가 | 없음 |

MVP에서는 `requester_acknowledged`와 `partner_acknowledged`를 단일 상태 컬럼으로만 표현하면 양측 동시 확인을 담기 어렵다. 현재 테이블을 크게 바꾸지 않으려면 다음 중 하나를 선택한다.

- 권장 MVP: 상태 컬럼은 `submitted`, `operator_reviewed`, `locked` 중심으로 쓰고, 양측 확인은 `source_snapshot.confirmations` JSON에 `{ requester: { acknowledgedAt, acknowledgedBy }, partner: { acknowledgedAt, acknowledgedBy } }` 형태로 저장한다.
- 장기 구조: `requester_acknowledged_at`, `requester_acknowledged_by`, `partner_acknowledged_at`, `partner_acknowledged_by`, `operator_reviewed_at`, `operator_reviewed_by` 컬럼을 분리한다.

P36.3 UI skeleton은 권장 MVP 방식에 맞춰 “제출”, “화주 확인”, “파트너 확인”, “운영 검토”, “잠금” CTA를 상태와 역할에 따라 보여준다. P36.4 migration/RPC에서는 장기 구조가 필요할지 다시 결정한다.

## Actor Rules

| Actor | 허용 작업 |
| --- | --- |
| Requester company member | 자기 요청의 `draft` 작성·보완, 제출된 리포트 확인 |
| Selected partner company member | 선정된 요청의 `draft` 작성·보완, 제출, 제출된 리포트 확인 |
| Staff/admin/developer | 운영 검토, 잠금, void, 분쟁 대응용 조회 |
| Matched but unselected partner | 완료 리포트 조회·수정 불가 |
| Suspended or blocked company | 제출·확인·서류 연결 불가 |

요청 상태는 `completed`여야 한다. `in_progress`에서 완료 리포트를 만들 수 있게 하면 실제 완료 전 정산 원장이 생겨 분쟁 가능성이 커진다.

## Required RPCs

직접 update RLS를 열지 않고 아래 RPC로만 상태를 바꾼다.

### `submit_completion_report(p_report_id uuid)`

검증:

- report exists and `status = 'draft'`
- linked request exists and `service_requests.status = 'completed'`
- actor is requester, selected partner, or staff
- actor company is active for marketplace
- selected bid exists and selected partner matches report
- required archive document roles are present
- report has at least one of `summary`, `final_amount`, `settlement_items`, `freight_result`, `clearance_result`

변경:

- `status = 'submitted'`
- `submitted_by = auth.uid()`
- `submitted_at = now()`
- audit event `service_request_completion_report_submitted`

Audit metadata:

- request id, report id, actor role, previous status, next status
- linked document count, required document count
- no file name, no declaration number, no invoice content, no cost breakdown raw text

### `acknowledge_completion_report(p_report_id uuid, p_role text)`

검증:

- report exists and `status in ('submitted', 'requester_acknowledged', 'partner_acknowledged')`
- `p_role in ('requester', 'partner')`
- requester role may only be called by requester company member or staff
- partner role may only be called by selected partner company member or staff
- actor company is active for marketplace
- report is not locked or voided

변경:

- if requester acknowledges first, set status to `requester_acknowledged`
- if partner acknowledges first, set status to `partner_acknowledged`
- if the other side was already acknowledged, status may move to `operator_reviewed` only by staff or stay in the second acknowledged state until staff review
- store confirmation metadata without free-text memo
- audit event `service_request_completion_report_acknowledged`

MVP에서는 양측 확인을 상태 하나로 완벽하게 표현하지 못하므로, UI에는 “상대방 확인 필요”를 `source_snapshot.confirmations` 기준으로 표시한다.

### `review_completion_report(p_report_id uuid)`

검증:

- staff/admin/developer only
- report exists and status is not `locked` or `voided`
- required document mappings are readable
- legal safety wording and source distinction are present when clearance result includes HS/FTA/requirement fields

변경:

- `status = 'operator_reviewed'`
- audit event `service_request_completion_report_reviewed`

### `lock_completion_report(p_report_id uuid)`

검증:

- staff/admin/developer only for MVP
- report exists and `status = 'operator_reviewed'`
- required archive document mappings exist
- no mapped request document violates current actor read policy
- no legal certainty wording appears in summary or source snapshot notes

변경:

- `status = 'locked'`
- `locked_by = auth.uid()`
- `locked_at = now()`
- audit event `service_request_completion_report_locked`

잠금 이후:

- `create_or_update_completion_report` must reject
- `attach_completion_report_document` must reject
- future export/report generation reads locked snapshot only

### `void_completion_report(p_report_id uuid, p_reason text)`

검증:

- staff/admin/developer only
- report is not locked
- reason max 500 chars and not stored in user-visible output unless intentionally displayed by operations UI

변경:

- `status = 'voided'`
- audit event `service_request_completion_report_voided`

## UI Guardrails

완료 리포트 패널은 다음 순서로 사용자를 안내한다.

1. 초안 저장
2. 보관 서류 연결
3. 제출 전 누락 확인
4. 제출
5. 상대방 확인 상태 표시
6. 운영 검토 상태 표시
7. 잠금 상태 표시

문구 원칙:

- 사용 가능: “업무 완료 기록”, “제출 대기”, “상대방 확인 필요”, “운영 검토 필요”, “잠금 후 수정 불가”
- 금지: “법적 확정”, “요건 없음 확정”, “FTA 적용 보장”, “HSK 확정”

UI에서 신고번호, B/L 번호, 정산 세부 항목을 보여줄 수는 있지만 audit log와 운영 통계 샘플에는 원문성 값을 넣지 않는다.

## Validation Checklist

P36.3 이후 구현 검증은 다음을 포함한다.

- requester cannot acknowledge as partner
- selected partner cannot acknowledge as requester
- unselected matched partner cannot read or mutate report
- suspended/blocked company cannot submit, acknowledge, attach, or lock
- draft can be edited, locked cannot be edited
- submitted report cannot be edited except through explicitly allowed correction RPC
- required archive documents block submit or lock
- no AI/legal certainty wording appears in user-visible status copy
- audit metadata contains only ids, counts, role, transition status

## Next Rails

- P36.3 completion report submit UI skeleton: 현재 RPC가 없어도 상태별 CTA와 잠금 전 경고를 UI skeleton으로 표시한다.
- P36.4 completion report transition RPC: 위 RPC 중 `submit`, `acknowledge`, `review`, `lock`을 migration 초안과 governance tests로 구현한다.
- P36.5 completion report transition actions: repository/action/schema를 추가하고 UI skeleton과 실제 RPC를 연결한다.
