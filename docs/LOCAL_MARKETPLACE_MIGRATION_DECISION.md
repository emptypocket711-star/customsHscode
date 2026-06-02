# Local Marketplace Migration Decision

Date: 2026-06-01

Purpose: explain the current blocker for running the marketplace transaction positive E2E locally.

## Current State

- Local Supabase is running at `http://127.0.0.1:54321`.
- `.env.local` still points the app to the hosted Supabase project.
- The guarded local runner can be executed with local env overrides.
- The runner reaches the seed step, then stops because local DB schema is not on the marketplace migration level.

Observed local-only failure:

```text
marketplace local schema가 준비되지 않았습니다.
detail=column companies.contact_email does not exist
```

## Why This Blocks Positive E2E

The marketplace transaction E2E requires these schema additions:

- company marketplace columns such as `contact_email`, `verification_status`, `trust_score`
- `company_party_types`
- `partner_service_preferences`
- `service_requests`
- `freight_request_details`
- `clearance_request_details`
- `service_request_partner_matches`
- `service_bids`
- freight/clearance bid detail tables
- related RPC/RLS definitions

The seed runner now checks these before writing fixture data and fails early if the local schema is missing.

## Local-Only Options

### Option A: Apply Local Migrations

Use this only when you are ready to mutate the local Supabase database.

```bash
npx supabase migration up --local
```

Then run:

```bash
npm run e2e:marketplace-transaction:local
```

### Option B: Keep Local DB Unchanged

Do nothing for now. The scripts will continue to fail safely before seed writes.

This is acceptable when the goal is code review, typecheck, lint, build, and safe-fail verification only.

## Recommendation

Do not apply local migrations automatically from Codex unless the user explicitly asks for local DB mutation.

When the user is ready for a positive browser E2E, apply local migrations, then run the one-command local runner.
