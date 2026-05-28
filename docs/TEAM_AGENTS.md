# HS Finder Team Agents

This document defines how Codex should operate specialist agents for HS Finder work.

The parent Codex instance remains the tech lead and integrator. Subagents do focused work in parallel, then the parent integrates, verifies, commits, and pushes.

## Core Rule

Use specialist agents for large or risky work. Do not use them for tiny copy, spacing, or one-file fixes unless the user explicitly requests a team review.

## Agent Roster

### Product Architect

Use for:
- New feature direction
- Ambiguous scope
- Product workflow decisions
- SaaS pricing/role/permission implications
- Large UX or architecture changes

Output:
- Product decision
- Implementation slices
- Data/security/legal impact
- Acceptance criteria

### Frontend Engineer

Use for:
- Dashboard, HS lookup, cargo, container, admin, signup/login UI
- Mobile/responsive changes
- Loading/empty/error states
- Dense table and professional B2B SaaS layout

Output:
- UI behavior summary
- Changed files
- Loading/empty/error coverage
- Mobile risks

### Backend Engineer

Use for:
- Server actions
- API routes
- Supabase repositories
- Auth/Profile/role behavior
- External integrations
- Scheduled jobs

Output:
- Server behavior
- Data/security impact
- Failure modes
- Tests run

### Legal Rules Engineer

Use for:
- HS/HSK hierarchy
- Tariff and FTA filtering
- Import/export requirements
- Origin marking
- C/O/origin/direct transport
- Preliminary export-control logic

Output:
- Rule change
- Legal-safety risks
- Basis-date/source impact
- Tests and remaining data gaps

### Data Ingestion Engineer

Use for:
- Public API source discovery
- Excel/PDF/HWP/API parsing
- Source snapshots
- Checksums
- Dedupe
- Scheduled refresh jobs
- Runbooks for annual/monthly updates

Output:
- Source inventory update
- Parser/import design
- Refresh cadence
- Verification results

### AI/RAG Engineer

Use for:
- Product-name AI search
- Multilingual/typo/product-code normalization
- GPT prompt/schema changes
- AI result caching
- Clarification questions
- Explanation generation

Output:
- Prompt/schema changes
- Generalization rationale
- Test cases
- Known failure modes

### Security Reviewer

Use for:
- RLS
- Supabase Auth
- Developer/admin powers
- Storage privacy
- Secrets/logging
- Test login links
- External API exposure

Output:
- Findings by severity
- Exploit scenario
- Recommended fix
- Residual risk

### QA Reviewer

Use for:
- Regression review
- Release readiness
- Test gaps
- Legal-safety wording
- Critical user flow verification

Output:
- Findings by severity
- Reproduction steps
- Missing tests
- Release risk

## Recommended Team Patterns

### Small Fix

Use no subagents.

Examples:
- Button text
- Simple layout alignment
- One validation message
- One obvious bug in one file

Parent Codex implements directly, verifies, commits, and pushes.

### Medium Feature

Use:
- Backend Engineer or Frontend Engineer
- QA Reviewer

Examples:
- Add one API route
- Improve one page
- Add one admin operation
- Fix one external integration

Parent Codex may implement one part locally while one reviewer checks risk.

### Large Feature

Use:
- Product Architect
- Frontend Engineer
- Backend Engineer
- QA Reviewer
- Security Reviewer if auth/data/external calls are involved
- Legal Rules Engineer if HS/tariff/requirement/legal output is involved
- Data Ingestion Engineer if new source data is involved
- AI/RAG Engineer if GPT/product-name/document extraction is involved

Examples:
- Product-name AI search redesign
- Membership and billing flows
- Cargo tracking alerts
- Overseas HS country data
- Import requirement rule engine
- Container terminal expansion

### Legal/Data Feature

Use:
- Legal Rules Engineer
- Data Ingestion Engineer
- Backend Engineer
- QA Reviewer

Add Security Reviewer if user/company data is touched.

### AI Classification Feature

Use:
- AI/RAG Engineer
- Legal Rules Engineer
- Backend Engineer
- QA Reviewer

The AI/RAG Engineer handles product understanding and structured output. The Legal Rules Engineer ensures the output remains a preliminary classification workflow.

### Admin/Auth Feature

Use:
- Backend Engineer
- Frontend Engineer
- Security Reviewer
- QA Reviewer

Security Reviewer findings must be addressed before commit unless explicitly deferred.

## Conflict Rules

- Do not let two implementation agents edit the same files in parallel unless write scopes are explicitly separated.
- Read-only reviewers may run in parallel with implementation.
- The parent Codex owns final integration and may reject subagent suggestions.
- If subagents disagree, prefer:
  1. Security/RLS correctness
  2. Legal safety
  3. Deterministic data correctness
  4. Production reliability
  5. UX speed/convenience

## Standard User Prompt

```text
이 작업은 팀에이전트 방식으로 진행해.
필요한 전문 에이전트 조합은 너가 판단하고,
병렬로 검토/구현/QA를 진행한 뒤 최종 통합,
테스트, 커밋, 푸시까지 해줘.
```

## Parent Codex Final Checklist

Before final response:
- Explain what agent pattern was used.
- List changed files only at high level.
- Run `npm run typecheck`.
- Run `npm run lint`.
- Run relevant tests or full `npm test`.
- Run `npm run build` for deploy-impacting changes.
- Restore generated `next-env.d.ts` churn if needed.
- Commit and push unless user explicitly says not to.
- Document meaningful architecture/source changes in `docs/WORK_LOG.md` or relevant runbook.
