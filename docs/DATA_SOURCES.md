# Data Sources

This project should use official or controlled sources first.

## Primary Official Sources

### 국가법령정보센터

Use for:
- laws
- enforcement decrees
- enforcement rules
- administrative rules
- law change history
- article revision history

Required metadata:
- law name
- law id
- article number
- promulgation date
- enforcement date
- revision type
- ministry
- retrieved_at

### 관세청 / 공공데이터포털

Use for:
- HS/HSK master
- standard product names
- tariff rates
- country codes where applicable
- customs exchange rates
- customs confirmation target goods
- cargo clearance progress where customer supplies B/L or cargo identifiers

Current connector scaffold:

- `server/integrations/public-data/client.ts`
- `server/integrations/customs/customs-api.ts`

Environment variables:

- `PUBLIC_DATA_SERVICE_KEY`
- `CUSTOMS_API_SERVICE_KEY`
- `CUSTOMS_API_CUSTOMS_CONFIRMATION_URL`
- `CUSTOMS_API_TARIFF_RATE_URL`
- `CUSTOMS_API_EXCHANGE_RATE_URL`
- `CUSTOMS_API_EXCHANGE_RATE_SERVICE_KEY`
- `CUSTOMS_API_CARGO_PROGRESS_URL`

Do not treat live API response text as final legal output. Store or transform it into source snapshots with checksum, retrieved timestamp, source version, effective date, and staff review status before customer-facing reports use it.

Customs MYC OpenAPI notes from `MYC_OpenAPI 연계가이드_v3.9`:

- API029 `세관장확인대상 법령코드 조회`
- service name: `retrieveCcctLworCd`
- URL: `https://unipass.customs.go.kr:38010/ext/rest/ccctLworCdQry/retrieveCcctLworCd`
- auth parameter: `crkyCn`
- request parameters: `hsSgn` HSK 10 digits, `imexTp` where `1` is export and `2` is import
- response fields include `dcerCfrmLworNm` related law, `reqApreIttNm` approval agency, `reqCfrmIstmNm` requirement document, `aplyStrtDt`, and `aplyEndDt`
- API030 `관세율 조회`
- service name: `retrieveTrrt`
- URL: `https://unipass.customs.go.kr:38010/ext/rest/trrtQry/retrieveTrrt`
- auth parameter: `crkyCn`
- request parameters: `hsSgn` HSK 10 digits, optional `trrtTpcd` tariff-rate type code
- response fields include `trrtTpcd` tariff-rate type code, `trrtTpNm` tariff-rate type name, `trrt` ad valorem rate, `prutXamt` unit duty, `basePrc`, `aplyStrtDt`, and `aplyEndDt`
- API019 `통계부호내역조회`
- service name: `retrieveStatsSgnBrkd`
- URL: `https://unipass.customs.go.kr:38010/ext/rest/statsSgnQry/retrieveStatsSgnBrkd`
- auth parameter: `crkyCn`
- request parameter: `statsSgnTp`
- internal-tax-related code types: `A01` 내국세율 부호, `A04` 부가세감면율 부호, `A07` 내국세세종 부호
- response fields include `statsSgn`, `koreBrkd`, `itxRt`, or code-table fields such as `cdValtVal`, `cdValtValNm`
- API043 `HS CODE 내비게이션 조회`
- service name: `cmtrStatsQry`
- URL: `https://unipass.customs.go.kr:38010/ext/rest/cmtrStatsQry/retrieveCmtrStats`
- auth parameter: `crkyCn`
- request parameter: `hsSgn`
- response fields include `hs10Sgn`, `prlstNm`, `acrsTcntRnk`, and `prlstLnCnt`
- Despite the service name, API043 is not an HS hierarchy/tree source and not an internal-tax mapping source. It provides ranked declaration item-name statistics for an HS10 query and can be used to improve product-name suggestions or examples.
- API018 `HS부호검색`
- service name: `searchHsSgn`
- URL: `https://unipass.customs.go.kr:38010/ext/rest/hsSgnQry/searchHsSgn`
- auth parameter: `crkyCn`
- request parameters: `hsSgn` HSK code, `prnm` product name, `koenTp` where `1` is Korean and `2` is English
- response fields include `hsSgn`, `korePrnm`, `englPrnm`, `qtyUt`, `wghtUt`, `txrt`, and `txtpSgn`
- Do not call API018 from every customer lookup. Collect API018 rows on a scheduled basis, store them in `customs_hs_code_search_items`, and query our database during product-name recommendation.
- Deduplicate API018 rows by `hsk_code + korean_name + english_name + source_version`. Re-running the same monthly source version must update row metadata instead of creating duplicate lookup candidates.
- API012 `관세환율 정보`
- service name: `retrieveTrifFxrtInfo`
- URL: `https://unipass.customs.go.kr:38010/ext/rest/trifFxrtInfoQry/retrieveTrifFxrtInfo`
- auth parameter: `crkyCn`
- request parameters: `qryYymmDd` as `YYYYMMDD`, `imexTp` where `1` is export and `2` is import
- response fields include `cntySgn`, `mtryUtNm`, `currSgn`, `fxrt`, `aplyBgnDt`, and `imexTp`
- Use API012 later for expected duty/tax calculation when a user enters a customs value in foreign currency. Do not build the final tax calculator until HSK-to-internal-tax mapping rules are available.

