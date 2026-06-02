# Marketplace Production Email Rehearsal Gate

This gate defines when HS FINDER may run a real `transactional_email` marketplace notification rehearsal.

Do not run a real provider rehearsal until every gate below is satisfied.

## Required Gates

1. Sender domain is authenticated in the email provider.
2. `NOTIFICATION_FROM_EMAIL` uses that authenticated sender domain.
3. `RESEND_API_KEY` belongs to the intended environment and is not printed in logs.
4. `MARKETPLACE_NOTIFICATIONS_SEND_ENABLED=true` is set only for the rehearsal window.
5. `MARKETPLACE_NOTIFICATIONS_PROVIDER=transactional_email`.
6. Recipient is a controlled test mailbox owned by the operator.
7. The test recipient has an authenticated user profile and explicit marketplace email opt-in for the tested notification kind.
8. The request fixture contains no real invoice text, document names, phone numbers, business numbers, prices, or customer identifiers.
9. The worker route is protected by `JOB_WORKER_SECRET` or `CRON_SECRET`.
10. The runbook operator records the request id, delivery id, provider id, and result without storing secret values or message body.

## Disallowed Rehearsal Conditions

Do not run production email rehearsal when:

- the recipient is a real partner customer
- the sender domain is not authenticated
- `transactional_email` would send to a non-allowlisted mailbox
- the target request contains real customer documents or commercial terms
- public unsubscribe is being tested without a token/audit design
- the operator cannot immediately disable `MARKETPLACE_NOTIFICATIONS_SEND_ENABLED`

## Minimum Rehearsal Shape

Use one synthetic marketplace request and one synthetic partner company.

The expected flow:

1. Seed or select one synthetic open request.
2. Match exactly one synthetic partner company.
3. Enable email opt-in only for one test user and one notification kind.
4. Confirm `ops:marketplace-notifications:email-opt-in-local` still passes locally before production rehearsal.
5. Enable production send env for the rehearsal window.
6. Call the marketplace notification worker with `send=1&limit=1`.
7. Confirm one delivery is marked sent or one provider failure is recorded.
8. Disable production send env immediately after the rehearsal.

## Acceptance Criteria

The rehearsal is acceptable only if:

- no real customer data is included in the email
- exactly one intended test mailbox receives the email
- delivery status and provider id are visible for the synthetic delivery
- provider failure is normalized if the send fails
- `MARKETPLACE_NOTIFICATIONS_SEND_ENABLED` is disabled after the test

## Current Decision

Production provider rehearsal remains blocked until the operator prepares an authenticated sender domain and an allowlisted synthetic recipient mailbox.

The local app can continue using:

- `ops:marketplace-notifications:rehearse-local`
- `ops:marketplace-notifications:email-opt-in-local`
