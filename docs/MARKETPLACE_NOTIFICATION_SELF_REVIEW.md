# Marketplace Notification Self Review

## Scope

Reviewed marketplace notification readiness, provider selection, worker result semantics, sender failure handling, delivery metadata safety, and runbook guidance.

## Findings

### Fixed: readiness accepted unsupported provider names

Readiness previously treated any configured provider value as ready when send was enabled. This could make `MARKETPLACE_NOTIFICATIONS_PROVIDER=email` look ready before an email provider exists.

Fix:
- Added provider allowlist from `marketplaceNotificationProviderNames`.
- Readiness now returns `MARKETPLACE_NOTIFICATIONS_PROVIDER is not supported.` for unsupported providers.
- Added unit coverage.

### Fixed: claim-only runs could be confused with sent notifications

Without a sender, the worker claimed deliveries but did not send externally. `claimedCount` alone could be misread as delivery completion.

Fix:
- Added `claimedWithoutSenderCount`.
- Runbook now distinguishes claim-only, sent, failed, and duplicate counts.
- Added unit coverage.

### Fixed: sender failure path lacked coverage

Sender success was tested, but failure count and delivery failure updates were not.

Fix:
- Added worker test for sender failure.
- Confirmed failed sender increments `failedSendCount`, keeps `sentCount` at 0, and writes normalized provider error code.

## Safety Checks

- Supported provider list currently contains only `internal_dry_run`.
- `internal_dry_run` is documented as no external delivery.
- Unsupported providers are not ready.
- Delivery metadata sanitizer only allows non-sensitive keys.
- Provider errors are normalized before storage.
- Runbook warns not to treat `claimedWithoutSenderCount` or `failedSendCount` as external send success.

## Remaining Risk

- No real external provider is connected yet.
- The protected job route can still return infrastructure error messages to authorized callers; this is acceptable for the current operator-only route, but should be revisited before broader admin exposure.
- End-to-end production job execution was not run in this local-only pass.
