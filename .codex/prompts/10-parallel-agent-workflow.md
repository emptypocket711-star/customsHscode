# Prompt 10 — Parallel Agent Workflow

Use Codex subagents only when the user explicitly asks for team/agent/parallel work or when they explicitly approve this workflow.

Before spawning:
1. Read `docs/TEAM_AGENTS.md`.
2. Decide whether this is small, medium, large, legal/data, AI classification, or admin/auth work.
3. Pick only the agents needed for the task.
4. Separate write scopes so implementation agents do not collide.
5. Keep the immediate critical-path work local if waiting for a subagent would block progress.

Default agent mixes:

- Small fix: no subagents.
- Medium feature: one implementation agent + QA reviewer.
- Large feature: product architect + relevant implementation agents + QA reviewer.
- Legal/data feature: legal rules + data ingestion + backend + QA.
- AI classification feature: AI/RAG + legal rules + backend + QA.
- Admin/auth feature: backend + frontend + security + QA.

After agents return:
- Integrate results.
- Resolve disagreements using `docs/TEAM_AGENTS.md` conflict rules.
- Run verification.
- Update docs if architecture, data source, or workflow changed.
- Commit and push unless user explicitly says not to.

Final summary:
- agent pattern used
- completed changes
- tests/build run
- commit hash
- remaining risks or follow-up only if material
