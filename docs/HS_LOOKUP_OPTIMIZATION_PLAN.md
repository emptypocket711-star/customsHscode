# HS Lookup Optimization Plan

## Goal

HS lookup should move from request-time composition to precomputed read models.

The current implementation now parallelizes independent source queries, but it still assembles legal source rows, tariff previews, requirement summaries, origin marking data, and navigation rows during the request.

The long-term target is:

1. source snapshot tables remain authoritative
2. publish/review flow updates read models
3. lookup pages read from compact snapshot/RPC outputs
4. heavy detail sections load progressively

## Lookup Modes

### HSK 10-digit detail

Use `hsk_lookup_snapshot`.

One row per effective HSK and basis-date-valid source window:

- `hsk_code`
- `hs6`
- `korean_name`
- `brief_description`
- `tariff_summary_json`
- `requirement_summary_json`
- `origin_marking_summary_json`
- `source_name`
- `source_version`
- `effective_from`
- `effective_to`
- `status`
- `checksum`

The page should render the first screen from this row, then lazy-load detailed playbooks, statistics, overseas data, and report sections.

### HS 6-digit explorer

Use `hs6_lookup_snapshot`.

One row per HS6:

- `hs6`
- `hs4`
- `label`
- `child_hsk_count`
- `children_json`
- `basis source metadata`

The page should show a selection table of child HSK rows, not a final-classification result.

### HS 4-digit explorer

Use `hs4_lookup_snapshot`.

One row per HS4:

- `hs4`
- `label`
- `child_hs6_count`
- `child_hsk_count`
- `hs6_groups_json`
- `basis source metadata`

The page should show grouped HS6 folders and child HSK rows.

## RPC Shape

Add server-side RPCs so the app makes one DB round trip for the first screen:

- `lookup_hsk_detail(p_code text, p_basis_date date)`
- `lookup_hs6_explorer(p_hs6 text, p_basis_date date)`
- `lookup_hs4_explorer(p_hs4 text, p_basis_date date)`

Each RPC must apply:

```sql
effective_from <= p_basis_date
and (effective_to is null or effective_to >= p_basis_date)
and status = 'published'
```

## Cache Strategy

- Cache GPT product-name normalization by provider, model, basis date, and redacted input hash.
- Cache read-model RPC outputs by code and basis date.
- Invalidate read-model cache when a source version is published.

## Migration Path

1. Keep the existing repository as fallback.
2. Add read-model tables and refresh functions.
3. Populate read models from current published source data.
4. Switch 4/6 explorer lookup to snapshot-first/fallback-second.
5. Switch 10-digit lookup to snapshot-first/fallback-second after detail parity.
6. Split heavy sections into lazy-loaded server actions or API routes.

## Current Implementation Note

The HS4/HS6 explorer modes use snapshot-first lookup because those screens only need grouped child HSK rows and summary columns.

The HSK 10-digit detail RPC now includes the user-visible first-screen parity needed for snapshot-first lookup: standard product names, same-HS6 siblings, tariff previews, import requirements with agency contacts and playbooks, and origin marking target/method summaries. If a snapshot row is missing for the requested basis date, the repository falls back to the source-table composition path.

Snapshot refresh functions force the refresh transaction timezone to `Asia/Seoul`, so `current_date` in the materialized read model matches the app's default basis-date rule.

The declaration-name statistics section is no longer part of the initial `/hs/direct` server render. The detail page renders the primary HSK, tariff, origin-marking, standard-name, and requirement data first, then loads declaration-name statistics through `/api/hs/navigation-stats`.

The read-model refresh is exposed through the protected `/api/jobs/hs-lookup-snapshots` job route and scheduled in Vercel cron at `10 15 * * *` UTC, which is 00:10 KST. This refreshes `domestic_hs_lookup_snapshots`, `hs6_lookup_snapshot`, and `hs4_lookup_snapshot` together through `refresh_hs_lookup_snapshots()`. The refresh function sets its transaction timezone to `Asia/Seoul` and raises the local statement timeout for the materialized-view refresh only.

HS4/HS6 explorer RPCs now strip detail-only child JSON fields before returning payloads to the app. The materialized views still keep the full snapshot rows, but `lookup_hs4_explorer` and `lookup_hs6_explorer` omit `internal_taxes`, coverage flags, derived counts, and refresh metadata from nested HSK children. The explorer screens keep tariff and requirement summaries for the selection table, while 10-digit detail lookup remains the source for full detail sections.
