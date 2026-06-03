# Codex Handoff

작성일: 2026-06-03

## Current Branch And Deployment

- Branch: `staging/platform-dev`
- Remote: `origin git@github.com:emptypocket711-star/customsHscode.git`
- Latest completed milestone: P280
- Latest P280 commit: `ea07702 Document marketplace MVP release readiness`
- Staging preview used for final suite: `https://customs-hscode-dn0ayaj4k-koo-apps.vercel.app`

## Product Direction

HS FINDER의 중심은 단순 HS CODE 안내 사이트가 아니라 수출입 화주, 해외 거래처, 포워더, 관세사를 이어주는 무역 실무 연결 플랫폼이다.

HS CODE 조회, 품명 AI 검색, 관세 계산, 적하목록/컨테이너 조회, 중고차 수출 도구, 무역뉴스는 제거하지 않는다. 이 기능들은 사용자가 먼저 가치를 확인하고 견적 요청, 통관 의뢰, 파트너 매칭으로 넘어가게 만드는 공개 진입 기능이다.

## Non Negotiable Rules

- AI가 법령이나 HS 분류를 기억해서 직접 확정 답변하는 구조로 만들지 않는다.
- 공식 출처, source snapshot, effective date, deterministic rule engine, AI explanation layer, staff review, source locked report 원칙을 유지한다.
- HS, FTA, 수입요건, 수출통제, 법령 결과는 확정 표현을 피한다.
- 관세사 유료 HS 확정 검토 기능은 가격과 협업 관세사무소가 정해질 때까지 고객 화면에서 숨긴다.
- RLS와 server-side auth check를 화면보다 우선한다.
- 문서, 송장, 개인정보, API key, bypass secret은 로그에 남기지 않는다.

## Completed Work Summary

P1-P180대에서는 HS 조회, 품명 AI 검색, HSK 네비게이터, 중고차 수출 도구, 운영 화면, 테스트 계정, staging 검증 기반을 만들었다.

P190-P253에서는 플랫폼 방향을 화주, 포워더, 관세사무소 거래 흐름으로 재정렬했다. 운송 견적 요청, 통관 의뢰 요청, 파트너 입찰, 관심 조건, 알림, 완료 리포트 preview, 운영자 점검 화면을 만들었다.

P254-P280에서는 marketplace 보안/무결성 하드닝을 진행했다. 직접 호출 우회, RLS negative suite, 요청 공개 guard, 입찰 guard, 알림 중복 방지, role review guard, route performance smoke, full staging regression, release readiness 문서를 완료했다.

## Last Verified State

P279 full staging regression suite는 13단계 모두 통과했다.

- health-db
- marketplace-schema
- marketplace-fixture-seed
- marketplace-rls-negative: 21 checks
- operations-developer-prepare
- route-smoke: 13 routes
- operations-guard: 9 checks
- marketplace-transaction
- partner-preference-anchor
- marketplace-route-performance: 5 routes, max 2197ms
- completion-report
- notification-dashboard
- notification-worker

P280 결론은 `제한 공개 테스트 가능`이다.

허용 범위:

- 내부 운영자와 소수 테스트 화주, 포워더, 관세사무소 계정 기반 검증
- 실제 테스트 요청 소량 생성
- 운영자가 회사 검증과 역할 신청을 수동 확인

보류 범위:

- 대량 외부 홍보
- 실제 결제/정산
- 실제 이메일 provider 발송 enable
- 해외 수출입자 검증 자동화
- 운송/통관 계약 확정 자동화

## Current Next Work

다음 우선 작업은 P281 `public lookup and gated auth actions`다.

목표:

- HS CODE 직접 조회, 품명 AI 검색, 적하목록/컨테이너 조회 같은 기본 조회 기능은 비로그인으로 열기
- 견적 요청, 입찰, 즐겨찾기, 문서 업로드, 리포트 저장, 회사 관리, 운영 화면은 로그인과 권한이 필요하게 유지하기
- 비로그인 사용자가 회원 전용 액션을 누르면 로그인 안내 후 `/login?next=...`로 이동시키기
- 서버 action/API와 RLS는 기존 보호 경계를 유지하기

상세 계획은 `docs/PUBLIC_ACCESS_AND_AUTH_GATE_PLAN.md`를 따른다.

## Recommended Working Style

1. 작업 시작 전 `docs/DECISIONS.md`, `docs/ROADMAP.md`, `docs/WORK_LOG.md`, `docs/PUBLIC_ACCESS_AND_AUTH_GATE_PLAN.md`를 읽는다.
2. 이전 작업과 이번 작업의 차이를 사용자에게 먼저 말한다.
3. 묶어서 가능한 작업은 한 번에 진행한다.
4. 각 작업 후 바로 검증하고, 통과하면 사용자 허락을 기다리지 말고 다음 작업으로 이어간다.
5. 코드 변경 후에는 최소 `npm run typecheck`, `npm run lint`, 관련 test, 필요 시 `npm run build`를 실행한다.
6. UI 변경은 로컬 서버 또는 staging 브라우저 검증을 같이 수행한다.
7. reviewer 관점으로 보안/RLS와 UX를 자체 점검한다.
8. 완료한 작업은 `docs/WORK_LOG.md`와 필요 시 `docs/ROADMAP.md`에 남긴다.

## Common Commands

```bash
npm run typecheck
npm run lint
npm run build
npm run smoke:staging:suite -- <preview-url>
```

Vercel preview protection이 켜져 있으면 자동 테스트에는 bypass header 또는 관련 env가 필요하다. secret 원문은 문서나 로그에 남기지 않는다.

## Files To Inspect First For P281

- `proxy.ts` 또는 middleware/login guard 관련 파일
- `app/hs/direct`
- `app/hs/product-recommendation`
- `app/cargo`
- `app/used-car-export`
- `app/duty-estimator`
- `features/auth`
- `server/actions`
- `scripts` 안의 route smoke와 staging suite

## Do Not Regress

- `/operations/*`, `/staff/*`, `/settings/*`, `/requests/*`, `/documents/*`, `/reports/*`는 비로그인 직접 접근이 보호되어야 한다.
- marketplace request, bid, document, notification, completion report 권한은 기존 RLS negative suite를 깨면 안 된다.
- 비로그인 공개 조회를 열어도 mutation은 열면 안 된다.
- 품명 AI 검색은 공개하더라도 비용 제한이 필요하다.
- 법적 확정 표현, HS 확정 표현, 유료 관세사 검토 노출은 다시 넣지 않는다.
