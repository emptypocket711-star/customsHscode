# Marketplace Email Provider Final Readiness Review

This review summarizes marketplace email notification readiness after P113-P122.

## Completed

1. Provider readiness review selected recipient resolution as the real bottleneck before email send.
2. Partner recipient resolver now filters to onboarded client users in the partner company and excludes developer, other-company, pending, and invalid-email profiles.
3. `transactional_email` provider skeleton is connected behind explicit send readiness.
4. Send readiness requires:
   - `MARKETPLACE_NOTIFICATIONS_SEND_ENABLED=true`
   - supported provider
   - `RESEND_API_KEY`
   - `NOTIFICATION_FROM_EMAIL`
5. Email body avoids request id, document names, question/answer text, invoice contents, prices, business numbers, phone numbers, and API keys.
6. User-level marketplace email opt-in schema, RLS, repository, server action, and settings UI exist.
7. Missing preference rows mean email disabled.
8. Recipient resolver requires notification-kind-specific email opt-in for `transactional_email`.
9. Local opt-in rehearsal confirms notification-kind-specific include/exclude behavior.
10. Existing worker rehearsal still confirms dry-run, blocked send, and claim-only paths.
11. MVP external email fanout stays single-recipient, admin-first.
12. Production provider rehearsal is blocked until the rehearsal gate is satisfied.

## Current Safe State

The system can safely run local rehearsals:

- `ops:marketplace-notifications:rehearse-local`
- `ops:marketplace-notifications:email-opt-in-local`

The system should not run real production email sends yet.

## Remaining Risks

1. No authenticated sender-domain production rehearsal has been executed.
2. Public unsubscribe links are intentionally deferred.
3. Email delivery remains company-scoped, not per-user delivery-scoped.
4. Multi-recipient fanout is intentionally disabled for MVP.
5. Branded email templates are not implemented.
6. Production telemetry for email fatigue, duplicate partner responses, and provider failures is still limited.

## Next Bottleneck

The next marketplace notification bottleneck is not another email provider feature.

The next useful platform work should move back to marketplace transaction quality:

1. make partner opportunity rows easier to prioritize after notifications
2. improve operations visibility for no-response notified partners
3. connect notification delivery outcomes to operations prompts

Email provider work should resume only when the operator is ready to prepare the production rehearsal gate.
