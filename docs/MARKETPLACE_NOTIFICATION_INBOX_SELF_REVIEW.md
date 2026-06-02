# Marketplace Notification Inbox Self Review

Date: 2026-06-01

Scope: P57.1-P57.7 marketplace notification inbox, partner read RLS, dashboard surface, read-state RPC, read action, and authenticated E2E readiness.

## Fixed During This Phase

- Partner read RLS exists for `marketplace_notification_deliveries` and limits partner reads to `partner_company_id = public.current_company_id()`.
- Dashboard inbox repository reads only `in_app` deliveries with `claimed` or `sent` status.
- Dashboard inbox query selects only delivery summary fields and request summary fields: title, request type, request status, and deadline.
- Request documents, questions, answers, bid messages, amounts, filenames, and delivery metadata are not selected for the dashboard inbox.
- Read state is separate from delivery send state with `read_at` and `read_by`.
- Read state mutation uses `mark_marketplace_notification_delivery_read` RPC instead of direct authenticated table update.
- Read RPC checks login, current company, partner ownership, `in_app` channel, and active delivery status before updating.
- Read RPC writes an audit log event `marketplace_notification_delivery_read`.
- E2E readiness refuses non-local Supabase origins and does not print secret values.

## Security Review

- Direct authenticated update on `marketplace_notification_deliveries` remains unavailable.
- Service role keeps delivery claim/send/fail management.
- Partner users can read their own company deliveries through RLS but cannot mark another company's delivery as read because the RPC filters by current company.
- Staff can read deliveries through staff policy, but the read RPC is intentionally partner-company scoped rather than staff-wide.
- Delivery metadata sanitizer still allows only aggregate/non-sensitive keys.

## UX Review

- The dashboard now shows partner notifications near the existing marketplace next-action queue.
- The notification item separates the detail link from the read button to avoid nested interactive elements.
- Unread count is visible as `미확인 N건`.
- Already-read notifications show `읽음` and do not show the read button.
- Empty state remains compact and does not create a dead-end screen.

## Operations Review

- Readiness script checks local Next.js, local Supabase, service-role key, fixture IDs, and partner storage state before running the authenticated dashboard E2E.
- Current `.env.local` points to remote Supabase, so the readiness script fails safely.
- No production job behavior changed.
- Migration is local draft only; it has not been applied to any database.
- Local authenticated dashboard E2E now passes with a partner storage state and a seeded in-app delivery. The browser flow verifies the partner notification panel, notification-to-opportunity navigation, bid CTA visibility, read action, and absence of raw request ID text in the dashboard.

## Remaining Risks

- The read action currently relies on default server-action error handling; a richer inline error state can be added after authenticated E2E is available.
- There is no per-user unread model yet. Read state is company-level, which is acceptable for the MVP partner workspace but may need user-level read receipts for larger teams.

## Verification

- `npx vitest run server/repositories/marketplace-notification-deliveries.repository.test.ts server/repositories/platform-marketplace-governance.test.ts features/dashboard/marketplace-notification-inbox.test.ts`
- `npx supabase db lint --local`
- `npx vitest run server/actions/marketplace-notification.actions.test.ts server/repositories/marketplace-notification-deliveries.repository.test.ts features/dashboard/marketplace-notification-inbox.test.ts`
- `node --check scripts/check_marketplace_notification_e2e_readiness.mjs`
- `node --check scripts/e2e_marketplace_notification_dashboard.mjs`
- `npm run e2e:marketplace-notification:ready`
- `npm run e2e:marketplace-notification`
- `E2E_MARKETPLACE_NOTIFICATION_PARTNER_STATE_FILE=marketplace-transaction-forwarder.json npm run e2e:marketplace-notification`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
