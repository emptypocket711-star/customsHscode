# Local Review Positive Path Decision

## Decision

현재 세 테스트 계정은 로컬 Next.js 서버에서 로그인 가능하다.

하지만 marketplace 요청/입찰 positive path는 현재 `.env.local`이 가리키는 원격 Supabase schema로는 확인할 수 없다. 원격 DB에 marketplace migration이 적용되어 있지 않기 때문이다.

사용자 명시 승인 전에는 local Supabase에도 migration을 적용하지 않는다.

## Reason

marketplace migration은 회사 역할, 검증 상태, 요청, 입찰, 문서 공개 범위, 알림, 감사 로그를 포함한다.

이 migration을 적용하면 단순 화면 확인이 아니라 실제 DB 상태가 크게 바뀐다. 따라서 자동 진행하지 않고 별도 승인 기준을 둔다.

## Current Review Scope

지금 바로 확인 가능한 범위:

- 로그인
- 대시보드 기본 화면
- HS CODE/품명 조회
- 기존 외부 연동/실무 도구 화면
- marketplace schema 미준비 fallback UI

현재 제한되는 범위:

- 포워더 입찰 가능 요청 positive path
- 관세사무소 통관 입찰 positive path
- 화주 요청 공개 -> 파트너 매칭 -> 견적 제출 -> 선정 E2E
- 역할 신청 승인 후 `company_party_types` 반영

## Next Non-DB Task

원격 schema가 준비되지 않은 상태에서도 사용자가 혼동하지 않도록 대시보드와 요청 화면의 fallback 문구를 정리한다.

목표:

- 로그인은 정상임을 구분한다.
- 요청/입찰 기능이 계정 문제가 아니라 플랫폼 DB 준비 문제로 제한됨을 운영자에게 알린다.
- 일반 사용자에게는 기술 용어보다 “플랫폼 요청 기능 준비 중” 수준으로 안내한다.
