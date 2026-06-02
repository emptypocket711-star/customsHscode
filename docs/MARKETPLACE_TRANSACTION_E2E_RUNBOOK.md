# Marketplace Transaction E2E Runbook

Date: 2026-06-01

Purpose: run the guarded local E2E for the marketplace transaction path:

1. requester owns freight and clearance requests
2. forwarder can open the freight opportunity
3. customs broker can open the clearance opportunity
4. unauthenticated users are redirected to login

## Safety Rules

- Run this only against local Next.js and local Supabase.
- Do not run the seed or auth-state scripts against the hosted Supabase project.
- Do not print or commit `SUPABASE_SERVICE_ROLE_KEY`, `E2E_TEST_PASSWORD`, session cookies, storage state JSON, invoice contents, document filenames, or real customer data.
- The fixture is synthetic and must not be used as legal, HS, tariff, or customs-confirmation evidence.

## Required Local Services

1. Local Supabase is running.
2. Local migrations are applied.
3. Next.js is running at `http://localhost:3100` or another local URL set with `E2E_BASE_URL`.

The current `.env.local` points to a remote Supabase origin, so these scripts are expected to fail safely until local Supabase env values are provided.

## Required Env

```bash
export SUPABASE_URL=http://127.0.0.1:54321
export NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
export SUPABASE_SERVICE_ROLE_KEY=...
export E2E_TEST_PASSWORD=...
export E2E_BASE_URL=http://localhost:3100
```

Use the local service-role key from the local Supabase stack only.

## Run Order

One-command local run:

```bash
npm run e2e:marketplace-transaction:local
```

This command preflights local Next.js, local Supabase, local service-role key, and `E2E_TEST_PASSWORD`, then runs seed, auth-state creation, readiness, static rendering E2E, and mutation E2E in order. It fills the synthetic fixture ID env values internally.

Manual run:

1. Check readiness.

```bash
npm run e2e:marketplace-transaction:ready
```

2. Seed synthetic requester, forwarder, broker, requests, matches, and bids.

```bash
npm run e2e:marketplace-transaction:seed
```

3. Copy the non-secret export hints printed by the seed command.

```bash
export E2E_MARKETPLACE_FREIGHT_REQUEST_ID=75000000-0000-4000-8000-000000000001
export E2E_MARKETPLACE_FREIGHT_BID_ID=75000000-0000-4000-8000-000000000003
export E2E_MARKETPLACE_CLEARANCE_REQUEST_ID=75000000-0000-4000-8000-000000000002
export E2E_MARKETPLACE_CLEARANCE_BID_ID=75000000-0000-4000-8000-000000000004
```

4. Create requester, forwarder, and broker Playwright storage states.

```bash
npm run e2e:marketplace-transaction:auth
```

Generated files:

```text
tmp/e2e-auth/marketplace-transaction-requester.json
tmp/e2e-auth/marketplace-transaction-forwarder.json
tmp/e2e-auth/marketplace-transaction-broker.json
```

5. Re-check readiness.

```bash
npm run e2e:marketplace-transaction:ready
```

6. Run the guarded E2E.

```bash
npm run e2e:marketplace-transaction
```

7. Run the guarded mutation E2E.

```bash
npm run e2e:marketplace-transaction:mutation
```

## Expected Safe Failures

- Remote Supabase origin: seed/auth/readiness refuse to proceed.
- Missing `E2E_TEST_PASSWORD`: seed/auth/readiness fail before writing session state.
- Missing fixture env exports: E2E fails before browser assertions.
- Missing storage state files: E2E fails before authenticated page checks.
- Stopped local Next.js server: readiness fails on `/login` reachability.

## Review Notes

- The seed uses service-role access only after local-origin checks pass.
- The auth-state script checks both local app URL and local Supabase origin before browser login.
- The static E2E verifies protected route access and role-specific page reachability.
- The mutation E2E submits synthetic freight/clearance bids and selects them through the requester UI, but it still depends on local Supabase and generated storage states for positive execution.

## Cleanup

role별 Playwright storage state를 정리하려면 먼저 dry-run으로 삭제 대상을 확인한다.

```bash
npm run e2e:storage:cleanup
```

실제로 삭제할 때만 `-- --apply`를 붙인다.

```bash
npm run e2e:storage:cleanup -- --apply
```
