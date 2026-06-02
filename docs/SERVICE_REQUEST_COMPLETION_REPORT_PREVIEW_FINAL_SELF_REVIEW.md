# Completion Report Preview Final Self Review

## Scope

Reviewed completion report preview, local e2e readiness, fixture seed/auth scripts, route guard, source URL handling, schema fallback, and related tests added during the preview hardening work.

## Findings

### Fixed: route kind/report type mismatch

Preview routes previously trusted the route kind when building the preview model. A mismatched URL such as freight route with a clearance request id could render with the wrong kind if the report was otherwise visible.

Fix:
- Added `canShowCompletionReportPreviewForRoute`.
- Preview page now returns not found when route kind and report request type differ.
- Added unit coverage.
- Added guarded e2e assertion for mismatched kind URLs.

### Fixed: latest report selection can be overwritten

`listOwnCompletionReportsForRequests` returns reports ordered by `updated_at desc`, but converting that list to a record could allow older reports later in the list to overwrite the newest report for the same request.

Fix:
- `serviceRequestCompletionReportListToRecord` now keeps the first report per request.
- Added `selectCompletionReportForRequest`.
- Added unit coverage.

### Fixed: printed source report did not retain source URL text

The source link button is hidden in print mode, so the printed report could lose the source URL even when source metadata existed.

Fix:
- Added source URL text to source lock metadata.
- Added `safeCompletionReportSourceHref`.
- Added unsafe URL tests.

### Fixed: schema fallback was silent

When completion report tables or document mapping tables were unavailable, preview could degrade into not found without user-facing recovery guidance.

Fix:
- Added user-safe fallback UI.
- Extracted fallback copy and tested that internal DB/schema terms are not exposed.

### Accepted: authenticated browser body review is blocked locally

Current `.env.local` points to a remote Supabase origin, and `E2E_TEST_PASSWORD` plus role storage states are not available. The local seed/auth/e2e scripts correctly refuse to use non-local Supabase and do not print secret values.

Follow-up:
- Run the authenticated browser review only after local Supabase and role storage states are prepared.

## Safety Checks

- Source/version/date metadata remains visible in the preview model and document.
- Safety notice still says the report is not a legal certainty tool.
- Preview read model excludes file names, question/answer raw text, bid messages, and download links.
- Seed script is local Supabase only.
- E2E runner aborts before seed when Supabase URL is not local.
- Readiness output prints origins and presence checks only, not secret values.

## Remaining Risk

- Full authenticated preview body screenshots were not captured because local auth fixture state is not ready.
- RLS behavior for the seeded preview users has script coverage prepared, but not fully executed in this environment.
- The current working tree contains broad local-only platform changes and untracked files; no commit, push, migration apply, or deployment was performed.
