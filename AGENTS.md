# AGENTS.md

## Project Identity

This repository builds a Korean customs, HS, FTA, import/export requirement, and legal-update SaaS.

Working product name: `통관이음 AI`.

The app helps Korean importers, exporters, customs brokers, and trade teams diagnose import/export issues by HS code, product name, or shipping documents.

## Non-negotiable Product Rule

Never build this as “AI remembers laws and answers directly.”

Always build as:

1. official source data
2. source snapshot/version
3. effective-date filtering
4. deterministic rule engine
5. AI explanation layer
6. staff review/approval
7. source-locked report

## Core User Journeys

### Journey A — HS code direct lookup

User selects import/export mode, enters HS/HSK, country data, and basis date. App returns HSK candidates, tariff rates, FTA options, requirements, requirement playbooks, and staff review notes.

### Journey B — Product name HS recommendation

User enters product name, usage, material, composition, functions, model, and countries. App recommends 3–5 HS candidates with reasons, confidence, missing questions, and downstream import/export preview.

### Journey C — Shipping document diagnosis

User uploads Commercial Invoice, Packing List, B/L or AWB, C/O, product catalog, and specs. App extracts line items, countries, Incoterms, quantities, unit price, total amount, and generates a diagnosis workflow.

### Journey D — Import diagnosis

Given selected HSK and countries, app shows:
- basic tariff
- WTO tariff
- FTA preferential tariff
- C/O issue method
- origin rule
- direct transport check
- customs confirmation requirements
- integrated public notice and individual-law caution
- requirement acquisition method
- customer-request template

### Journey E — Export diagnosis

Given selected HSK, destination country, final user, product specs, and use, app shows:
- export customs confirmation requirements
- integrated public notice requirements
- export control / strategic goods risk
- self-classification or expert classification guidance
- export license or situational license possibility
- FTA C/O issue possibility
- Korean-origin proof requirements
- buyer document list

## Required Architecture

Use these layers:

```text
app/
  Next.js route groups and pages
components/
  reusable UI
features/
  domain feature modules
lib/
  shared utilities
server/
  server actions, services, repositories
supabase/
  migrations, seed data, RLS policies
docs/
  specs and decision records
skills/
  Codex skills
.codex/
  Codex agent configuration
```

## Recommended Technology

- Next.js App Router
- TypeScript
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Row Level Security
- pgvector for retrieval metadata
- Tailwind CSS
- shadcn/ui
- Zod for validation
- Vitest or Jest for unit tests
- Playwright for critical flows
- PDF generation library only after MVP flow is stable

## Data Model Principles

Every legal, tariff, HS, FTA, requirement, and export-control record must include:

- `source_name`
- `source_url`
- `source_version`
- `effective_from`
- `effective_to`
- `published_at`
- `retrieved_at`
- `status`
- `checksum` where applicable

Never overwrite legal/tariff/requirement data in place. Use snapshot/version tables and publish only reviewed data.

## Basis Date Rule

All queries must use a `basis_date`.

Default: today in Asia/Seoul.

If the user enters expected declaration date, use that date.

Query pattern:

```sql
WHERE effective_from <= :basis_date
AND (effective_to IS NULL OR effective_to >= :basis_date)
AND status = 'published'
```

## Legal Safety Language

Do not output “confirmed”, “guaranteed”, “definitely applicable”, or “requirements absent” without staff approval.

Use:
- “예비진단”
- “가능성 있음”
- “추가 확인 필요”
- “담당자 검토 필요”
- “HSK 확정 후 재조회 필요”

For no customs-confirmation result, always warn:
“세관장확인대상이 아니더라도 통합공고, 개별법령, 표시·인증·유통규제 의무가 존재할 수 있습니다.”

## HS Classification Policy

AI may recommend HS candidates but must not final-confirm HS classification.

Each HS candidate must have:
- `hsk_code`
- `hs6`
- `rank`
- `confidence_score`
- `reason`
- `required_questions`
- `risk_notes`

Staff can select, reject, or confirm candidates.

## FTA Policy

FTA logic must distinguish:
- export country
- shipment country
- origin country
- manufacturing country
- seller country
- destination country

Do not assume FTA applicability from shipping country alone.

FTA output must include:
- agreement name
- preferential rate if available
- C/O type
- issue method
- issuer
- validity or notes
- origin rule
- direct transport issue
- required evidence
- staff review status

## Import/Export Requirement Policy

Separate:
- customs confirmation requirements
- integrated public notice requirements
- individual-law requirements
- domestic distribution/labeling/certification caution
- internal requirement playbook

## Export Control Policy

Export control output is only a preliminary risk screen.

Do not represent the app as a substitute for strategic goods self-classification, expert classification, export license, or legal review.

## Security Rules

- Use Supabase RLS from the first migration.
- Client users may only read/write their own company’s cases.
- Staff/admin may access assigned or all cases depending on role.
- Store uploaded documents in private buckets.
- Never log confidential invoice contents, API keys, or full personal identifiers in client logs.
- Use audit logs for legal-data changes, report generation, staff approvals, and user-visible changes.

## UI Rules

Language: Korean.

Tone: professional B2B SaaS.

Do not use casual language in app copy.

Prioritize:
- clear status badges
- source/date display
- “검토 필요” warnings
- printable report layout
- mobile-friendly tables

## Testing Requirements

Before marking work done:

1. Run TypeScript check.
2. Run lint.
3. Run relevant unit tests.
4. Confirm RLS behavior for client vs staff.
5. Confirm basis-date filtering.
6. Confirm source/version appears in generated results.
7. Confirm no AI output claims final legal certainty.

## Definition of Done

A task is done only when:
- code compiles
- tests pass or missing tests are explicitly documented
- security/RLS impact is checked
- migration is included when schema changes
- UI state handles loading/empty/error
- staff review flow is preserved for legal-risk outputs
- docs are updated when architecture or data model changes
