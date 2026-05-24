# 예상 납세액 계산

## 목적

`/duty-estimator`는 HS 조회 결과에서 넘어온 관세율과 내국세 후보를 바탕으로 수입 신고 전 예상 납세액을 계산하는 화면이다.

현재 계산기는 확정세액 산출기가 아니라 사용자가 금액, 환율, 운임, 보험료, 세율을 조정하며 예상 규모를 확인하는 입력형 도구다.

## 입력값

- `hskCode`: HS CODE 또는 HSK
- `basisDate`: 조회기준일
- `currency`: 외화 통화 코드. 기본값은 `USD`
- `goodsAmount`: 물품가격
- `exchangeRate`: 관세환율. API012 조회값 또는 직접 입력값
- `freightKrw`: 운임 원화 금액
- `insuranceKrw`: 보험료 원화 금액
- `dutyRate`: 기본 또는 공통 관세율
- `preferentialRate`: FTA/협정 관세율 후보
- `usePreferentialRate`: FTA/협정 관세율 적용 여부
- `otherInternalTaxRate`: 부가세 외 내국세율 합계
- `internalTaxItems`: 세목별 내국세 초기값 JSON. 예: `[{"name":"개별소비세","rate":7,"baseType":"taxable_value"}]`
- `vatRate`: 부가가치세율

## 계산식

기본 계산식:

```text
물품가격 원화 = 물품가격 x 관세환율
과세가격 = 물품가격 원화 + 운임 + 보험료
관세 = 과세가격 x 적용 관세율
기타 내국세 = 세목별 과세표준 x 세목별 세율
부가세 과세표준 = 과세가격 + 관세 + 기타 내국세
부가세 = 부가세 과세표준 x 부가세율
예상 납세액 = 관세 + 기타 내국세 + 부가세
```

세목별 `internalTaxItems`가 들어오면 화면과 복사 텍스트에 세목별 과세표준과 금액을 함께 표시한다. 세목별 값이 없을 때만 `otherInternalTaxRate`를 과세가격에 단순 적용한다.

지원하는 `baseType`:

- `taxable_value`: 과세가격 기준
- `customs_duty`: 관세액 기준
- `taxable_value_plus_customs_duty`: 과세가격 + 관세 기준
- `previous_internal_tax_total`: 앞에서 계산된 내국세 합계 기준
- `taxable_value_plus_customs_duty_plus_previous_internal_tax`: 과세가격 + 관세 + 앞선 내국세 기준

예: 개별소비세가 과세가격 기준 7%이고 교육세가 앞선 내국세 기준 3%라면, 교육세는 개별소비세액을 과세표준으로 계산한다.

## 자동 연동

HS 조회 화면의 `납세액 계산` 버튼은 다음 값을 넘긴다.

- 조회기준일
- 가장 낮은 공통 관세율
- 가장 낮은 FTA/협정 관세율 후보
- 내국세 법령룰·통계부호에서 추출한 부가세율
- 부가세 외 퍼센트형 내국세율, 세목명, 과세표준 기준

종량세, 종가·종량 혼합세, 수량·알코올분·용량이 필요한 세목은 아직 자동 계산하지 않고 표시용 데이터로만 남긴다.

## API012 관세환율

`server/actions/exchange-rate.actions.ts`가 관세청 API012 관세환율정보조회를 호출한다.

- `currencyCode=KRW`는 API 호출 없이 환율 `1`을 적용한다.
- 수입은 `imexTp=2`, 수출은 `imexTp=1`로 조회한다.
- 조회 성공 시 환율, 통화, 적용일, source version을 반환한다.
- Supabase가 연결되어 있으면 API012 응답 metadata를 `legal_source_snapshots`에 `exchange_rate` source snapshot으로 저장하고 snapshot id를 계산기 화면과 복사 텍스트에 표시한다.
- 저장되는 값은 source name, redacted source URL, source version, effective date, retrieved timestamp, checksum이다. API 키, 물품가격, 운임, 보험료 등 사용자 계산 입력값은 저장하지 않는다.

## 남은 작업

실제 내국세 자료가 들어오면 다음 순서로 확장한다.

1. `internal_tax_law_rules`에 구조화된 과세표준 필드를 추가한다.
2. 종량세와 종가·종량 혼합세 입력 필드를 추가한다.
3. `internal_tax_law_rules.rate_formula`를 계산 엔진이 읽을 수 있는 구조화 필드로 분리한다.
4. 계산 결과 자체를 case/report 테이블에 저장할 때 source snapshot lock을 연결한다.
