# Marketplace Transaction Mutation E2E Plan

Date: 2026-06-01

Purpose: extend the current marketplace transaction E2E from page reachability/rendering into a guarded mutation flow:

1. partner submits a freight bid through the UI
2. partner submits a clearance bid through the UI
3. requester selects the submitted bid through the UI
4. request state changes are visible to requester and selected partner
5. requester starts the selected request, completes it, submits feedback, and sees completion-report handoff guidance

## Current Harness Boundary

Already available:

- local-only readiness check
- local-only synthetic seed
- requester, forwarder, broker storage-state creator
- guarded role-based page E2E
- one-command local runner
- fixture IDs shared across seed/readiness/e2e

Covered by the local runner:

- bid form submission through browser input
- selected bid transition through browser click
- selected-partner visibility immediately after selection
- requester lifecycle transition from `partner_selected` to `in_progress` to `completed`
- requester feedback submission after completion
- completion report next-action guidance, archive document area, and draft save CTA after completion
- mutation fixture reset after repeated local E2E runs

## Mutation Fixture Strategy

Keep the existing static rendering fixture for stable page checks.

Add separate mutation fixture IDs so repeated mutation runs do not conflict with the rendering fixture:

```text
mutation freight request
mutation clearance request
mutation freight bid
mutation clearance bid
```

Before each mutation run:

1. delete mutation service requests by ID
2. seed mutation requests with `status = open`
3. seed partner matches only
4. do not pre-seed bids
5. browser submits bids through partner forms
6. browser verifies requester sees the newly submitted bids
7. browser selects bids
8. browser verifies request state is `partner_selected`
9. browser starts and completes the selected request
10. browser verifies feedback and completion-report handoff CTAs

## Required Assertions

### Dashboard Completion Metrics

- requester dashboard `리포트 대기` means the current user's company has completed requests without an active completion report.
- requester dashboard `피드백 대기` means the current user's company has completed requests without that company's feedback.
- operations `완료 리포트 없음` is broader: it is an operator-wide platform bottleneck across visible requests, not a user-specific action count.
- dashboard next-action detail links should prioritize completion-report gaps before feedback gaps for completed requester work.
- partner dashboard `입찰 가능` means matched open or bids-received requests where the partner can still submit or review a bid opportunity.
- partner dashboard `파트너 업무` is broader: it includes bid opportunities plus selected or in-progress requests where the selected partner must continue the transaction lifecycle.

### Requester Publish Readiness

- requester freight drafts must show missing publish fields before the publish action is usable.
- freight publish required fields are origin country, destination country, and transport mode.
- freight drafts missing those fields should show `포워더 공개 전 필수값을 보완해야 합니다.`, `누락값: 출발 국가, 도착 국가, 운송 방식`, and a direct `초안 작성으로 이동` shortcut.
- requester clearance drafts must not expose the broker publish settings until destination country is present.
- clearance drafts missing destination country should show `관세사무소 공개 전 필수값을 보완해야 합니다.`, `누락값: 목적국`, and a direct `초안 작성으로 이동` shortcut.
- publish readiness assertions are separate from post-completion handoff assertions: they guard draft-to-open conversion before partner bidding starts.

### Freight Partner Submit

- forwarder opens `/requests/freight/opportunities/{mutationFreightRequestId}`
- page shows `운송 입찰 작업`
- form shows `총 견적 금액`, `견적 메모`, `견적 제출`
- fill currency, total amount, freight rate, local charge, lead time, transit time, message
- submit button completes without exposing raw DB errors

### Clearance Partner Submit

- broker opens `/requests/clearance/opportunities/{mutationClearanceRequestId}`
- page shows `통관 입찰 작업`
- form shows `관세사무소 예비 견적 제출`, `총 견적 금액`, `예비 통관 견적 제출`
- fill currency, total amount, brokerage fee, expected clearance days, risk note
- submit button completes without legal-certainty wording

### Requester Select

- requester opens freight request detail
- page shows `받은 견적`, submitted amount, partner selection CTA
- selecting the bid changes request state to selected/partner selected
- requester opens clearance request detail and repeats the same checks

### Selected Partner Visibility

- forwarder/broker opens the same opportunity after selection
- page shows selected-partner next-step guidance
- no file download controls or real document contents are required for this E2E

### Post-Selection Lifecycle

- requester starts the selected freight and clearance requests
- detail page shows the completed state after requester completion
- detail page shows `완료 요청 피드백`, `완료 후 다음 행동`, `최종 보관 서류`, and `초안 저장`
- completion report handoff shows why blocked steps are waiting, with `대기:` copy for submit/acknowledge/review/lock states
- completion report handoff shows archive-document gap guidance when no final archive documents are linked
- completion report handoff exposes a direct `초안 작성으로 이동` shortcut before a draft exists
- requester submits feedback and sees the submitted-feedback state
- submitted-feedback state shows the rating and clarifies that no additional feedback submission is required

## RLS And Safety Review Points

- bid submit must go through audited RPC, not direct table insert from client
- bid selection must go through requester-owned audited RPC
- partner cannot select its own bid
- non-matched partner cannot submit a bid
- requester cannot access another company's mutation request
- no real documents are uploaded
- no service role is used after seed setup
- E2E output must not print passwords, service-role key, cookies, bid messages, document filenames, or customer data

## Implementation Steps

1. Extend `marketplace-transaction.fixture.mjs` with mutation request/bid IDs and env keys.
2. Update seed runner to seed static rendering fixture and mutation-open fixture separately.
3. Add mutation E2E script or mutation section in the existing E2E script. Done in `scripts/e2e_marketplace_transaction_mutation_flow.mjs`.
4. Keep the existing rendering assertions first so route regressions fail before mutation steps. Done in `scripts/run_marketplace_transaction_e2e_local.mjs`.
5. Add safe-fail checks for missing mutation fixture env/storage states. Done.
6. Run only through the local runner after local Supabase is ready. Current command:

```bash
npm run e2e:marketplace-transaction:local
```

## Deferral

Do not add real document upload or file download assertions here. Storage privacy has separate RLS coverage, and mutation E2E should stay focused on quote submission and selection.
