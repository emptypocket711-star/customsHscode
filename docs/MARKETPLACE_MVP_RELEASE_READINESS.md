# Marketplace MVP Release Readiness

작성일: 2026-06-03

## Decision

현재 상태는 `제한 공개 테스트 가능`으로 본다.

대상 범위는 내부 운영자와 소수 테스트 화주, 포워더, 관세사무소 계정이다. 대량 외부 홍보, 실제 금전 정산, 실제 운송·통관 계약 확정 자동화는 아직 보류한다.

## Passed Gates

마지막 Preview regression suite는 아래 13단계가 모두 통과했다.

- DB schema health: blocker 0, warning 0
- marketplace schema visibility
- marketplace fixture seed
- marketplace RLS negative suite: 21 checks
- operations developer account prepare
- authenticated route smoke: 13 routes
- operations guard: 9 checks
- marketplace transaction E2E
- partner preference anchor smoke
- marketplace route performance smoke: 5 routes, max 2197ms
- completion report E2E
- notification dashboard E2E
- notification worker rehearsal

실행 기준:

```bash
E2E_TEST_PASSWORD='...' VERCEL_AUTOMATION_BYPASS_SECRET='...' \
vercel env run -e preview -- npm run smoke:staging:suite -- https://customs-hscode-dn0ayaj4k-koo-apps.vercel.app
```

## Role Readiness

| Role | Readiness | Notes |
| --- | --- | --- |
| 화주 | 테스트 가능 | 운송/통관 요청 생성, 공개, 견적 비교, 파트너 선정, 완료 피드백 E2E 통과 |
| 포워더 | 테스트 가능 | 관심 조건, 입찰 가능 요청, 운송 견적 제출, 알림, 빈 상태 anchor 통과 |
| 관세사무소 | 테스트 가능 | 통관 의뢰 입찰, 통관 견적 제출, 거래 E2E 통과 |
| 운영자/developer | 테스트 가능 | 운영 상세, zero-match 확인, operations guard, security runbook 준비 |
| 해외 수출입자 | 보류 | 가입/역할 방향은 잡혔지만 국가별 검증, 언어, 파트너 연결 정책은 아직 수동 검토 필요 |

## Release Boundaries

허용:

- Preview 또는 제한된 staging 환경에서 테스트 계정 기반 사용성 검증
- 실제 운영자가 수동으로 회사 검증 상태와 역할 신청을 확인
- 합성 fixture가 아닌 소수 실제 테스트 요청 생성
- 문제 발생 시 `MARKETPLACE_SECURITY_RUNBOOK.md` 기준으로 triage

보류:

- 공개 랜딩에서 대량 회원 모집
- 실제 운송비·통관수수료 결제 또는 정산
- 포워더/관세사 자동 추천 순위의 상업적 확정
- 외부 이메일 provider 실제 발송 enable
- HS CODE, 통관요건, FTA, 수출통제의 법적 확정 표현

## Manual Checks Before Wider Launch

- 실제 포워딩 업체 1곳과 관세사무소 1곳의 가입/역할 신청 화면을 수동으로 확인한다.
- 화주 테스트 계정으로 운송 요청과 통관 의뢰를 각각 1건 직접 작성한다.
- 운영자 계정으로 회사 검증, 역할 신청, zero-match 운영 상세를 확인한다.
- 알림 provider를 실제 발송으로 켜기 전 dry-run, blocked send, claim-only rehearsal을 다시 실행한다.
- 개인정보와 첨부서류가 운영 로그, smoke output, browser screenshot에 노출되지 않는지 확인한다.

## Hold Conditions

아래 중 하나라도 발생하면 공개 테스트를 중단한다.

- `health:db` blocker 발생
- `smoke:marketplace-rls-negative` 실패
- 일반 계정이 `/operations/*` 본문을 읽음
- 타 회사 요청, 견적, 문서가 노출됨
- 완료 리포트 preview가 비로그인 또는 unmatched partner에게 노출됨
- notification worker가 provider 미준비 상태에서 실제 send를 수행
- route performance smoke에서 8초 budget 초과가 반복됨

## Next Work After P280

- 실제 테스트 업체 온보딩 체크리스트
- 운영 관리자 화면 단순화
- 해외 수출입자 검증 정책
- 실제 email provider enable 전 최종 발송 정책
- 거래 완료 후 정산/계약 기록 모델
