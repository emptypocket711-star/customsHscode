# Phase 0/1 Implementation Notes

## Scope

Implemented the MVP skeleton for `HS FINDER`:

- Next.js App Router shell
- Korean B2B dashboard and entry flows
- HS direct lookup request form
- product-name HS recommendation request form
- placeholder pages for import/export diagnosis, document upload, and legal update center
- Supabase core schema migration with role model and RLS policies

## Legal Safety

The UI intentionally uses preliminary language only:

- 예비진단
- 가능성 있음
- 추가 확인 필요
- 담당자 검토 필요
- HSK 확정 후 재조회 필요

No page claims final HS classification, tariff, FTA applicability, requirements absence, or export-control status.

## Data Safety

The initial migration stores legal, tariff, HS, FTA, requirement, export-control, and source snapshot data as versioned records with:

- source_name
- source_url
- source_version
- effective_from
- effective_to
- published_at
- retrieved_at
- status
- checksum

Business queries and repositories must filter by `basis_date` and `status = 'published'` before user-visible legal output.

## Mock and Placeholder Areas

- Dashboard counters are static until authenticated Supabase queries are added.
- HS direct lookup can render mock published records for basis-date filtering verification.
- Product-name HS recommendation can render 3-5 mock heuristic candidates with required questions, risk notes, confidence scores, and staff review status.
- Import diagnosis can render mock tariff, FTA/C/O, import requirement, and playbook sections using basis-date filtering.
- Export diagnosis can render mock export requirements, export-control preliminary risk, FTA C/O, origin evidence, and buyer document sections.
- Legal update center can render mock source snapshots, checksum tracking, change events, risk review queue, publish blocking, and impacted report queue.
- Document upload can render mock private metadata, extraction workflow, extracted line items, and correction queue.
- Report preview can render source locks, staff review status, printable sections, and report disclaimer.
- Billing can render mock plans, case limits, report credits, staff review credits, and checkout intent state.
- Staff review center can render HS candidate, report approval, and legal change review queues with staff/admin-only approval assumptions.
- Diagnosis result sections still use mock rule data.
- Deterministic tariff/FTA/requirement engines are not implemented in Phase 0/1.

## Phase 2 Seed Stub

`supabase/seed/phase_2_mock_hs_data.sql` adds a small published HSK sample for local development. It is not official legal data and must be replaced by source snapshot ingestion before production use.

`supabase/seed/phase_4_mock_import_diagnosis.sql` adds minimal mock tariff and import requirement rows for local development. These rows are not official legal data.

`supabase/seed/phase_5_mock_export_diagnosis.sql` adds minimal mock export-control and export requirement rows for local development. These rows are not official legal data and do not replace strategic-goods self-classification or expert classification.

`supabase/migrations/20260521150000_document_upload_metadata.sql` adds private document metadata and extracted line item tables with company-scoped RLS.

`supabase/migrations/20260521170000_billing_schema.sql` adds billing plans, company subscriptions, checkout intents, and credit ledger tables with company-scoped RLS.

`supabase/migrations/20260521180000_staff_review_workflow.sql` adds review assignment tracking for staff/admin workflows.

`supabase/migrations/20260521190000_staff_review_rpcs.sql` adds atomic staff review RPCs for HS candidates, reports, and legal change events. Each RPC updates review state and audit metadata in one database function call.

## Local Verification Blocker

This workspace currently does not have the Supabase CLI or Docker available, so migrations could not be applied to a local Supabase instance from this environment.

Staff-only operational pages now use a server-side role guard:

- With Supabase env configured: `profiles.role in ('admin', 'customs_staff')` is required.
- Without Supabase env: mock staff mode is shown so the scaffold remains browsable.
- Client users should not be able to access staff review or legal update operations after Supabase Auth is connected.

## Supabase-backed Fallbacks

Import diagnosis now uses a Supabase-backed repository when Supabase env is configured. It reads `hs_master`, `tariff_rates`, `fta_agreements`, `fta_rates`, `fta_psr`, customs confirmation requirements, integrated public notice requirements, and requirement playbooks with basis-date filtering. If Supabase is unavailable or query execution fails, it falls back to deterministic mock data.

## Document Extraction Adapter

The document workflow now includes a deterministic extraction adapter preview. It detects common document types and maps varied labels such as `Invoice No`, `B/L No`, `POL`, `POD`, `Description of Goods`, `Qty`, and `Amount` into a normalized shipment schema. This is still a preliminary extraction layer: extracted values carry evidence snippets, confidence scores, and correction requirements before HS or legal diagnosis.

