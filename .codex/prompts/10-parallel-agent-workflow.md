# Prompt 10 — Parallel Agent Workflow

Use Codex subagents.

Spawn agents:
1. product_architect: review current repo and confirm next implementation slice
2. backend_engineer: inspect schema/RLS gaps
3. frontend_engineer: inspect UI gaps
4. legal_rules_engineer: inspect rule-engine and basis-date gaps
5. security_reviewer: inspect RLS/storage/logging risks
6. qa_reviewer: inspect missing tests and legal-safety wording

Wait for all results.
Then summarize:
- agreed next work
- blockers
- high-risk findings
- exact files to change
- implementation order
