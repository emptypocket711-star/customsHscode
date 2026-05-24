# Architecture

## High-level Flow

```text
Input
  - HS code
  - product name
  - documents
        ↓
Normalize request
        ↓
HS candidate engine
        ↓
Rule engine
  - tariff
  - FTA
  - C/O
  - import requirements
  - export requirements
  - export control
        ↓
RAG explanation layer
        ↓
Staff review
        ↓
Customer report
```

## Layers

### UI Layer

- Next.js App Router pages
- Korean B2B SaaS UI
- shadcn/ui components
- report preview components

### Domain Layer

Feature modules:
- `features/hs`
- `features/tariff`
- `features/fta`
- `features/requirements`
- `features/export-control`
- `features/documents`
- `features/reports`
- `features/legal-updates`

### Data Access Layer

Repositories:
- `server/repositories/hs.repository.ts`
- `server/repositories/tariff.repository.ts`
- `server/repositories/fta.repository.ts`
- `server/repositories/requirements.repository.ts`
- `server/repositories/legal-source.repository.ts`
- `server/repositories/report.repository.ts`

### Rule Engine Layer

Services:
- `server/rules/hs-candidate.service.ts`
- `server/rules/tariff.service.ts`
- `server/rules/fta.service.ts`
- `server/rules/requirements.service.ts`
- `server/rules/export-control.service.ts`

Rule engine must never call LLM to decide official values. It uses database records filtered by `basis_date`.

### AI Layer

AI is used for:
- product-name interpretation
- HS candidate explanation
- missing-question generation
- document extraction assistance
- customer-facing summary
- staff review checklist draft

AI is not used for:
- final HS confirmation
- final tariff determination
- final FTA applicability
- final import/export requirement judgment
- final strategic goods judgment

### Update Engine

- source fetcher
- checksum comparator
- parser
- diff generator
- staging table writer
- review queue
- publish job
- affected report finder

## Trust Boundary

Customer-visible final reports require either:
- staff approval, or
- explicit “자동 예비진단 / 담당자 검토 전” badge

## Source Locking

Every generated report stores:
- source snapshots
- rule versions
- generated_at
- basis_date
- staff reviewer if approved
