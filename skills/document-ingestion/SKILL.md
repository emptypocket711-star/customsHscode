---
name: document-ingestion
description: Use for shipping document upload, OCR/text extraction, invoice/packing/B/L parsing, line item normalization, and manual correction UI.
---

# Document Ingestion Skill

## Trigger

Use for:
- Commercial Invoice upload
- Packing List upload
- B/L or AWB upload
- C/O upload
- product catalog upload
- document extraction
- line item normalization

## Extract Fields

- exporter
- importer
- seller
- buyer
- manufacturer
- invoice no
- B/L or AWB no
- Incoterms
- origin country
- shipment country
- destination country
- product name
- model
- specification
- quantity
- unit
- unit price
- total amount
- currency
- package count
- gross/net weight

## Safety

Do not assume extracted text is correct.
Always show manual correction UI before diagnosis.
Do not log full document text to browser console.
