# Production Health Check

HS Finder 운영 배포 전후에 Supabase 스키마가 현재 코드와 맞는지 확인하는 절차다.

## DB 스키마 점검

다음 명령은 `supabase/migrations` 기준으로 운영 DB를 검사한다.

```bash
npm run health:db
```

점검 항목:

- migration이 생성해야 하는 public 테이블 존재 여부
- migration이 생성하거나 추가해야 하는 컬럼 존재 여부
- 코드가 사용하는 public RPC/function 존재 여부
- RLS 활성화가 선언된 테이블의 실제 RLS 상태

`DATABASE_URL`은 shell 환경변수 또는 `.env.local`에서 읽는다.
비밀번호, API 키, DB 접속 문자열은 출력하지 않는다.

## 결과 기준

- `OK`: 테이블, 컬럼, RPC/function 누락 없음
- `WARN`: 기능은 동작할 수 있으나 보안/운영상 점검 필요
- `BLOCKER`: 운영 기능이 실패할 수 있는 누락 있음

`BLOCKER`가 하나라도 있으면 스크립트는 종료 코드 `1`로 실패한다.
배포 전에는 반드시 `BLOCKER`를 해결해야 한다.

## JSON 출력

CI나 별도 자동화에서 쓰려면 JSON으로 출력한다.

```bash
node scripts/check-production-schema.mjs --json
```

## 이번 장애와의 관계

적하목록 감시 등록 실패 원인은 운영 DB에
`cargo_watch_status_notifications` 테이블이 없었기 때문이다.
이 스크립트는 같은 유형의 누락 테이블/컬럼/RPC 문제를 배포 전에 잡기 위한 용도다.

## 다음 확장 후보

- Vercel 환경변수 설정 여부 점검
- 관세청 API001/API012 연결 상태 점검
- Resend 설정 점검
- 개발자 메뉴의 운영 상태 점검 화면과 연결