`server/repositories/document-extraction.repository.ts` persists normalized extraction results into `extracted_document_line_items` and updates `case_documents.status` to `extracted` or `needs_correction`. Re-extraction replaces the candidate line items for the same document. The server action skeleton in `server/actions/document-extraction.actions.ts` keeps raw document text out of client logs and stores only normalized fields plus evidence snippets in the private database path.

The staff review center now includes a document extraction correction queue. Pending `extracted_document_line_items` are shown separately from HS candidates so staff can correct product, model, country, Incoterms, and amount fields before downstream HS recommendation or import/export diagnosis.

`supabase/migrations/20260521200000_document_line_hs_request_rpc.sql` adds a staff-only RPC that promotes a reviewed document line item into a new `hs_search_requests` row with `search_type = 'document'`. This avoids weakening client RLS insert rules while still allowing customs staff to create downstream HS requests for the client's company after document correction.

After a document line item is promoted, `server/repositories/hs-candidate.repository.ts` creates preliminary HS candidates for the new request using the deterministic recommendation service. Candidates remain `suggested` and must still go through staff review before any downstream diagnosis treats the HSK as selected or confirmed.

When staff approves an HS candidate, `server/repositories/report-draft.repository.ts` now creates a pending-review `ai_reports` draft and corresponding `report_source_locks`. The report remains a preliminary draft with legal-safety language and must be separately reviewed before customer-facing publication.

`supabase/migrations/20260521210000_document_line_correction_rpc.sql` adds a staff-only document line correction RPC. The staff review UI now includes editable fields for product, model, countries, Incoterms, quantity, unit price, total amount, currency, and remaining correction items. Corrections are written through a server action and recorded in `audit_logs`.

`server/actions/document-upload.actions.ts` and `server/repositories/document-upload.repository.ts` add the first real upload path. Authenticated company users can create a `search_type = 'document'` request, upload one PDF/image/Excel/CSV file to the private `case-documents` bucket, calculate a SHA-256 checksum, and insert `case_documents` metadata without logging document contents.

`server/rules/document-file-text.service.ts` attempts automatic text extraction for XLSX and CSV uploads so Commercial Invoice rows can be saved without manual copy/paste. Legacy XLS files are accepted for storage, but should be converted to XLSX or CSV for automatic extraction.

`app/login/page.tsx`, `features/auth/auth-form.tsx`, and `server/actions/auth.actions.ts` add Supabase email/password login and signup. `20260524038000_auth_signup_profile_trigger.sql` creates a company and client profile automatically when a new Supabase Auth user is created, and provides `ensure_client_profile` for existing users without a profile.

Official API integration scaffolding was added for 공공데이터포털/관세청 OpenAPI. `server/integrations/public-data/client.ts` builds authenticated requests and returns raw source snapshots with checksum. `server/integrations/customs/customs-api.ts` defines connector entries for customs confirmation target goods, customs exchange rates, and cargo clearance progress. Actual use requires a 공공데이터포털 service key and each API endpoint URL in `.env.local`.

Official Customs Excel ingestion was scaffolded in `scripts/generate_customs_excel_seed.py`. It reads the downloaded HS code, standard product name, domestic tariff, and country-by-country destination tariff files from `~/Downloads` and generates seed SQL with `staged` status plus source metadata and checksums. `supabase/migrations/20260521220000_export_destination_tariff_rates.sql` adds a separate export reference table for destination-country tariff schedules.

Export diagnosis now includes destination-country tariff references from `export_destination_tariff_rates` via `server/repositories/export-destination-tariff.repository.ts`. These rates are displayed only as overseas import-duty reference material and remain marked `담당자 검토 필요` because local destination-country HS classification and current customs practice must still be confirmed.

`supabase/migrations/20260521230000_publish_legal_source_version_rpc.sql` adds a staff-only source publish RPC. The legal update center now exposes a source-version publish panel for the official Customs Excel seed data, including prefix publishing for country-by-country export destination tariffs.

`supabase/migrations/20260521240000_legal_source_inventory_rpc.sql` adds a staff-only inventory RPC. The legal update center now displays row counts by target table, source version, and status so staff can see staged/published source coverage before publishing or diagnosing with official data.

`supabase/migrations/20260524030000_publish_all_lookup_sources.sql` refreshes the publish and inventory RPCs so the same source-version workflow covers internal tax law rules, destination customs codes, additional tariffs, and trade-remedy cases.

`supabase/migrations/20260524032000_exchange_rate_snapshot_rpc.sql` adds a constrained API012 exchange-rate snapshot RPC. The duty estimator can now store redacted source metadata/checksum in `legal_source_snapshots` after a successful customs exchange-rate lookup.
