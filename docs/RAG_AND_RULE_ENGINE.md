# RAG and Rule Engine

## Rule Engine

The rule engine answers structured questions:

- Which tariff rates apply to HSK on basis date?
- Which FTA agreements are candidates based on origin/destination country?
- Which C/O issue method is listed?
- Which PSR applies for agreement and HS version?
- Which customs confirmation requirements apply?
- Which export-control check records are relevant?

The rule engine never relies on LLM memory.

## RAG Layer

RAG is used for explanatory text and staff support.

Every chunk must have metadata:
- source_name
- source_url
- law_name
- article_no
- hsk_code
- agreement_id
- requirement_document_name
- effective_from
- effective_to
- retrieved_at
- status

RAG retrieval must filter by:
- status = published
- effective date range
- direction import/export
- relevant hsk or hs6
- relevant law or agreement

## AI Prompt Contract

The AI must follow:

```text
You may only use provided rule-engine outputs and retrieved source chunks.
Do not infer official tariff, FTA, requirement, or legal results from memory.
If source data is missing, say "공식 데이터 확인 필요" or "담당자 검토 필요".
Use Korean professional B2B tone.
Do not final-confirm HS classification, FTA applicability, import/export requirement status, or export-control status.
```

## Output Schema

### HS candidate explanation

```json
{
  "hsk_code": "string",
  "hs6": "string",
  "rank": 1,
  "confidence_score": 0.72,
  "reason": "string",
  "required_questions": ["string"],
  "risk_notes": "string"
}
```

### Diagnosis report

```json
{
  "basis_date": "YYYY-MM-DD",
  "mode": "import|export",
  "hs_candidates": [],
  "selected_hsk": null,
  "tariff_summary": {},
  "fta_summary": {},
  "requirement_summary": {},
  "export_control_summary": {},
  "customer_request_items": [],
  "staff_review_points": [],
  "source_refs": []
}
```
