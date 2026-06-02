# Marketplace Notification Runbook

이 문서는 플랫폼 요청 알림 worker를 운영자가 리허설할 때 사용하는 기준이다.

## 현재 상태

- 기본 실행은 target 계산 후 delivery claim까지만 수행한다.
- sender 없이 claim된 건은 `claimedWithoutSenderCount`로 표시되며, 외부 발송 완료가 아니다.
- 외부 이메일 provider skeleton은 `transactional_email`로 연결되어 있다. 문자, 푸시 provider는 아직 연결하지 않았다.
- `send=1`은 명시적으로 요청한 경우에만 sender 경로를 탄다.
- `MARKETPLACE_NOTIFICATIONS_SEND_ENABLED`와 `MARKETPLACE_NOTIFICATIONS_PROVIDER`가 준비되지 않으면 `send=1`은 worker 실행 전에 차단된다.

## 환경 변수

| 변수 | 용도 | 현재 권장값 |
| --- | --- | --- |
| `JOB_WORKER_SECRET` 또는 `CRON_SECRET` | worker route 인증 | 운영 환경 필수 |
| `MARKETPLACE_NOTIFICATIONS_SEND_ENABLED` | sender 경로 허용 | 기본 미설정 또는 `false` |
| `MARKETPLACE_NOTIFICATIONS_PROVIDER` | sender provider 선택 | 리허설 시 `internal_dry_run` |
| `RESEND_API_KEY` | `transactional_email` 발송 provider 인증 | email provider 사용 시 필수 |
| `NOTIFICATION_FROM_EMAIL` | `transactional_email` 발신자 | email provider 사용 시 필수 |

## 지원 provider

| provider | 외부 발송 여부 | 용도 |
| --- | --- | --- |
| `internal_dry_run` | 없음 | delivery claim 후 provider id 기록만 확인하는 리허설 |
| `transactional_email` | 이메일 | partner company의 onboarding 완료 client profile 중 수신자를 찾아 Resend 기반 transactional email을 보냄 |

그 외 provider 값은 지원하지 않는다. 문자, 푸시 provider를 추가하기 전까지는 `MARKETPLACE_NOTIFICATIONS_PROVIDER`에 다른 값을 넣어도 발송 준비 완료로 보지 않는다.

## 리허설 순서

로컬 Supabase와 로컬 Next.js 서버가 준비되어 있으면 아래 명령으로 target 계산, `send=1` 차단, claim-only 동작을 한 번에 확인할 수 있다. 이 명령은 외부 발송을 하지 않고 synthetic delivery를 정리한다.

```bash
E2E_BASE_URL=http://127.0.0.1:3100 \
SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_SERVICE_ROLE_KEY=... \
npm run ops:marketplace-notifications:rehearse-local
```

1. Target 계산만 확인한다.

```bash
curl -s 'https://도메인/api/jobs/marketplace-notifications?dryRun=1&limit=20' \
  -H 'Authorization: Bearer <JOB_WORKER_SECRET>'
```

2. 발송 경로가 꺼져 있는지 확인한다.

```bash
curl -s 'https://도메인/api/jobs/marketplace-notifications?dryRun=1&send=1' \
  -H 'Authorization: Bearer <JOB_WORKER_SECRET>'
```

예상 결과:

- `400`
- `Marketplace notification sending is not ready.`
- readiness reasons에 send flag/provider 미설정 사유 표시

지원하지 않는 provider를 넣은 경우에도 발송은 차단된다.

```text
MARKETPLACE_NOTIFICATIONS_SEND_ENABLED=true
MARKETPLACE_NOTIFICATIONS_PROVIDER=email
```

예상 결과:

- `400`
- `Marketplace notification sending is not ready.`
- readiness reasons에 `MARKETPLACE_NOTIFICATIONS_PROVIDER is not supported.` 표시

3. 내부 dry-run sender 리허설은 운영자가 명시적으로 env를 켠 뒤 제한적으로 실행한다.

```text
MARKETPLACE_NOTIFICATIONS_SEND_ENABLED=true
MARKETPLACE_NOTIFICATIONS_PROVIDER=internal_dry_run
```

이 상태에서 `send=1`을 호출하면 외부 발송 없이 provider id만 기록하는 sender가 사용된다.

4. 이메일 provider는 운영자가 env와 수신자 조건을 확인한 뒤 제한적으로 실행한다.

```text
MARKETPLACE_NOTIFICATIONS_SEND_ENABLED=true
MARKETPLACE_NOTIFICATIONS_PROVIDER=transactional_email
RESEND_API_KEY=...
NOTIFICATION_FROM_EMAIL=...
```

이 상태에서 `send=1`을 호출하면 partner company의 onboarding 완료 client profile 중 관리자 우선 수신자를 찾아 이메일을 발송한다. 수신자가 없으면 provider는 발송하지 않고 실패 상태를 기록한다.

## 결과 필드 해석

| 필드 | 의미 |
| --- | --- |
| `targetCount` | 이번 실행에서 알림 대상으로 계산된 건수 |
| `claimedCount` | 중복 방지 RPC를 통과해 delivery가 claim된 건수 |
| `claimedWithoutSenderCount` | sender 없이 claim만 된 건수. 외부 발송 완료가 아니다 |
| `sentCount` | sender 실행 후 sent 처리까지 완료된 건수 |
| `failedSendCount` | sender 실행 중 실패로 기록된 건수 |
| `skippedDuplicateCount` | 이미 claim/sent 처리되어 건너뛴 중복 건수 |

## 실패 상태 해석

- sender 실패는 기본적으로 `retryable_failed`로 기록된다.
- provider 오류 원문은 저장하지 않고 `provider_timeout`, `provider_rate_limited`, `provider_auth_error`, `provider_send_failed` 같은 정규화 코드로 저장한다.
- `failedSendCount`가 증가했더라도 같은 실행에서 외부 발송 성공으로 안내하면 안 된다.
- 반복 실패가 있으면 provider 설정, 인증 키, 발송 제한, timeout 순서로 점검한다.

## 주의

- `internal_dry_run`은 외부 발송이 아니다.
- `transactional_email` 외 문자/푸시 provider를 연결하기 전에는 해당 채널로 발송된 것으로 안내하면 안 된다.
- 민감한 문서명, 질문 원문, 견적 금액 원문, 개인정보를 알림 metadata에 넣지 않는다.
- 중복 방지는 `marketplace_notification_deliveries` delivery key와 claim RPC가 담당한다.
- 실패 시 provider error는 정규화된 오류 코드로만 저장한다.
