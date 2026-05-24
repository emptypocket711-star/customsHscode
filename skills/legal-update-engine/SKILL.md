---
name: legal-update-engine
description: Use for legal/source data sync, source snapshots, checksum, diff, staging, publish workflow, basis-date querying, and impacted-report detection.
---

# Legal Update Engine Skill

## Trigger

Use when implementing:
- official data update jobs
- legal snapshots
- source versioning
- checksums
- diff generation
- review queue
- publish/reject flow
- affected reports
- basis-date filtering

## Pipeline

1. Fetch source
2. Store raw snapshot
3. Compute checksum
4. Parse into staging
5. Diff against current published records
6. Create change events
7. Risk classify
8. Staff review
9. Publish
10. Mark impacted reports

## Non-negotiable

Never overwrite published legal data directly.

## Query Pattern

```sql
WHERE effective_from <= :basis_date
AND (effective_to IS NULL OR effective_to >= :basis_date)
AND status = 'published'
```

## Source Lock

Reports must lock the source snapshots and rule versions used at generation time.
