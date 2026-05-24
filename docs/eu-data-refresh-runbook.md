# EU 목적국 데이터 갱신 절차

작성일: 2026-05-23

## 대상

수출 모드에서 EU 및 EU 27개 회원국 목적국 조회에 사용하는 데이터:

- `export_destination_tariff_rates`
- `export_destination_internal_taxes`
- `export_destination_import_requirements`
- `export_destination_data_sources`

## 현재 원천

- EU TARIC 안내: `https://taxation-customs.ec.europa.eu/customs/calculation-customs-duties/customs-tariff/eu-customs-tariff-taric_en`
- Access2Markets: `https://trade.ec.europa.eu/access-to-markets/`
- EU VAT rates / TEDB 안내: `https://taxation-customs.ec.europa.eu/taxation/value-added-tax-vat/vat-rates_en`
- 현재 EU 공통 관세표는 관세청 국가별 관세율표의 `EEC` snapshot을 사용한다.

## 갱신 순서

1. 관세청 국가별 관세율표 또는 공식 TARIC 원천을 갱신한다.
2. `EEC` 관세 데이터가 `export_destination_tariff_rates`에 적재되어 있는지 확인한다.

```sql
select country_code, source_version, status, count(*)
from public.export_destination_tariff_rates
where country_code = 'EEC'
group by country_code, source_version, status;
```

3. EU VAT/수입요건 seed를 재생성한다.

```bash
python3 scripts/generate_eu_import_data_seed.py
```

4. 로컬 DB에 적용한다.

```bash
DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54322/postgres' \
  scripts/apply_lookup_seed_bundle.sh
```

5. 대표 코드로 화면을 확인한다.

```bash
curl -s 'http://localhost:3000/hs/direct?direction=export&destinationCountry=DEU&originCountry=KOR&query=330410&destinationHsCode=3304100000'
```

확인 포인트:

- EU 공통 HS/TARIC 후보 `3304.10-0000`
- 기본/제3국 관세 `Third country duty`
- 협정세율 `한-EU FTA`
- 선택한 EU 회원국의 `수입 VAT` 표준세율 후보
- `EU 화장품 규정 확인`
- `EU REACH/CLP 화학물질 규제 확인`

## 주의사항

- EU 관세는 공통이지만 VAT와 일부 수입요건 집행은 회원국별이다.
- EU 회원국 선택은 해당 회원국 VAT 코드와 EU 공통 관세코드 `EEC`를 함께 조회한다.
- 현재 수입요건은 HS4 후보 매핑이다. 공식 TARIC/Access2Markets measure를 구조화하면 HS10/조건별로 좁혀야 한다.
- 감면 VAT는 품목조건과 회원국별 적용 범위가 다르므로 표준세율 후보와 별도 행으로 관리한다.
