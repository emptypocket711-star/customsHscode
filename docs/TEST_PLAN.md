# Test Plan

## Unit Tests

### Basis Date

- tariff valid on basis date
- tariff expired before basis date excluded
- future effective tariff included only when basis date is future

### HS Candidate

- product name returns candidate structure
- candidates include required questions
- no candidate is marked final by AI

### Requirement Query

- import/export direction filter works
- HSK filter works
- no-result still returns caution copy

### FTA

- origin country differs from shipment country
- direct transport risk appears when transshipment exists
- agreement candidate requires origin/destination match

## RLS Tests

- client cannot read other company cases
- client cannot approve report
- staff can review reports
- admin can manage legal updates

## Integration Tests

- create HS request
- generate candidates
- select candidate
- generate import diagnosis
- submit report for review
- approve report
- confirm report source lock exists

## UI E2E

- user enters product name
- sees candidate list
- clicks import diagnosis
- sees preliminary warning
- sees source footer

## Legal Safety Tests

Search UI output for forbidden certainty phrases:
- 확정입니다
- 무조건
- 요건 없음
- FTA 적용 확정
- 전략물자 아님 확정

Unless staff-approved report explicitly allows controlled wording.
