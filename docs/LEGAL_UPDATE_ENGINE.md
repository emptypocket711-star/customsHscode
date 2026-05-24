# Legal Update Engine

## Purpose

Keep legal, tariff, HS, FTA, requirement, and export-control data current without relying on AI memory.

## Pipeline

```text
Fetch official source
↓
Save raw snapshot
↓
Compute checksum
↓
Parse to normalized staging table
↓
Diff against latest published version
↓
Create legal_change_events
↓
Classify risk
↓
Human review
↓
Publish
↓
Invalidate affected caches
↓
Flag affected reports and HS pages
```

## Update Targets

- laws
- enforcement decrees
- enforcement rules
- administrative notices
- HS master
- standard product names
- tariff rates
- customs confirmation requirements
- FTA rates
- PSR
- C/O issue rules
- export control rules
- requirement playbooks

## Snapshot Table

`legal_source_snapshots`

Fields:
- id
- source_type
- source_name
- source_url
- source_version
- published_at
- retrieved_at
- effective_from
- effective_to
- checksum
- raw_file_path
- status: fetched | parsed | reviewed | published | rejected
- created_by
- reviewed_by
- reviewed_at

## Change Event Table

`legal_change_events`

Fields:
- id
- snapshot_id
- source_type
- law_name
- article_no
- notice_name
- hsk_code
- change_type
- old_value
- new_value
- effective_from
- effective_to
- impact_area
- risk_level
- review_status
- created_at

## Risk Rules

Critical:
- tariff rate changed
- import/export requirement added or removed
- export control condition changed
- FTA rate or PSR changed
- legal effective date changed retroactively

High:
- requirement document name changed
- related law changed
- C/O issue method changed
- direct transport evidence changed

Medium:
- explanatory text changed
- agency name changed
- application method changed

Low:
- typo or formatting only

## Publish Rule

Do not publish medium/high/critical changes without staff review.

## Report Impact Rule

When published data changes:
- find reports generated in last 180 days for affected HSK or agreement
- mark them as `source_changed_after_generation`
- show staff a recheck queue
- do not silently alter old reports

## Query Rule

All business queries must use:

```sql
WHERE effective_from <= :basis_date
AND (effective_to IS NULL OR effective_to >= :basis_date)
AND status = 'published'
```

## Staff Dashboard

Required views:
- last successful fetch per source
- failed jobs
- pending changes
- diff preview
- impacted HS codes
- impacted reports
- approve/reject actions
- reviewer note
