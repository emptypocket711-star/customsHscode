# AI-Assisted Clarification

## Purpose

AI assistance is used only to clarify incomplete product names and document extraction results.

It must not create final HS classifications, tariff results, import/export requirements, FTA applicability, or legal conclusions.

## Current Scope

- Product-name ambiguity summary
- Missing-information questions
- Invoice and packing-list extraction clarification
- Candidate reranking hints limited to official candidate codes already returned by the deterministic lookup
- Redaction of contact, business number, long numeric identifiers, and amount-like values before provider calls

## Provider Boundary

`server/ai/provider.ts` exposes a server-only provider interface.

The default implementation uses `MockAiProvider` so the feature is testable without external API keys.

If `OPENAI_API_KEY` exists and `AI_PROVIDER` is not `mock`, `OpenAiProvider` calls the OpenAI Responses API with `store: false`.

Tests force the mock provider unless `AI_PROVIDER=openai` is explicitly set.

`OPENAI_MODEL` defaults to `gpt-4.1-mini` and can be changed per environment.

GPT or Gemini adapters must:

- run only on the server
- receive redacted or minimized inputs
- return structured JSON matching `AiClarificationResult`
- never introduce HS codes outside `allowedCandidateCodes`
- avoid logging raw invoice or packing-list contents

## Data Safety

Document text should be reduced to field summaries before AI processing.

Audit logs may store provider name, model, redaction counts, and output summaries, but must not store full confidential invoice contents or API keys.

## Legal Safety

All AI output is preliminary support text.

HS confirmation remains a staff-review workflow through `hs_confirmation_requests`.
