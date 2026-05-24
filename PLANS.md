# PLANS.md

Use this template for every long-running Codex task.

## Task Title

Short name.

## Objective

What user-visible outcome must exist after this task?

## Current State

What files, routes, tables, or services already exist?

## Scope

In scope:
- item

Out of scope:
- item

## Implementation Plan

1. Inspect relevant files.
2. Update or create schema.
3. Implement service/repository layer.
4. Implement UI.
5. Add validation.
6. Add tests.
7. Run checks.
8. Summarize diff and risks.

## Data & Legal Safety Checks

- Does this use `basis_date`?
- Does this preserve source version?
- Does this avoid final legal certainty?
- Does this require staff review?
- Does this lock report sources?

## Verification

Commands:
```bash
npm run typecheck
npm run lint
npm test
```

Manual checks:
- client user cannot see another company case
- staff can review pending diagnosis
- report shows 조회기준일 and source/version
- no final HS/FTA/requirement confirmation by AI alone

## Rollback

How to revert migration, feature flag, or code change.
