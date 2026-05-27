# API001 Cargo Progress Relay

Vercel에서 `unipass.customs.go.kr:38010` 호출이 `ECONNRESET`으로 실패할 때 쓰는 API001 전용 relay입니다.

## 실행 환경변수

```bash
CUSTOMS_API_CARGO_PROGRESS_SERVICE_KEY=관세청_API001_키
CUSTOMS_API_CARGO_PROGRESS_RELAY_TOKEN=긴_임의_문자열
PORT=8787
node relays/cargo-progress-relay/server.mjs
```

`CUSTOMS_API_CARGO_PROGRESS_URL`은 생략하면 아래 기본값을 사용합니다.

```text
https://unipass.customs.go.kr:38010/ext/rest/cargCsclPrgsInfoQry/retrieveCargCsclPrgsInfo
```

API012 관세환율 캐시 수집도 같은 relay에서 처리합니다.

```bash
CUSTOMS_API_EXCHANGE_RATE_SERVICE_KEY=관세청_API012_키
CUSTOMS_API_EXCHANGE_RATE_URL=https://unipass.customs.go.kr:38010/ext/rest/trifFxrtInfoQry/retrieveTrifFxrtInfo
```

## HS Finder Vercel 환경변수

relay 서버를 띄운 뒤 Vercel에는 아래 값을 추가합니다.

```text
CUSTOMS_API_CARGO_PROGRESS_RELAY_URL=https://api.hsfinder.co.kr/cargo-progress
CUSTOMS_API_CARGO_PROGRESS_RELAY_TOKEN=relay와_같은_긴_임의_문자열
CUSTOMS_API_EXCHANGE_RATE_RELAY_URL=https://api.hsfinder.co.kr/exchange-rate
CUSTOMS_API_EXCHANGE_RATE_RELAY_TOKEN=relay와_같은_긴_임의_문자열
```

relay URL이 설정되면 HS Finder는 관세청 API001을 직접 호출하지 않고 relay를 먼저 호출합니다.

## 헬스체크

```bash
curl https://api.hsfinder.co.kr/health
```

정상 응답:

```json
{"ok":true}
```
