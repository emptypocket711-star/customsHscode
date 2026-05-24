# Prompt 07 — Legal Update Engine

Read skills/legal-update-engine/SKILL.md and docs/LEGAL_UPDATE_ENGINE.md.

Implement admin legal update center skeleton.

Features:
- list legal_source_snapshots
- upload/import a mock CSV or JSON snapshot
- compute checksum
- create staging snapshot
- create legal_change_events
- show diff cards
- approve/reject
- publish approved changes
- audit log entries

Do not fetch live official APIs yet.
Use provider interfaces so official sources can be added later.
