# Security and Compliance

## Sensitive Data

Uploaded documents can include:
- business counterparties
- prices
- product models
- logistics routes
- personal contact details
- confidential product specs

Treat all uploads as private.

## Storage

- Use private Supabase buckets.
- Use signed URLs with short expiry.
- Do not expose raw storage path to unauthorized users.
- Do not log document text in browser console.

## RLS

Implement RLS before UI polish.

Client user:
- can only access own company records

Customs staff:
- can access assigned cases or all cases depending on policy

Admin:
- can manage all data

## Audit Logging

Audit:
- report generation
- report approval
- HS candidate staff confirmation
- legal data publish/reject
- source snapshot import
- user role change
- document upload/delete

## Legal Safety

Customer-visible reports must not guarantee:
- HS classification
- FTA applicability
- C/O acceptability
- import/export requirement absence
- export-control non-applicability

Use preliminary diagnosis wording unless approved by a qualified staff user.
