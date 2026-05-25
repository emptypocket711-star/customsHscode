# Roadmap

운영 작업 기록은 [WORK_LOG.md](./WORK_LOG.md), 주요 제품·기술 결정은 [DECISIONS.md](./DECISIONS.md)에 별도로 남긴다.

## Phase 0 — Project Bootstrap

- Next.js project
- Tailwind/shadcn
- Supabase client/server setup
- app shell
- auth placeholder
- route groups

## Phase 1 — Schema and RLS

- core schema
- roles
- companies
- hs requests
- candidates
- reports
- legal source snapshots
- audit logs
- RLS policies

## Phase 2 — HS Direct Lookup

- input form
- HSK candidate display
- mock HS data seed
- basis date UI
- source footer

## Phase 3 — Product Name HS Recommendation

- product info form
- candidate generator abstraction
- mock heuristic generator
- required questions
- staff select/reject/confirm

## Phase 4 — Import Diagnosis

- tariff result placeholder
- FTA placeholder
- import requirement placeholder
- requirement playbook placeholder
- customer request template

## Phase 5 — Export Diagnosis

- export requirement placeholder
- export-control preliminary screen
- FTA C/O for export
- buyer document list

## Phase 6 — Legal Update Engine

- snapshot upload/import
- checksum
- diff events
- review dashboard
- publish/reject
- impacted report marking

## Phase 7 — Document Upload

- private storage
- document metadata
- extracted line items
- manual correction UI
- connect to HS recommendation

## Phase 8 — Report Output

- report preview
- source locks
- staff approval
- PDF download

## Phase 9 — Billing

- plans
- case limits
- report credits
- paid report checkout

## Phase 10 — AI-Assisted Clarification

- provider adapter for GPT/Gemini behind a server-only interface
- product-name ambiguity detector
- invoice and packing-list extraction assist for varied formats
- AI-generated missing-information questions
- GPT product-name normalization returns provisional HS4/HS6/HSK lookup hints first, then official HS/tariff/requirement data is used for detail expansion and downstream checks
- invoice HS code conflict check against product description
- redacted prompt/audit logging without confidential document contents
- staff-review handoff for user-selected HS confirmation requests

## Launch Backlog

1. Improve dashboard and direct lookup density for daily broker/forwarder use.
2. Expand destination-country HS, tariff, internal tax, requirement datasets beyond the current priority countries.
3. Replace temporary internal-tax law rules with official HS-mapped internal-tax data once received.
4. Keep document upload hidden from ordinary users until OCR/XLS conversion workers are deployed.
5. Add production observability for lookup latency, AI timeout count, cache hit rate, and rate-limit events.
6. Add source-publish cache invalidation and scheduled monthly Customs API018 ingestion.
7. Load-test `/hs/direct`, `/hs/overseas`, `/dashboard`, and login flows before wider launch.
