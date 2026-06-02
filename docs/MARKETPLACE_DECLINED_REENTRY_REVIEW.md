# Marketplace Declined Re-entry Review

Date: 2026-06-03

## Decision

Partners should be able to re-enter a declined opportunity, but the first re-entry state should be `viewed`, not `interested`.

## Why

`declined` means the partner opted out and should not receive reminder notifications. If the partner later opens the detail page and wants to reconsider, the system should let them return to a neutral review state without implying that they already intend to submit a quote.

## MVP Behavior

1. A declined opportunity remains visible in the partner opportunity list.
2. The detail page shows the current state as `참여 보류`.
3. The partner can click `다시 검토` to change `declined` to `viewed`.
4. After re-entry, the partner can ask questions or submit a bid from the existing flow.
5. Re-entry should use the existing `set_service_request_partner_interest` RPC.
6. Re-entry should not expose requester documents beyond the existing visibility rules.
7. Re-entry should create the same audit log family as other interest status changes through the RPC.

## Not In MVP

- No automatic email reminder immediately after re-entry.
- No direct `declined -> interested` shortcut.
- No reason-code collection for why the partner declined.
- No requester-facing display of which partner declined.

## Next Implementation

P135 should add a `다시 검토` action on the partner opportunity detail page when `interestStatus === "declined"`.
