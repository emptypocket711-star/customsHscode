# Marketplace Role Visibility Blockers

## Summary

로컬 Next.js 서버에서 세 테스트 계정 로그인은 가능하다.

다만 `.env.local`이 현재 원격 Supabase를 가리키고 있고, 그 원격 DB에는 marketplace migration의 핵심 컬럼/테이블이 아직 적용되어 있지 않다. 그래서 포워더·관세사무소 역할별 입찰 화면은 일부 또는 전체가 준비중 상태로 보일 수 있다.

## Verified Login Accounts

비밀번호는 `tmp/test-accounts.json`에만 보관하고 문서에는 적지 않는다.

| Role | Email | Local Login |
| --- | --- | --- |
| 화주 | `shipper.test@hsfinder.co.kr` | `/dashboard` 진입 확인 |
| 포워더 | `forwarder.test@hsfinder.co.kr` | `/dashboard` 진입 확인 |
| 관세사무소 | `broker.test@hsfinder.co.kr` | `/dashboard` 진입 확인 |

## Current Remote Schema Blockers

현재 확인된 blocker:

- `companies.verification_status`
- `companies.trust_score`
- `company_party_types`
- `partner_service_preferences`
- `service_requests`
- `service_request_partner_matches`
- `service_bids`
- `marketplace_notification_deliveries`

이 중 하나라도 없으면 앱은 의도적으로 `schemaReady=false`로 내려가고, 역할 설정·관심 조건·요청 공개·입찰 화면은 제한된다.

## Why Not Use Auth Metadata As A Shortcut

포워더와 관세사무소 역할은 요청 노출과 입찰 권한에 직접 연결된다. 가입 메타데이터만 보고 고영향 파트너 권한을 부여하면 운영자 승인과 RLS 경계를 우회할 수 있다.

따라서 테스트 계정의 `role` 의도는 로그인 확인에는 사용할 수 있지만, 실제 플랫폼 권한은 `company_party_types`와 검증 상태가 준비된 DB에서만 확인한다.

## Commands

로그인 확인:

```bash
LOCAL_LOGIN_SMOKE_ALL=1 npm run smoke:local-login
```

marketplace schema visibility 확인:

```bash
npm run smoke:marketplace-schema
```

## Review Options

1. 현재 원격 DB 상태 유지
   - 로그인, 대시보드, HS 조회, 일반 화면만 확인한다.
   - 역할별 marketplace positive path는 제한된다.

2. local Supabase에 marketplace migration 적용
   - 원격 DB를 건드리지 않고, 로컬 fixture로 화주 요청 -> 포워더/관세사 입찰 -> 화주 선정까지 검증한다.
   - 사용자 명시 승인 전에는 migration 적용을 보류한다.

3. 별도 review DB에 marketplace migration 적용
   - 원격 운영/테스트 계정에서 역할별 화면까지 확인할 수 있다.
   - 적용 전 schema diff와 rollback 기준이 필요하다.
