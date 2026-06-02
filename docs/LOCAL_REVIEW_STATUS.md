# Local Review Status

## Current Local Server

로컬 서버:

```text
http://127.0.0.1:3100
```

현재 확인된 상태:

- 세 테스트 계정 로그인 가능
- `/dashboard` 진입 가능
- HS 조회와 일반 대시보드 확인 가능
- 원격 Supabase에는 marketplace migration이 적용되지 않아 역할별 요청·입찰 positive path는 제한됨

## One Command Check

```bash
npm run review:local-status
```

출력 해석:

- `localLogin=ready`: 로컬 로그인과 대시보드 진입 가능
- `localLogin=blocked`: 서버, 환경변수, 계정 비밀번호 중 하나를 먼저 확인
- `marketplacePositivePath=ready`: 역할별 요청·입찰 E2E 확인 가능
- `marketplacePositivePath=blocked`: 로그인은 가능하지만 marketplace migration이 적용된 local/review DB가 필요

이 명령은 화주, 포워더, 관세사무소 테스트 계정 로그인을 모두 확인한다.

주요 화면 묶음을 브라우저로 확인하려면 다음 명령을 사용한다.

```bash
npm run review:local-routes
```

`tmp/e2e-auth/marketplace-transaction-*.json` storage state가 있으면 로컬 marketplace positive path 기준으로 실행한다. 이 상태에서는 비밀번호 로그인을 반복하지 않고 화주, 포워더, 관세사무소 세션을 직접 사용한다. storage state가 없으면 `tmp/test-accounts.json`의 비밀번호 로그인 계정으로 fallback 확인을 실행한다.

확인 route:

- 화주: `/dashboard`, `/requests/freight?workspace=requester`, `/requests/clearance?workspace=requester`, `/settings/members`, `/hs/direct`
- 포워더: `/requests/freight?workspace=forwarder`, `/settings/members`
- 관세사무소: `/requests/clearance?workspace=broker`, `/settings/members`

역할별 화면도 함께 확인한다.

- 포워더 워크스페이스에는 화주용 운송 견적 시작 흐름이 기본 노출되지 않아야 한다.
- 관세사무소 워크스페이스에는 화주용 통관 의뢰 시작 흐름이 기본 노출되지 않아야 한다.
- settings 화면에는 각 회사의 플랫폼 역할이 표시되어야 한다.

## Test Accounts

비밀번호는 `tmp/test-accounts.json`에 있다.

| Role | Email |
| --- | --- |
| 화주 | `shipper.test@hsfinder.co.kr` |
| 포워더 | `forwarder.test@hsfinder.co.kr` |
| 관세사무소 | `broker.test@hsfinder.co.kr` |

## Review Notes

현재 상태에서 사용자가 직접 확인할 수 있는 핵심은 로그인 복구와 fallback 안내 문구다.

포워더·관세사무소가 실제 입찰 가능한 요청을 보고 견적 제출까지 하는 흐름은 DB schema와 fixture가 준비된 별도 local/review 환경에서 확인한다.
