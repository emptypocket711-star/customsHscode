# Production Scale Plan

## Target

The production target is a public Korean customs SaaS that can support thousands of concurrent users and bursty lookup traffic without letting one slow user request block the service.

The app must not depend on AI or external customs APIs at request time for core legal, tariff, HS, FTA, import requirement, or export requirement display. Customer-facing lookup should primarily read pre-ingested, published source snapshots from Supabase/PostgreSQL.

## Current Risk

The integrated lookup page currently does too much work inside a single server-rendered request:

- HS lookup
- product-name candidate search
- AI normalization and clarification
- import tariff lookup
- internal tax lookup
- customs confirmation requirement lookup
- export requirement lookup
- destination-country tariff and requirement lookup

This is acceptable for MVP validation, but not for 1,000 to 10,000 concurrent users.

Main failure modes:

- OpenAI or public API latency increases page render time.
- DB connection count spikes when every request fans out into many queries.
- identical popular searches repeat the same work.
- long document/AI jobs consume web request capacity.
- no per-user or per-IP rate limits protect expensive routes.

## Production Architecture

Use this split before public launch:

```text
Browser
  -> CDN / WAF
  -> Next.js web tier
  -> cached read API for lookup
  -> Supabase Postgres read replicas / pooled connections

Background workers
  -> official source ingestion
  -> AI product-name expansion
  -> document extraction
  -> report generation
  -> snapshot publish workflow

Redis / durable cache
  -> lookup result cache
  -> AI result cache
  -> per-user rate limit counters
  -> job status
```

## Request-Time Rules

Customer lookup request:

1. Validate input.
2. Normalize HS code or product text.
3. Read published source data from DB.
4. Return deterministic result.
5. If AI is needed, use cached AI output first.
6. If AI cache is missing or slow, return deterministic candidates and mark AI assist as pending or unavailable.

Do not call external public data APIs during ordinary customer lookup. Use external APIs only in ingestion jobs or explicitly controlled refresh tools.

## Cache Policy

Implemented MVP fallback:

