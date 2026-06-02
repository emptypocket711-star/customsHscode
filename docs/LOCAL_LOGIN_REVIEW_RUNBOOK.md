# Local Login Review Runbook

## Purpose

로컬 Next.js 서버가 `.env.local`을 정상 로딩하고 테스트 계정으로 로그인 가능한지 빠르게 확인한다.

이번 점검은 DB migration을 적용하지 않는다. 로그인 가능 여부와 대시보드 진입만 확인한다.

## Start Server

```bash
npm run dev -- -p 3100 -H 127.0.0.1
```

브라우저 접속:

```text
http://127.0.0.1:3100/login
```

## Smoke Test

테스트 계정 파일이 `tmp/test-accounts.json`에 있으면 아래 명령으로 화주 계정 로그인을 확인한다.

```bash
npm run smoke:local-login
```

포워더 또는 관세사무소 계정을 확인하려면 역할을 지정한다.

```bash
LOCAL_LOGIN_SMOKE_ROLE=forwarder npm run smoke:local-login
LOCAL_LOGIN_SMOKE_ROLE=broker npm run smoke:local-login
```

세 계정을 모두 확인하려면 다음처럼 실행한다.

```bash
LOCAL_LOGIN_SMOKE_ALL=1 npm run smoke:local-login
```

비밀번호는 출력하지 않는다.

## Failure Notes

`Supabase 환경 변수가 없어 로그인할 수 없습니다.`가 보이면 서버 프로세스가 최신 `.env.local`을 읽지 못한 상태다.

처리 순서:

1. 기존 `next dev` 프로세스를 종료한다.
2. `npm run dev -- -p 3100 -H 127.0.0.1`로 다시 시작한다.
3. `npm run smoke:local-login`을 다시 실행한다.

## Marketplace Role Limitation

현재 `.env.local`이 원격 Supabase를 가리키는 경우, 원격 DB에 `company_party_types` 등 marketplace schema가 아직 없으면 포워더·관세사무소 전용 권한 화면은 제한될 수 있다.

이 상태에서도 로그인과 일반 대시보드 확인은 가능하다. 플랫폼 거래 E2E positive path는 local Supabase에 marketplace migration을 적용한 뒤 별도 fixture로 확인한다.
