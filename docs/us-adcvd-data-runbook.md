# 미국 AD/CVD 데이터 연결 절차

작성일: 2026-05-23

## 목적

미국 목적국 조회에서 HTS 일반관세, Special/FTA, Chapter 99 추가관세와 별도로 AD/CVD 후보 사건을 표시한다.

AD/CVD는 일반 HTS 세율이 아니다. HTS 번호는 편의상 참조값이며 실제 적용 여부는 order scope, 원산지, 생산자/수출자, Department of Commerce 지시, CBP case status에 따라 달라진다.

## 공식 원천

- CBP AD/CVD data page: `https://www.cbp.gov/trade/priority-issues/adcvd/data`
- data.gov metadata: `https://catalog.data.gov/dataset/cbp-active-dumping-and-active-countervailing-ad-cvd-cases`
- CBP public AD/CVD search: `https://trade.cbp.gov/ADCVDTradeRemedies/s/`
- ACE CATAIR AD/CVD Case Information Query: `https://www.cbp.gov/document/guidance/ace-catair-adcvd-case-information-query`

2026-05-23 확인 기준:

- CBP page는 active AD/CVD cases가 ACE ES-105 Active Case report에서 제공된다고 안내한다.
- data.gov metadata에는 설명만 있고 다운로드 리소스가 노출되지 않는다.
- 따라서 대량 적재는 ACE에서 ES-105 report를 CSV/XLSX로 확보한 뒤 진행한다.

## 입력 파일

지원 형식:

- CSV
- XLSX

자동 인식 컬럼:

- `Case Number`
- `Tariff Number`
- `ISO Country Code`
- `Short Description`
- `Case Type`
- `Rate`
- `Company` / `Producer` / `Exporter`
- `Scope`

컬럼명이 조금 달라도 `scripts/generate_us_adcvd_trade_remedy_seed.py`의 alias 목록으로 최대한 인식한다.

## 생성

```bash
python3 scripts/generate_us_adcvd_trade_remedy_seed.py \
  /path/to/ACE_ES105.csv \
  --output supabase/seed/generated/us_adcvd_trade_remedy_cases_seed.sql
```

기본 source version은 실행일 기준으로 생성된다.

```text
us-cbp-adcvd-active-cases-YYYYMMDD
```

## 적용

```bash
DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54322/postgres' \
  scripts/apply_lookup_seed_bundle.sh
```

`supabase/seed/generated/us_adcvd_trade_remedy_cases_seed.sql` 파일이 있으면 bundle script가 자동 적용하고 `us-cbp-adcvd-active-cases-*` source version을 publish한다.

## 화면 확인

예시:

```bash
curl -s 'http://localhost:3000/hs/direct?direction=export&destinationCountry=USA&originCountry=CHN&query=730810&destinationHsCode=7308100000'
```

확인 포인트:

- `AD/CVD` 칸에 사건번호가 표시된다.
- 원산지를 선택하면 해당 원산지 또는 공통 사건만 표시된다.
- 사건 상세 팝업에는 대상 HS, 사건번호, 원산지, 생산자/수출자, 세율, scope 요약이 표시된다.

## 주의사항

- AD/CVD 후보가 표시되어도 적용 확정이 아니다.
- HTS 번호는 scope 판단의 보조값이다.
- 같은 HTS라도 제품 사양, 원산지, 생산자/수출자, 기간, scope exclusion에 따라 적용 여부가 달라질 수 있다.
- 파일 원문 checksum은 `notes`에 저장한다.