- `server/cache/lookup-cache.ts` provides an in-process TTL cache and in-flight request deduplication.
- If `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are configured, lookup cache values are also stored in Upstash Redis through the REST API.
- The integrated lookup page uses this cache for repeated HS, tariff, internal-tax, destination-country, and navigation lookups.
- This protects local/single-instance deployments and reduces duplicate work during short bursts.
- Without Upstash, it is not sufficient for multi-instance production because each server instance has its own memory.

Production requirement:

- Replace or back the cache with Redis-compatible durable cache before public launch.
- Clear or version cache keys when a legal source version is published.
- Keep confidential document contents out of shared caches.

Cache keys must include:

- direction
- query type
- normalized query
- destination country
- origin country
- basis date
- published source version identifiers

Suggested TTL:

- HS code exact lookup: 24 hours, invalidated on source publish
- HS6/HS4 lookup: 24 hours, invalidated on source publish
- destination tariff lookup: 24 hours, invalidated on source publish
- product-name AI normalization: 7 days, keyed by redacted normalized text and model
- document extraction: no public cache; store as private job result

Implemented AI cache:

- `normalizeProductSearchInput` now uses `cachedLookup`.
- The cache key stores provider, model, basis date, HS hints, and a SHA-256 hash of redacted input.
- Raw product text, invoice text, model descriptions, and contact-like values must not appear in cache keys.
- Product-name GPT normalization uses `OPENAI_PRODUCT_SEARCH_TIMEOUT_MS` and does not attach live web-search tools. Model numbers, SKUs, trade names, and short Korean product names are interpreted from visible input only; if the product cannot be identified, the app asks for category, use, material, catalog, photo, or specification details instead of performing web lookup.
- Product clarification uses `OPENAI_CLARIFICATION_TIMEOUT_MS` and falls back to deterministic guidance when the AI explanation is slow.
- Public data API calls use `PUBLIC_DATA_REQUEST_TIMEOUT_MS`.
- Do not enable live Customs API018 product-name fallback in production. Keep `CUSTOMS_API_PRODUCT_SEARCH_LIVE_ENABLED=false`, collect API018 rows into `customs_hs_code_search_items` on a scheduled basis, and query only reviewed/published stored rows during customer lookup.
- Set `LOOKUP_CACHE_DEBUG=true` only in server logs when debugging cache behavior. Logs record cache event and namespace only, never the raw query key.
- Set `LOOKUP_TELEMETRY_ENABLED=true` in server logs when checking lookup latency and AI candidate behavior. Product-name telemetry records duration, provider/model, candidate counts, source mode, and coarse input shape only. It must not log raw product names, invoice text, prompts, email addresses, tokens, or cache keys.

## Queue Policy

Move these to background jobs:

- invoice/document extraction
- PDF/OCR/XLS conversion
- GPT product-name disambiguation when uncached
- report PDF generation
- large source imports
- source checksum/diff generation

The web request should create a job, return a job id, and poll or stream progress.

Implemented MVP queue base:

- `background_jobs` stores company-scoped queued work with RLS.
- `claim_background_jobs` claims due jobs with `FOR UPDATE SKIP LOCKED`, so multiple workers can run without taking the same job.
- `server/repositories/background-job.repository.ts` exposes enqueue, claim, success, and failure helpers.
- `server/jobs/background-worker.service.ts` provides a small batch runner with retry backoff.
- `app/api/jobs/run` is a protected node runtime endpoint for cron-triggered batches.
- `server/jobs/document-extraction-job.handler.ts` downloads private storage files and processes CSV/XLSX document extraction jobs.
- Document upload can enqueue `document_extraction` jobs when `BACKGROUND_JOBS_ENABLED=true`.
- The document extraction payload stores only document metadata and private storage location, not raw invoice text.

Until a deployed worker is running, keep `BACKGROUND_JOBS_ENABLED` unset or false so local uploads continue to use the current synchronous MVP extraction path.

Worker deployment variables:

- `SUPABASE_SERVICE_ROLE_KEY`: server-only Supabase service role key. Never expose this to browser code.
- `JOB_WORKER_SECRET`: bearer token used by cron or a worker to call `/api/jobs/run`.
- `BACKGROUND_JOBS_ENABLED=true`: only enable after the cron/worker is deployed.

## Database Requirements

Use Supabase pooler or a managed Postgres pool for web traffic. Avoid one direct DB connection per serverless/function request.

Critical indexes:

- `hs_master(hsk_code, status, effective_from, effective_to)`
- `hs_master(hs6, status, effective_from, effective_to)`
- `tariff_rates(hsk_code, hs6, status, effective_from, effective_to)`
- `customs_confirmation_requirements(hsk_code, hs6, status, effective_from, effective_to)`
- `export_destination_tariff_rates(country_code, destination_hs_code, status, effective_from, effective_to)`
- `export_destination_import_requirements(country_code, destination_hs_code, data_category, status, effective_from, effective_to)`

For product-name search at scale, add `pg_trgm` indexes on Korean and English names or introduce a dedicated search service.

## Rate Limits

Implemented MVP fallback:

- `proxy.ts` applies per-IP route limits to `/hs`, `/documents`, `/duty-estimator`, `/cargo`, and `/used-car-export`.
- The default is active in production and disabled in local development unless `RATE_LIMIT_ENABLED=true`.
- If Upstash REST environment variables are configured, counters are shared across server instances.
- Without Upstash, the store is in-memory, so it is a per-instance safety guard only.

Production requirement:

- Move rate-limit counters to Redis or a WAF/CDN layer for multi-instance deployments.
- Add logged-in user and company-level quotas after billing plans are finalized.

Apply route-level limits:

- anonymous lookup: strict per-IP limit
- logged-in lookup: per-user and per-company limit
- AI-assisted product search: lower quota than direct HS lookup
- document upload/extraction: job quota and file size limit
- admin/source ingestion: staff-only, explicit audit log

Rate limiting should fail gracefully with Korean UI copy and must not reveal internal system details.

## Deployment Shape

Initial production:

- Next.js on Vercel or containerized Node web tier
- Supabase Pro or equivalent managed Postgres
- Supabase Storage private buckets
- Redis-compatible cache/rate limit store
- background worker process for jobs
- Sentry or equivalent error monitoring
- structured logs with no invoice contents or API keys

For 10,000 concurrent users:

- separate read replicas for lookup-heavy traffic
- Redis cache in front of repeated lookups
- queue workers scaled independently from web tier
- CDN cache for static assets and public non-sensitive pages
- load test before launch with expected lookup mixes

## Load Test

Use the built-in smoke load test for lookup-heavy pages:

```bash
npm run loadtest:lookup
```

Point it at a deployed URL:

```bash
LOAD_TEST_REQUESTS=300 \
LOAD_TEST_CONCURRENCY=30 \
npm run loadtest:lookup -- https://your-domain.example
```

The script exercises import exact HSK lookup, product-name lookup, export destination lookup, and overseas HS lookup. Treat this as an engineering smoke test only; run a larger tool such as k6 or Artillery before public launch.

Use the route smoke test after every production deploy:

```bash
npm run smoke:production -- https://hsfinder.co.kr
```

Without `SMOKE_COOKIE`, protected pages are expected to return the login guard. With `SMOKE_COOKIE` and `SMOKE_REQUIRE_AUTHENTICATED=true`, the script validates dashboard, HS lookup, overseas HS, duty estimator, cargo, used-car export, container check, and trade news page markers.

## Immediate Engineering Backlog

1. Add lookup result cache abstraction.
2. Add route-level rate limiting middleware.
3. Add background job table and worker for AI/document tasks.
4. Move document extraction out of server actions.
5. Add DB indexes for lookup tables.
6. Add pg_trgm indexes or search table for product-name lookup.
7. Expand load testing beyond the built-in smoke script for `/hs/direct` and `/hs/overseas`.
8. Add observability: latency, error rate, DB query count, AI timeout count.
9. Add source-publish cache invalidation.
10. Add deployment runbook with environment variables, secrets, and rollback.
