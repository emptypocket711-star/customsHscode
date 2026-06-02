# Marketplace Transaction E2E Fixture Plan

Date: 2026-06-01

Purpose: define the local-only fixture contract needed to verify the core platform transaction flow: requester creates/publishes a request, partner submits a bid, and requester can review/select the bid.

## Guardrails

- Run only against local Next.js and local Supabase.
- Refuse remote Supabase origins.
- Do not print service-role keys, passwords, session cookies, invoice text, document filenames, or personal identifiers.
- Use synthetic IDs, synthetic emails, and synthetic request titles.
- Do not upload real files for this E2E; document upload/storage should remain a separate private-bucket test.

## Required Roles

| Role | Storage state | Company state | Purpose |
| --- | --- | --- | --- |
| requester | `tmp/e2e-auth/marketplace-transaction-requester.json` | active domestic shipper company | opens own freight/clearance request detail and compares bids |
| forwarder | `tmp/e2e-auth/marketplace-transaction-forwarder.json` | active verified forwarder company | opens matched freight opportunity and submits/verifies freight bid UI |
| broker | `tmp/e2e-auth/marketplace-transaction-broker.json` | active verified customs broker company | opens matched clearance opportunity and submits/verifies clearance bid UI |

## Required Fixture Environment

```text
E2E_MARKETPLACE_FREIGHT_REQUEST_ID
E2E_MARKETPLACE_FREIGHT_BID_ID
E2E_MARKETPLACE_CLEARANCE_REQUEST_ID
E2E_MARKETPLACE_CLEARANCE_BID_ID
E2E_TEST_PASSWORD
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

## Seed Data Contract

- Requester company has `domestic_shipper` party type.
- Forwarder company has `forwarder` party type, active marketplace verification, and matching freight preference.
- Broker company has `customs_broker` party type, active marketplace verification, and matching clearance preference.
- Freight request:
  - `request_type = freight`
  - status suitable for bid comparison, preferably `bids_received`
  - selected route and cargo fields are synthetic
  - one active freight bid from the forwarder exists
- Clearance request:
  - `request_type = clearance`
  - status suitable for bid comparison, preferably `bids_received`
  - HSK/sample goods fields are synthetic and marked as preliminary
  - one active clearance bid from the broker exists

## E2E Assertions

1. Unauthenticated request detail URLs redirect to `/login`.
2. Requester can open freight request detail.
3. Requester can open clearance request detail.
4. Forwarder can open freight opportunity detail.
5. Broker can open clearance opportunity detail.
6. Requester detail pages show bid/quote comparison language.
7. Partner opportunity pages show bid/quote submission or submitted bid language.
8. No raw fixture IDs, document filenames, questions, answers, bid messages, or file download controls are asserted as user-facing requirements.

## Seed Runner Status

The local-only seed runner now:

1. validates local Supabase origin
2. creates or updates the three users with `E2E_TEST_PASSWORD`
3. creates companies, party types, preferences, requests, matches, and bids
4. prints only non-secret fixture IDs
5. writes env export hints for the readiness script

## Storage State Status

The local-only auth-state script now logs in the seeded requester, forwarder, and broker accounts and writes the expected Playwright storage state files. It refuses to run if either the Next.js base URL or the Supabase origin is not local.

## Next Implementation Step

Write the local runbook for seed, auth-state creation, readiness, and the guarded E2E execution order.