For import requirements, prefer this order:

1. Stored and published API029 snapshots by HSK 10 and import/export direction.
2. HWP appendix `[별표 2] 세관장확인대상 수입물품` as the official legal source snapshot and fallback/manual audit source.
3. Internal requirement playbooks for procedure, expected documents, lead time, and practical user guidance.

Generate staged API029 seed rows with:

```bash
CUSTOMS_API_SERVICE_KEY=... python3 scripts/generate_customs_confirmation_seed.py \
  --output supabase/seed/generated/customs_confirmation_requirements_seed.sql
```

Generate staged API030 tariff rows with:

```bash
CUSTOMS_API_SERVICE_KEY=... python3 scripts/generate_customs_tariff_seed.py \
  --hsk-prefix 3304 \
  --output supabase/seed/generated/customs_tariff_rates_api030_seed.sql
```

Generate staged API019 statistical-code rows with:

```bash
CUSTOMS_API_STATS_CODE_SERVICE_KEY=... python3 scripts/generate_customs_statistical_codes_seed.py \
  --output supabase/seed/generated/customs_statistical_codes_api019_seed.sql
```

Generate staged API018 HS-code-search rows with:

```bash
CUSTOMS_API_HS_CODE_SERVICE_KEY=... python3 scripts/generate_customs_hs_code_search_seed.py \
  --hsk-prefix 3304 \
  --output supabase/seed/generated/customs_hs_code_search_api018_seed.sql
```

API019 is a code-table source. It does not by itself map every HSK to final internal taxes. Use it as source data for internal-tax rule tables and calculation workflows.

API043 is a trade-statistics/navigation source. In local smoke checks, full HSK10 queries such as `4202290000` return ranked item-name rows, while broad wildcard patterns may return no rows depending on the query.

API012 is an exchange-rate source for future expected duty and internal-tax calculations. It is not enough to calculate final import taxes by itself; the calculator also needs tariff rows, customs value inputs, currency selection, and HSK-to-internal-tax mapping rules.

API018 is a lookup-support source. It can improve HS candidate recall for short or English product-name searches, but it is not a classification decision source. Store it as `staged`, publish reviewed source versions, and keep AI/user-facing language provisional.

For focused development, generate one HSK range first:

```bash
CUSTOMS_API_SERVICE_KEY=... python3 scripts/generate_customs_confirmation_seed.py \
  --hsk-prefix 3304 \
  --output supabase/seed/generated/customs_confirmation_requirements_seed.sql
```

### 관세청 Excel downloads

Local official Excel files can be converted into Supabase seed SQL with:

```bash
python3 scripts/generate_customs_excel_seed.py
```

For large imports, generate and apply the source groups separately:

```bash
python3 scripts/generate_customs_excel_seed.py --only hs --output supabase/seed/generated/customs_hs_seed.sql
python3 scripts/generate_customs_excel_seed.py --only standard --output supabase/seed/generated/customs_standard_product_seed.sql
python3 scripts/generate_customs_excel_seed.py --only domestic-tariff --output supabase/seed/generated/customs_domestic_tariff_seed.sql
python3 scripts/generate_customs_excel_seed.py --only country-tariff --output supabase/seed/generated/customs_export_destination_tariff_seed.sql
```

Current generated row counts:

