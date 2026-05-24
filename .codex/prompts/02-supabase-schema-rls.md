# Prompt 02 — Supabase Schema and RLS

Read AGENTS.md, docs/DB_SCHEMA.md, docs/SECURITY_COMPLIANCE.md.

Implement Phase 1.

Create Supabase migrations for:
- profiles
- companies
- hs_search_requests
- hs_candidates
- hs_master
- standard_product_names
- tariff_rates
- fta_agreements
- fta_rates
- fta_psr
- hs_version_crosswalk
- customs_confirmation_requirements
- integrated_public_notice_requirements
- requirement_playbooks
- export_control_checks
- ai_reports
- legal_source_snapshots
- legal_change_events
- report_source_locks
- audit_logs

Add RLS:
- client can only access own company data
- customs_staff can access cases and reports
- admin can access all
- only staff/admin can approve reports
- only staff/admin can publish legal source changes

Add seed data for a few mock HS records clearly marked as mock.

Run migrations locally if possible.
