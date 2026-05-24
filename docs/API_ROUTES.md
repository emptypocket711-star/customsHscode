# API and Server Action Draft

Prefer server actions for simple mutations and route handlers for file upload, webhooks, and scheduled jobs.

## HS

`POST /api/hs/search-request`
Create request.

`GET /api/hs/candidates?requestId=...`
Get HS candidates.

`POST /api/hs/candidates/generate`
Generate candidates from product info.

`POST /api/hs/candidates/:id/select`
Select candidate.

## Diagnosis

`POST /api/diagnosis/import`
Generate import diagnosis draft.

`POST /api/diagnosis/export`
Generate export diagnosis draft.

`POST /api/reports/:id/submit-review`
Submit to staff review.

`POST /api/reports/:id/approve`
Approve staff-reviewed report.

## Legal Update

`POST /api/admin/legal-updates/fetch`
Trigger fetch.

`GET /api/admin/legal-updates/changes`
List pending changes.

`POST /api/admin/legal-updates/:changeId/approve`
Approve change.

`POST /api/admin/legal-updates/:changeId/reject`
Reject change.

## Documents

`POST /api/documents/upload`
Upload document to private bucket.

`POST /api/documents/:id/extract`
Extract text/data.

## Required API Safety

- Validate with Zod.
- Check role in server.
- Enforce company scope.
- Write audit logs for critical mutations.
