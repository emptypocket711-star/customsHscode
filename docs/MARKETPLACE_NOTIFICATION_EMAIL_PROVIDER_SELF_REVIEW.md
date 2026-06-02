# Marketplace Notification Email Provider Self Review

## Scope

P115 `transactional_email` marketplace notification provider skeleton, recipient resolver, send readiness, delivery failure normalization, route wiring, and runbook updates.

## Findings

### Fixed: provider without recipient boundary

Before connecting an email provider, marketplace notification targets only carried `partnerCompanyId`. P114 added a resolver that selects onboarded client profiles from the partner company and prioritizes company admins.

P115 uses that resolver before calling `sendTransactionalEmail`. If no recipient is available, the sender throws `recipient_missing`, and delivery failure normalization stores `provider_recipient_missing`.

### Fixed: email provider readiness needs Resend env

`transactional_email` is only ready when all are present:

- `MARKETPLACE_NOTIFICATIONS_SEND_ENABLED`
- `MARKETPLACE_NOTIFICATIONS_PROVIDER=transactional_email`
- `RESEND_API_KEY`
- `NOTIFICATION_FROM_EMAIL`

Without these values, the route blocks `send=1` before worker execution.

### Fixed: runbook provider list was stale

The runbook now lists both `internal_dry_run` and `transactional_email`, and explains that 문자/푸시 providers are still not connected.

## Safety Checks

- Email body includes request type, notification kind, reason, and dashboard guidance only.
- Email body does not include request ID, document name, question/answer text, bid amount, invoice text, business number, phone number, or API key.
- Recipient email is used only for the provider call and is not added to delivery metadata.
- Unsupported provider names remain blocked.
- `internal_dry_run` remains available for no-external-send rehearsal.
- Local rehearsal still confirms dry-run, send-blocked, and claim-only behavior.

## Remaining Risk

- No production email send rehearsal was run in this local-only pass.
- The provider sends to only the first eligible recipient for now. Multiple-recipient fanout, user notification preference, and per-user unsubscribe policy are not implemented.
- Recipient lookup depends on `profiles.email` being current.
- The provider uses the generic `sendTransactionalEmail` path; branded marketplace email templates are not implemented yet.
