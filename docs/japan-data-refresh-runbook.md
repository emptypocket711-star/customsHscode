# 일본 목적국 데이터 갱신 절차

작성일: 2026-05-23

## 대상

수출 모드에서 일본 목적국 조회에 사용하는 데이터:

- `export_destination_tariff_rates`
- `export_destination_internal_taxes`
- `export_destination_import_requirements`
- `export_destination_data_sources`

## 현재 원천

- Japan Customs Tariff Schedule 2026.04.01: `https://www.customs.go.jp/english/tariff/2026_04_01/index.htm`
- Japan Customs 소비세 계산 안내: `https://www.customs.go.jp/english/c-answer_e/imtsukan/1111_e.htm`
- Japan Customs 수입절차/타법령 확인: `https://www.customs.go.jp/english/summary/import.htm`
- MHLW 식품위생법 수입절차: `https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/shokuhin/yunyu_kanshi/kanshi/index_00004.html`
- MAFF 식물검역: `https://www.maff.go.jp/pps/j/introduction/english.html`
- METI PSE 가이드: `https://www.meti.go.jp/policy/consumer/seian/denan/file/06_guide/denan_guide_ver40_en.pdf`
- METI 소비제품 안전: `https://www.meti.go.jp/policy/consumer/seian/shouan/act.html`

## 갱신 순서

1. 새 Japan Customs tariff schedule URL을 확인한다.
2. `scripts/generate_japan_customs_tariff_seed.py`의 `BASE_URL`, `SOURCE_VERSION`, `tariff_year`, `effective_from`을 새 버전에 맞춘다.
3. 관세표를 생성한다.

```bash
python3 scripts/generate_japan_customs_tariff_seed.py
```

4. 일본 내국세·수입요건 seed를 재생성한다.

```bash
python3 scripts/generate_japan_import_data_seed.py
```

5. 로컬 DB에 적용한다.

```bash
DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54322/postgres' \
  scripts/apply_lookup_seed_bundle.sh
```

6. 대표 코드로 화면을 확인한다.

```bash
curl -s 'http://localhost:3000/hs/direct?direction=export&destinationCountry=JPN&originCountry=KOR&query=330410&destinationHsCode=330410000'
```

확인 포인트:

- 일본 HS `3304.10-000`
- 기본세율 `5.8%`
- 협정세율 `RCEP(한국) Free`
- 내국세 `수입 소비세 10%`
- 수입요건 `일본 화장품·의약외품 규제 확인`

## 주의사항

- 일본 HS는 9자리 통계부호가 기본이다. 한국 HSK 10자리와 직접 동일하다고 보지 않는다.
- 77류는 일반적으로 유보 chapter라 현재 기본 수집 범위에서 제외한다.
- 수입 소비세 8% 매핑은 음식료품 후보 기준이다. 주류 등 예외는 별도 세목 자료로 보강해야 한다.
- 수입요건은 HS4 후보 매핑이다. 성분, 용도, 정격, 가공상태, 판매 목적을 확인해야 한다.
- 법령·요건 데이터는 source version을 바꿔 새 스냅샷으로 적재하고 기존 데이터를 덮어쓰지 않는다.
