# Prompt 03 — HS Direct Lookup

Read skills/hs-classification/SKILL.md and docs/RAG_AND_RULE_ENGINE.md.

Implement HS CODE direct lookup.

Inputs:
- direction import/export
- HS/HSK code
- origin country
- export country
- shipment country
- destination country
- basis date

Behavior:
- if HS6 entered, show HSK candidate selection required
- query hs_master by basis date and status
- show 품명, 표준품명 if available
- show source footer
- do not show final legal results yet
- create hs_search_requests record

Add tests for basis-date filtering.
