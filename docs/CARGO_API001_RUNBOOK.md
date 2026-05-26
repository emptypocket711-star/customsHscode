# API001 화물통관진행정보 조회 운영 메모

## 현재 구조

- 사용자 화면: `/cargo`
- 서버 액션: `lookupCargoProgressAction`
- 관세청 API: `retrieveCargCsclPrgsInfo`
- 필수 조회 조합:
  - `hblNo` + `blYy`
  - `mblNo` + `blYy`
  - 또는 15자리 이상 `cargMtNo`

## 오류 분리 기준

- `조회 결과 없음`
  - 관세청 API는 호출됨
  - XML 응답에 조회 가능한 화물 정보가 없음
  - 사용자에게 B/L 번호, 연도, 적하목록 생성 여부 확인 안내

- `관세청 API001 서버 연결 실패`
  - 관세청 API 호출 자체가 실패
  - timeout, DNS, TLS, outbound port, network로 진단 분리
  - 운영 화면에는 endpoint와 원인 코드만 표시하고 API key는 노출하지 않음

## Vercel에서 38010 포트 호출이 막히는 경우

로컬에서는 `https://unipass.customs.go.kr:38010/...` 호출이 정상이고, Vercel에서만 `fetch failed`가 반복되면 앱 입력값 문제가 아니라 운영 서버 outbound network 문제일 가능성이 높다.

검토 순서:

1. Vercel 함수 로그에서 `[cargo_progress_api_failure]` 확인
2. category가 `outbound_port`, `timeout`, `network`인지 확인
3. 같은 요청을 로컬에서 재현해 API key와 입력값 문제를 배제
4. Vercel outbound가 계속 실패하면 API001 호출만 별도 relay로 분리

## 대체 구조 후보

- Cloudflare Worker relay
  - 장점: 가볍고 배포가 빠름
  - 확인 필요: `unipass.customs.go.kr:38010` outbound 허용 여부

- Supabase Edge Function
  - 장점: 기존 Supabase 운영과 결합 가능
  - 확인 필요: Deno runtime에서 38010 포트 호출 허용 여부

- 저가 VPS relay
  - 장점: outbound 포트 제어 가능성이 가장 높음
  - 단점: 서버 보안, 모니터링, key 관리 필요

권장 판단:

- Vercel에서 38010 호출이 실패한다는 로그가 확정되면 Cloudflare Worker를 먼저 짧게 검증한다.
- Worker도 실패하면 API001 전용 VPS relay를 둔다.
