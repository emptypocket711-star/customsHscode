Read these files first:

- AGENTS.md
- PLANS.md
- docs/PRODUCT_SPEC.md
- docs/ARCHITECTURE.md
- docs/DB_SCHEMA.md
- docs/ROADMAP.md
- docs/LEGAL_UPDATE_ENGINE.md

Then build Phase 0 and Phase 1.

Goal:
Create a Next.js + TypeScript + Supabase MVP skeleton for a Korean customs diagnosis SaaS named “HS FINDER”.

Implement:

1. Project structure
2. Supabase schema migrations for core tables
3. Role model: admin, customs_staff, client
4. RLS policies
5. Main dashboard
6. Entry page with:
   - 수입 진단
   - 수출 진단
   - 선적서류 업로드
   - HS CODE로 조회
   - 품명으로 HS 추천
7. HS search request creation flow
8. Placeholder pages for:
   - HS direct lookup
   - product-name HS recommendation
   - import diagnosis
   - export diagnosis
   - legal update center
9. All pages in Korean B2B SaaS tone
10. Source/version placeholders in result components

Important:
Do not implement final legal judgment.
Do not claim HS, FTA, tariff, requirement, or export-control results are confirmed.
All legal-risk outputs must show “담당자 검토 필요”.

After implementation:
- run typecheck
- run lint
- summarize files changed
- summarize what is still mock data
- create next-task recommendations