- `customs_hs_seed.sql`: 12,469 `hs_master` rows
- `customs_standard_product_seed.sql`: 26,873 `standard_product_names` rows
- `customs_domestic_tariff_seed.sql`: 760,428 raw `tariff_rates` rows. The official workbook contains duplicate tariff rows across sheets; apply through a staging/temp-table dedupe step before inserting into production. The current production deduped import is 380,229 published rows.
- `customs_export_destination_tariff_seed.sql`: 665,657 `export_destination_tariff_rates` rows

Expected local files:

- `~/Downloads/관세청_HS부호_20260101.xlsx`
- `~/Downloads/관세청_표준품명_20260101.xlsx`
- `~/Downloads/관세청_품목번호별 관세율표_20260211.xlsx`
- `~/Downloads/관세청_국가별 관세율표_20251231.zip`

The first three files map to `hs_master`, `standard_product_names`, and `tariff_rates`. The country-by-country tariff zip maps to `export_destination_tariff_rates` because it is destination-country/export reference data and its FTA/agreement columns vary by country.

Generated official rows are inserted as `staged`. Staff/admin users must review the source inventory and publish the intended `source_version` from the legal update center before customer-facing diagnosis uses those rows as published legal data.

Domestic import lookup also maintains `domestic_hs_lookup_snapshots`, a materialized read model keyed by Korean HSK 10 digits. It pre-joins:

- `hs_master`
- `tariff_rates`
- `customs_confirmation_requirements`
- `integrated_public_notice_requirements`
- `internal_tax_law_rules`

This snapshot is for fast customer lookup and coverage checks only. The legal source of truth remains the versioned source tables. Refresh it after publishing official data:

```sql
select public.refresh_domestic_hs_lookup_snapshots();
select * from public.get_domestic_hs_lookup_snapshot_coverage();
```

As of the 2026-05-25 production import, 11,326 of 11,327 published HSK10 rows have exact 10-digit tariff rates. The remaining no-tariff row is `2424.00-0000 이사화물`, which should be treated as a special-code/source-coverage exception rather than deriving tariff rates from HS6.

### 관세법령정보포털 CLIP

Use for:
- customs confirmation requirements
- export/import requirement documents
- related law
- effective date

### 관세청 FTA 포털

Use for:
- FTA agreement data
- C/O issue method
- origin declaration / certificate rules
- PSR
- direct transport guidance
- preferential tariff references

### 한국교통안전공단 사이버검사소

Use for:
- automobile specification lookup by 제원관리번호
- maker, model, type, vehicle class, weight, fuel, displacement, and related vehicle-spec fields

Current connector:

- Page: `https://www.cyberts.kr/ts/tis/ism/readTsTisSpecSvcMainView.do`
- Server action: `lookupVehicleSpecAction`
- Service wrapper: `server/services/cyberts-vehicle-spec.service.ts`
- UI page: `/vehicle-spec`

Notes:

- This is a screen-backed CyberTS lookup, not a separately contracted public API.
- The user-facing input is 제원관리번호. Do not represent it as an arbitrary vehicle-name search.
- The server wrapper fetches the CyberTS page session/CSRF token and submits the automobile (`specType=CAR`) lookup request.
- CyberTS security policy, IP blocking, or page structure changes can break this connector. Keep a direct source link on the result screen and treat this feature as a supplementary lookup.
- The lookup is protected with app rate limiting and a cache. Optional tuning variables:
  - `VEHICLE_SPEC_RATE_LIMIT_PER_MINUTE`
  - `CYBERTS_REQUEST_TIMEOUT_MS`
  - `CYBERTS_VEHICLE_SPEC_CACHE_TTL_MS`

### 전략물자관리시스템

Use for:
- strategic goods self-classification guidance
- expert classification guidance
- export license guidance
- concern-user screening link or workflow

## Internal Maintained Data

### Requirement Playbooks

Because official data often states the required document but not the practical workflow, maintain internal playbooks:

- agency
- application portal
- required documents
- expected lead time
- exemption possibility
- common rejection reasons
- customer request template
- staff checklist

### HS Heuristics

Maintain internal heuristics for product-name HS candidate generation:
- keywords
- material/function rules
- common classification questions
- exclusion notes
- common Korean trade descriptions

## Data Reliability Ranking

1. Effective official data in local DB with source snapshot
2. Official API live response with timestamp
3. Official page manually captured with checksum
4. Staff-reviewed internal playbook
5. AI-generated draft marked as unreviewed

## Forbidden

Do not use random blogs, forum posts, or outdated scraped text as authoritative legal data.
