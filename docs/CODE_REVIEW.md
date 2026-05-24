# Code Review Rules

Review in this order:

1. Security/RLS
2. Legal certainty and wording
3. Basis-date/source-version correctness
4. Data integrity
5. Business workflow correctness
6. Tests
7. UI/UX
8. Code quality

## Red Flags

- Client can access other company data.
- AI output bypasses staff review.
- Legal/tariff data overwritten without snapshot.
- No source version in report.
- Query does not use basis_date.
- No audit log for approval/publish.
- “요건 없음” shown without caution.
- Strategic goods output says “not applicable” as final.

## Required Reviewer Output

For each finding:
- severity
- file/symbol
- problem
- consequence
- proposed fix
- test to add
