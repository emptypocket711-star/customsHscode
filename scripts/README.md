# Scripts

This folder contains helper scripts for local data preparation and operational maintenance.

## Local dev server

Use `npm run dev:local` when testing UI or E2E flows on the local Supabase stack.
It overrides `.env.local` Supabase values with local values and uses mock AI by
default, so route checks are faster and do not accidentally depend on the remote
project. Local Supabase keys must be passed through the shell; do not hard-code
them in scripts.

```bash
export LOCAL_SUPABASE_ANON_KEY='...'
export LOCAL_SUPABASE_SERVICE_ROLE_KEY='...'
npm run dev:local
npm run dev:local:env
```

To test the real GPT product-name flow against local Supabase, pass
`LOCAL_AI_PROVIDER=openai` and keep `OPENAI_API_KEY` in the shell or `.env.local`.
The script prints only origins and provider names, never secret values.

Run the product-name supplement flow against the local server with a stored local
session:

```bash
npm run e2e:product-supplement:local
```

The local runner requires a reachable local Next.js server, local Supabase health,
and `tmp/e2e-auth/local-developer.json`. It rejects non-local base URLs and does
not print secrets.

## Staging operations smoke

Use this sequence when staging or production smoke needs to include developer-only
operations pages. Keep all credentials in the shell or platform secret store;
do not commit them to `tmp/test-accounts.json`.

First check whether operations smoke can run:

```bash
npm run smoke:operations:ready
```

If no developer smoke credentials are available, prepare the designated developer
account with service-role credentials and a temporary password. This updates or
creates the Auth user and ensures the profile has `role=developer` and
`company_role=admin`.

```bash
export NEXT_PUBLIC_SUPABASE_URL='...'
export SUPABASE_SERVICE_ROLE_KEY='...'
export SMOKE_OPERATIONS_PASSWORD='...'
npm run smoke:operations:prepare
```

Then run the normal production smoke with operations credentials enabled:

```bash
export SMOKE_OPERATIONS_EMAIL='emptypocket711@gmail.com'
export SMOKE_OPERATIONS_PASSWORD='...'
npm run smoke:production -- https://your-preview-url.vercel.app
```

When Vercel deployment protection is enabled, also pass the bypass secret through
`VERCEL_AUTOMATION_BYPASS_SECRET` or `VERCEL_PROTECTION_BYPASS_SECRET`. The smoke
output includes `operationsEmailPresent`, `operationsPasswordPresent`, and
`operationsSkipReason` so missing or partial configuration is visible without
printing secret values.

Run the guard smoke separately to confirm non-developer accounts cannot see
operations page bodies:

```bash
npm run smoke:operations:guard -- https://your-preview-url.vercel.app
```

## Staging marketplace transaction E2E

Use this after Preview DB schema health is OK and a Preview deployment is ready.
The staging runner seeds deterministic marketplace fixture data, prepares the
operations developer account, creates requester/partner/developer storage states,
checks readiness, opens requester/partner/operations detail pages, and then
submits bids, selects partners, starts/completes requests, and verifies completed
feedback UI.

Remote fixture seeding is blocked by default. The staging runner sets
`E2E_ALLOW_REMOTE_MARKETPLACE_TRANSACTION=true` internally, but credentials must
still come from the shell or platform secret store.

```bash
vercel env run -e preview -- npm run e2e:marketplace-transaction:staging -- https://your-preview-url.vercel.app
```

When Vercel deployment protection is enabled, pass
`VERCEL_AUTOMATION_BYPASS_SECRET` or `VERCEL_PROTECTION_BYPASS_SECRET` in the
shell. The runner uses a separate `tmp/e2e-auth-staging` storage-state directory
by default and never prints secret values.

## Staging completion report E2E

Use this after the marketplace transaction E2E passes. The completion runner
seeds completion-report fixtures, creates requester/selected-partner/developer
storage states, verifies preview access and redaction, saves a draft report, and
then checks the dual acknowledgement RPC guard.

```bash
vercel env run -e preview -- npm run e2e:completion-preview:staging -- https://your-preview-url.vercel.app
```

Remote completion fixture seeding is blocked unless
`E2E_ALLOW_REMOTE_COMPLETION_PREVIEW=true` is present. The staging runner sets it
internally, but credentials must still come from the shell or platform secret
store. When deployment protection is enabled, pass
`VERCEL_AUTOMATION_BYPASS_SECRET` or `VERCEL_PROTECTION_BYPASS_SECRET`.

## Staging marketplace notification E2E

Use this after the marketplace transaction runner passes. The notification runner
reuses the marketplace transaction fixture, creates partner storage states, checks
notification readiness, opens the partner dashboard notification panel, follows
the opportunity link, and marks the in-app delivery as read.

```bash
vercel env run -e preview -- npm run e2e:marketplace-notification:staging -- https://your-preview-url.vercel.app
```

Remote notification E2E is blocked unless
`E2E_ALLOW_REMOTE_MARKETPLACE_NOTIFICATION=true` is present. The staging runner
sets it internally and also enables the marketplace transaction remote fixture
guard because it reuses that seed/auth flow. Keep all credentials in the shell or
platform secret store.

## Staging marketplace notification worker rehearsal

Use this after the notification dashboard E2E passes. This runner prepares the
marketplace mutation requests for notification targeting, calls the protected
worker route in dry-run mode, verifies `send=1` is blocked when provider
readiness is disabled, and then verifies claim-only mode creates deliveries
without external sends.

```bash
vercel env run -e preview -- npm run ops:marketplace-notifications:rehearse-staging -- https://your-preview-url.vercel.app
```

Remote worker rehearsal requires a Preview job secret through `JOB_WORKER_SECRET`
or `CRON_SECRET`. The runner also needs the Vercel deployment protection bypass
secret when Preview protection is enabled.

## Staging smoke suite

Use this when a Preview deployment should be checked end-to-end before wider
manual review. The suite runs DB schema health, marketplace schema visibility,
marketplace fixture seed, authenticated route smoke, operations guard,
marketplace transaction E2E, completion report E2E, notification dashboard E2E,
and notification worker rehearsal in that order.

```bash
vercel env run -e preview -- npm run smoke:staging:suite -- https://your-preview-url.vercel.app
```

The suite reads `tmp/test-accounts.json` only to fill missing shipper smoke and
E2E test password env values. Before route smoke and the operations guard it
refreshes the marketplace fixture requester, forwarder, and broker accounts, then
uses those accounts for authenticated route checks and guard checks instead of
stale local account rows. It does not print account passwords or secret values.
Keep Vercel bypass and job worker secrets in the shell or platform secret store.

Route smoke markers should be stable for the account state used by the suite.
Use page-level markers or fixture-stable content. Avoid markers that only appear
when a dashboard has no active work, no bids, or a particular zero-count fallback;
those can fail after fixture data is refreshed even when the application is
working correctly.

The suite prints a `suiteStepSummary` at the end of successful runs and when a
step fails. Each row includes the step status, duration, and purpose. On failure,
read `suiteFailureDetails`: it prints the failed command, exit code or signal,
the last passed step, and a targeted `nextAction` hint. Treat
`operations-guard` failures as access-control issues until the role/RLS path is
checked.

## Production schema health check

`check-production-schema.mjs` compares the current migration files with the
target Supabase database. It catches missing tables, columns, RPC/functions, and
RLS drift before deployment or after manual SQL changes.

```bash
npm run health:db
```

The script reads `DATABASE_URL` from the shell or `.env.local`. It does not
print secrets. Use `--json` for CI or machine-readable output.

## Official Customs Excel seed

`generate_customs_excel_seed.py` converts downloaded official Customs Excel files from `~/Downloads` into Supabase seed SQL with source metadata, checksums, effective dates, and `staged` status.

Generate the full seed:

```bash
python3 scripts/generate_customs_excel_seed.py
```

Generate one source group:

```bash
python3 scripts/generate_customs_excel_seed.py --only hs
python3 scripts/generate_customs_excel_seed.py --only standard
python3 scripts/generate_customs_excel_seed.py --only domestic-tariff
python3 scripts/generate_customs_excel_seed.py --only country-tariff
```

Use `--limit 5` with any mode for smoke checks.

Do not add scripts that fetch and publish legal data directly to production tables.
All official source imports must go through snapshot → staging → review → publish.

## Customs confirmation requirements API029 seed

`generate_customs_confirmation_seed.py` calls Customs MYC OpenAPI API029
`retrieveCcctLworCd` and writes staged rows for
`customs_confirmation_requirements`.

```bash
CUSTOMS_API_SERVICE_KEY=... python3 scripts/generate_customs_confirmation_seed.py \
  --hsk 3304101000 \
  --output /tmp/customs_confirmation_smoke.sql
```

Generate one HS heading/subheading range from the official HS master file:

```bash
CUSTOMS_API_SERVICE_KEY=... python3 scripts/generate_customs_confirmation_seed.py \
  --hsk-prefix 3304 \
  --output supabase/seed/generated/customs_confirmation_requirements_seed.sql
```

Generate from the official HS master file:

```bash
CUSTOMS_API_SERVICE_KEY=... python3 scripts/generate_customs_confirmation_seed.py \
  --limit 100 \
  --output supabase/seed/generated/customs_confirmation_requirements_seed.sql
```

Rows are generated as `staged`. Publish through the legal source publish panel
after review.

## Internal tax law rules seed

`generate_internal_tax_law_rules_seed.py` converts a CSV/XLSX mapping file into
staged rows for `internal_tax_law_rules`. Use this when official internal-tax
law appendices or 국민신문고 replies arrive as a spreadsheet.

Smoke check with the sample fixture:

```bash
python3 scripts/generate_internal_tax_law_rules_seed.py \
  scripts/fixtures/internal_tax_law_rules_sample.csv \
  --output /tmp/internal_tax_law_rules_seed.sql \
  --source-version internal-tax-law-rules-sample
```

Expected logical columns can be Korean or English:

- `세목코드` / `tax_type`
- `세목명` / `tax_name`
- `법령명` / `law_name`
- `조문` / `article_ref`
- `룰유형` / `rule_type`
- `HS패턴` / `hsk_pattern`
- `키워드` / `keyword_terms`
- `세율` / `rate_text`
- `계산식` / `rate_formula`
- `과세표준` / `tax_base_type`
- `조건` / `condition_text`
- `출처URL` / `source_url`
- `시행일` / `effective_from`
- `종료일` / `effective_to`

Rows with HS 10/6/4 digits are inferred as `hsk_exact`, `hs6`, or `hs4`.
Rows without HS but with keywords are inferred as `keyword_condition`; otherwise
they are loaded as `manual_review`.

If the output path is `supabase/seed/generated/internal_tax_law_rules_seed.sql`,
`apply_lookup_seed_bundle.sh` applies it by default. Set
`APPLY_INTERNAL_TAX_LAW_RULES=0` to skip it.

## HWP source text extraction

`extract_hwp_text.py` extracts rough visible text from HWP 5 files so official
appendices can be searched and stored as source snapshots.

```bash
python3 -m venv /tmp/customs-hwp-venv
/tmp/customs-hwp-venv/bin/python -m pip install olefile
/tmp/customs-hwp-venv/bin/python scripts/extract_hwp_text.py \
  ~/Downloads/'[별표 2] 세관장확인대상 수입물품(관세법 제226조에 따른 세관장확인물품 및 확인방법 지정고시).hwp' \
  --output /tmp/customs-confirmation-appendix-2.txt
```

This script is not a full table parser. Use the Customs MYC OpenAPI
`retrieveCcctLworCd` response for structured HSK-level requirement records when
an API key is available.

## Customs tariff API030 seed

`generate_customs_tariff_seed.py` calls Customs MYC OpenAPI API030
`retrieveTrrt` and writes staged rows for `tariff_rates`.

Smoke check one HSK:

```bash
CUSTOMS_API_SERVICE_KEY=... python3 scripts/generate_customs_tariff_seed.py \
  --hsk 3304101000 \
  --output /tmp/customs_tariff_smoke.sql
```

Generate one HS heading/subheading range:

```bash
CUSTOMS_API_SERVICE_KEY=... python3 scripts/generate_customs_tariff_seed.py \
  --hsk-prefix 3304 \
  --output supabase/seed/generated/customs_tariff_rates_api030_seed.sql
```

## Customs HS code search API018 seed

`generate_customs_hs_code_search_seed.py` calls Customs MYC OpenAPI API018
`searchHsSgn` and writes staged rows for
`customs_hs_code_search_items`. This stores Customs HS code search results in
our database, so customer product-name lookup does not need to call API018 in
real time.

Smoke check one HSK:

```bash
CUSTOMS_API_HS_CODE_SERVICE_KEY=... python3 scripts/generate_customs_hs_code_search_seed.py \
  --hsk 8443321010 \
  --output /tmp/customs_hs_code_search_smoke.sql
```

Generate one HS heading/subheading range from the official HS master file:

```bash
CUSTOMS_API_HS_CODE_SERVICE_KEY=... python3 scripts/generate_customs_hs_code_search_seed.py \
  --hsk-prefix 3304 \
  --output supabase/seed/generated/customs_hs_code_search_api018_seed.sql
```

Collect specific product-name queries:

```bash
CUSTOMS_API_HS_CODE_SERVICE_KEY=... python3 scripts/generate_customs_hs_code_search_seed.py \
  --query 프린터 \
  --query 버섯 \
  --output supabase/seed/generated/customs_hs_code_search_api018_seed.sql
```

Rows are deduplicated by `hsk_code + korean_name + english_name +
source_version` in the generated SQL. Re-running the monthly seed updates the
stored row metadata instead of inserting duplicates. Rows are generated as
`staged`; publish them through the legal source publish panel after review.

## Apply lookup seed bundle

`apply_lookup_seed_bundle.sh` applies the generated lookup data needed for the
current self-service HS screen:

- HS master
- standard product names
- API030 tariff rates generated for the current range
- API029 customs-confirmation requirements generated for the current range
- country destination tariff rates generated from the official country tariff workbook

It requires direct PostgreSQL access through `DATABASE_URL` and `psql`.

```bash
DATABASE_URL='postgresql://postgres:...@...:5432/postgres' \
  scripts/apply_lookup_seed_bundle.sh
```

On a fresh database, apply migrations first:

```bash
APPLY_MIGRATIONS=1 \
DATABASE_URL='postgresql://postgres:...@...:5432/postgres' \
  scripts/apply_lookup_seed_bundle.sh
```

The script directly marks the generated lookup source versions as `published`
for local/bootstrap use. In production, publish through the staff legal update
center or the audited publish RPC with an authenticated staff account.

The country destination tariff seed is large. It is applied by default because
the unified lookup screen can show export destination tariff rows. Skip it for
fast local smoke checks:

```bash
APPLY_EXPORT_DESTINATION_TARIFFS=0 \
DATABASE_URL='postgresql://postgres:...@...:5432/postgres' \
  scripts/apply_lookup_seed_bundle.sh
```

USITC HTS rows are normally applied from the generated SQL files. To regenerate
them before applying, set `GENERATE_USITC_HTS=1`. The generator supports small
prefix batches, a prefix file, or all HS4 prefixes present in the Korean HS
master seed:

```bash
GENERATE_USITC_HTS=1 \
USITC_HTS_PREFIXES=3304,4202 \
DATABASE_URL='postgresql://postgres:...@...:5432/postgres' \
  scripts/apply_lookup_seed_bundle.sh
```

```bash
GENERATE_USITC_HTS=1 \
USITC_HTS_PREFIX_MODE=korea-hs4 \
USITC_HTS_MAX_PREFIXES=50 \
DATABASE_URL='postgresql://postgres:...@...:5432/postgres' \
  scripts/apply_lookup_seed_bundle.sh
```

Japan Customs tariff rows are also applied from a generated SQL file. To
regenerate the 2026-04-01 Japan tariff schedule before applying, set
`GENERATE_JAPAN_CUSTOMS_TARIFF=1`:

```bash
GENERATE_JAPAN_CUSTOMS_TARIFF=1 \
DATABASE_URL='postgresql://postgres:...@...:5432/postgres' \
  scripts/apply_lookup_seed_bundle.sh
```

For targeted smoke checks, restrict the chapter list:

```bash
JAPAN_CUSTOMS_TARIFF_CHAPTERS=33,85 \
python3 scripts/generate_japan_customs_tariff_seed.py
```

Japan import consumption-tax and requirement rows depend on the generated Japan
tariff rows. Regenerate them after the Japan tariff seed is present:

```bash
python3 scripts/generate_japan_import_data_seed.py
```

China destination import-requirement rows are split by regulatory family. The
additional industrial generator covers lithium battery CCC, vehicle/parts CCC,
wood-product quarantine, and plant/seed quarantine candidates:

```bash
python3 scripts/generate_china_additional_industrial_requirements_seed.py
```

UK Trade Tariff API rows can be expanded by passing Korean HS6 prefixes or UK
10-digit commodity codes. Six-digit prefixes are resolved through the API search
and subheading endpoints before fetching commodity measures:

```bash
UK_TRADE_TARIFF_CODES=330410,330499,420229,850760 \
python3 scripts/generate_uk_trade_tariff_seed.py
```

`apply_lookup_seed_bundle.sh` applies `japan_import_data_seed.sql` by default.
Set `GENERATE_JAPAN_IMPORT_DATA=1` to regenerate it during bundle application.

EU import VAT and requirement rows depend on the EEC destination tariff
snapshot. The generated VAT rows cover EU member-state standard VAT candidates
and reuse the shared EEC tariff HS codes. Regenerate them after the EEC tariff
rows are present:

```bash
python3 scripts/generate_eu_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `eu_import_data_seed.sql` by default. Set
`GENERATE_EU_IMPORT_DATA=1` to regenerate it during bundle application.

United Arab Emirates import VAT and requirement rows depend on the ARE
destination tariff snapshot. Regenerate them after the ARE tariff rows are
present:

```bash
python3 scripts/generate_uae_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `uae_import_data_seed.sql` by default.
Set `GENERATE_UAE_IMPORT_DATA=1` to regenerate it during bundle application.

Switzerland import VAT and requirement rows depend on the CHE destination
tariff snapshot. Regenerate them after the CHE tariff rows are present:

```bash
python3 scripts/generate_switzerland_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `switzerland_import_data_seed.sql` by
default. Set `GENERATE_SWITZERLAND_IMPORT_DATA=1` to regenerate it during
bundle application.

Norway import VAT and requirement rows depend on the NOR destination tariff
snapshot. Regenerate them after the NOR tariff rows are present:

```bash
python3 scripts/generate_norway_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `norway_import_data_seed.sql` by default.
Set `GENERATE_NORWAY_IMPORT_DATA=1` to regenerate it during bundle application.

Iceland import VAT and requirement rows depend on the ISL destination tariff
snapshot. Regenerate them after the ISL tariff rows are present:

```bash
python3 scripts/generate_iceland_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `iceland_import_data_seed.sql` by
default. Set `GENERATE_ICELAND_IMPORT_DATA=1` to regenerate it during bundle
application.

Chile import IVA and requirement rows depend on the CHL destination tariff
snapshot. Regenerate them after the CHL tariff rows are present:

```bash
python3 scripts/generate_chile_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `chile_import_data_seed.sql` by default.
Set `GENERATE_CHILE_IMPORT_DATA=1` to regenerate it during bundle application.

Colombia import IVA and requirement rows depend on the COL destination tariff
snapshot. Regenerate them after the COL tariff rows are present:

```bash
python3 scripts/generate_colombia_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `colombia_import_data_seed.sql` by
default. Set `GENERATE_COLOMBIA_IMPORT_DATA=1` to regenerate it during bundle
application.

Costa Rica import IVA and requirement rows depend on the CRI destination tariff
snapshot. Regenerate them after the CRI tariff rows are present:

```bash
python3 scripts/generate_costa_rica_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `costa_rica_import_data_seed.sql` by
default. Set `GENERATE_COSTA_RICA_IMPORT_DATA=1` to regenerate it during bundle
application.

Panama import ITBMS and requirement rows depend on the PAN destination tariff
snapshot. Regenerate them after the PAN tariff rows are present:

```bash
python3 scripts/generate_panama_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `panama_import_data_seed.sql` by default.
Set `GENERATE_PANAMA_IMPORT_DATA=1` to regenerate it during bundle application.

Honduras import ISV and requirement rows depend on the HND destination tariff
snapshot. Regenerate them after the HND tariff rows are present:

```bash
python3 scripts/generate_honduras_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `honduras_import_data_seed.sql` by
default. Set `GENERATE_HONDURAS_IMPORT_DATA=1` to regenerate it during bundle
application.

Nicaragua import IVA and requirement rows depend on the NIC destination tariff
snapshot. Regenerate them after the NIC tariff rows are present:

```bash
python3 scripts/generate_nicaragua_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `nicaragua_import_data_seed.sql` by
default. Set `GENERATE_NICARAGUA_IMPORT_DATA=1` to regenerate it during bundle
application.

El Salvador import IVA and requirement rows depend on the SLV destination tariff
snapshot. Regenerate them after the SLV tariff rows are present:

```bash
python3 scripts/generate_el_salvador_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `el_salvador_import_data_seed.sql` by
default. Set `GENERATE_EL_SALVADOR_IMPORT_DATA=1` to regenerate it during bundle
application.

Brazil import tax and requirement rows depend on the BRA destination tariff
snapshot. Regenerate them after the BRA tariff rows are present:

```bash
python3 scripts/generate_brazil_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `brazil_import_data_seed.sql` by default.
Set `GENERATE_BRAZIL_IMPORT_DATA=1` to regenerate it during bundle application.

Israel import VAT and requirement rows depend on the ISR destination tariff
snapshot. Regenerate them after the ISR tariff rows are present:

```bash
python3 scripts/generate_israel_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `israel_import_data_seed.sql` by default.
Set `GENERATE_ISRAEL_IMPORT_DATA=1` to regenerate it during bundle application.

U.S. internal tax rows depend on the USITC HTS destination tariff snapshot.
Regenerate them after the USA tariff rows are present:

```bash
python3 scripts/generate_us_internal_tax_seed.py
```

`apply_lookup_seed_bundle.sh` applies `us_internal_tax_seed.sql` by default.
Set `GENERATE_US_INTERNAL_TAX=1` to regenerate it during bundle application.

Uzbekistan import VAT and requirement rows depend on the UZB destination tariff
snapshot. Regenerate them after the UZB tariff rows are present:

```bash
python3 scripts/generate_uzbekistan_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `uzbekistan_import_data_seed.sql` by
default. Set `GENERATE_UZBEKISTAN_IMPORT_DATA=1` to regenerate it during bundle
application.

Peru import IGV and requirement rows depend on the PER destination tariff
snapshot. Regenerate them after the PER tariff rows are present:

```bash
python3 scripts/generate_peru_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `peru_import_data_seed.sql` by default.
Set `GENERATE_PERU_IMPORT_DATA=1` to regenerate it during bundle application.

Australia import GST and requirement rows depend on the AUS destination tariff
snapshot. Regenerate them after the AUS tariff rows are present:

```bash
python3 scripts/generate_australia_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `australia_import_data_seed.sql` by
default. Set `GENERATE_AUSTRALIA_IMPORT_DATA=1` to regenerate it during bundle
application.

Canada import GST and requirement rows depend on the CAN destination tariff
snapshot. Regenerate them after the CAN tariff rows are present:

```bash
python3 scripts/generate_canada_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `canada_import_data_seed.sql` by default.
Set `GENERATE_CANADA_IMPORT_DATA=1` to regenerate it during bundle application.

India import IGST and requirement rows depend on the IND destination tariff
snapshot. Regenerate them after the IND tariff rows are present:

```bash
python3 scripts/generate_india_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `india_import_data_seed.sql` by default.
Set `GENERATE_INDIA_IMPORT_DATA=1` to regenerate it during bundle application.

Vietnam import VAT and requirement rows depend on the VNM destination tariff
snapshot. Regenerate them after the VNM tariff rows are present:

```bash
python3 scripts/generate_vietnam_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `vietnam_import_data_seed.sql` by default.
Set `GENERATE_VIETNAM_IMPORT_DATA=1` to regenerate it during bundle application.

Thailand import VAT and requirement rows depend on the THA destination tariff
snapshot. Regenerate them after the THA tariff rows are present:

```bash
python3 scripts/generate_thailand_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `thailand_import_data_seed.sql` by default.
Set `GENERATE_THAILAND_IMPORT_DATA=1` to regenerate it during bundle application.

Indonesia import VAT and requirement rows depend on the IDN destination tariff
snapshot. Regenerate them after the IDN tariff rows are present:

```bash
python3 scripts/generate_indonesia_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `indonesia_import_data_seed.sql` by
default. Set `GENERATE_INDONESIA_IMPORT_DATA=1` to regenerate it during bundle
application.

Mexico import IVA and requirement rows depend on the MEX destination tariff
snapshot. Regenerate them after the MEX tariff rows are present:

```bash
python3 scripts/generate_mexico_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `mexico_import_data_seed.sql` by default.
Set `GENERATE_MEXICO_IMPORT_DATA=1` to regenerate it during bundle application.

Bangladesh import VAT and requirement rows depend on the BGD destination tariff
snapshot. Regenerate them after the BGD tariff rows are present:

```bash
python3 scripts/generate_bangladesh_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `bangladesh_import_data_seed.sql` by
default. Set `GENERATE_BANGLADESH_IMPORT_DATA=1` to regenerate it during bundle
application.

Laos import VAT and requirement rows depend on the LAO destination tariff
snapshot. Regenerate them after the LAO tariff rows are present:

```bash
python3 scripts/generate_laos_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `laos_import_data_seed.sql` by default.
Set `GENERATE_LAOS_IMPORT_DATA=1` to regenerate it during bundle application.

Malaysia import SST/excise and requirement rows depend on the MYS destination
tariff snapshot. The generator separates workbook sales-tax/excise columns and
adds a general "no VAT/GST" row because Malaysia uses SST instead of a broad
VAT/GST import tax. Regenerate it after the MYS tariff rows are present:

```bash
python3 scripts/generate_malaysia_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `malaysia_import_data_seed.sql` by
default. Set `GENERATE_MALAYSIA_IMPORT_DATA=1` to regenerate it during bundle
application.

Philippines import VAT and requirement rows depend on the PHL destination tariff
snapshot. Regenerate them after the PHL tariff rows are present:

```bash
python3 scripts/generate_philippines_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `philippines_import_data_seed.sql` by
default. Set `GENERATE_PHILIPPINES_IMPORT_DATA=1` to regenerate it during bundle
application.

Singapore import GST and requirement rows depend on the SGP destination tariff
snapshot. Regenerate them after the SGP tariff rows are present:

```bash
python3 scripts/generate_singapore_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `singapore_import_data_seed.sql` by
default. Set `GENERATE_SINGAPORE_IMPORT_DATA=1` to regenerate it during bundle
application.

Cambodia import VAT/special-tax and requirement rows depend on the CAM
destination tariff snapshot. The generator uses the workbook VAT/special-tax
columns where present and fills remaining CAM tariff rows with the GDT standard
10% VAT candidate. Regenerate it after the CAM tariff rows are present:

```bash
python3 scripts/generate_cambodia_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `cambodia_import_data_seed.sql` by
default. Set `GENERATE_CAMBODIA_IMPORT_DATA=1` to regenerate it during bundle
application.

Myanmar import commercial-tax and requirement rows depend on the MYA destination
tariff snapshot. Regenerate them after the MYA tariff rows are present:

```bash
python3 scripts/generate_myanmar_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `myanmar_import_data_seed.sql` by default.
Set `GENERATE_MYANMAR_IMPORT_DATA=1` to regenerate it during bundle application.

Brunei import requirement rows depend on the BRU destination tariff snapshot.
Regenerate them after the BRU tariff rows are present:

```bash
python3 scripts/generate_brunei_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `brunei_import_data_seed.sql` by default.
Set `GENERATE_BRUNEI_IMPORT_DATA=1` to regenerate it during bundle application.

New Zealand import GST and requirement rows depend on the NZL destination tariff
snapshot. Regenerate them after the NZL tariff rows are present:

```bash
python3 scripts/generate_new_zealand_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `new_zealand_import_data_seed.sql` by
default. Set `GENERATE_NEW_ZEALAND_IMPORT_DATA=1` to regenerate it during bundle
application.

Taiwan import business-tax and requirement rows depend on the TWN destination
tariff snapshot. Regenerate them after the TWN tariff rows are present:

```bash
python3 scripts/generate_taiwan_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `taiwan_import_data_seed.sql` by default.
Set `GENERATE_TAIWAN_IMPORT_DATA=1` to regenerate it during bundle application.

Turkey import VAT and requirement rows depend on the TUR destination tariff
snapshot. The generator uses the workbook VAT column where present and fills
remaining TUR tariff rows with a standard 20% KDV candidate. Regenerate it after
the TUR tariff rows are present:

```bash
python3 scripts/generate_turkey_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `turkey_import_data_seed.sql` by default.
Set `GENERATE_TURKEY_IMPORT_DATA=1` to regenerate it during bundle application.

Saudi Arabia import VAT and requirement rows depend on the SAU destination
tariff snapshot. Regenerate them after the SAU tariff rows are present:

```bash
python3 scripts/generate_saudi_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `saudi_import_data_seed.sql` by default.
Set `GENERATE_SAUDI_IMPORT_DATA=1` to regenerate it during bundle application.

South Africa import VAT and requirement rows depend on the ZAF destination
tariff snapshot. Regenerate them after the ZAF tariff rows are present:

```bash
python3 scripts/generate_south_africa_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `south_africa_import_data_seed.sql` by default.
Set `GENERATE_SOUTH_AFRICA_IMPORT_DATA=1` to regenerate it during bundle application.

Mongolia import VAT and requirement rows depend on the MNG destination tariff
snapshot. Regenerate them after the MNG tariff rows are present:

```bash
python3 scripts/generate_mongolia_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `mongolia_import_data_seed.sql` by default.
Set `GENERATE_MONGOLIA_IMPORT_DATA=1` to regenerate it during bundle application.

Russia import VAT and requirement rows depend on the RUS destination tariff
snapshot. Regenerate them after the RUS tariff rows are present:

```bash
python3 scripts/generate_russia_import_data_seed.py
```

`apply_lookup_seed_bundle.sh` applies `russia_import_data_seed.sql` by default.
Set `GENERATE_RUSSIA_IMPORT_DATA=1` to regenerate it during bundle application.

## U.S. AD/CVD trade remedy cases

`generate_us_adcvd_trade_remedy_seed.py` converts a CBP ACE ES-105 Active
AD/CVD Case report CSV/XLSX into `export_destination_trade_remedy_cases` seed
SQL.

```bash
python3 scripts/generate_us_adcvd_trade_remedy_seed.py \
  /path/to/ACE_ES105.csv \
  --output supabase/seed/generated/us_adcvd_trade_remedy_cases_seed.sql
```

The public data.gov AD/CVD metadata currently does not expose a downloadable
resource. Export the ACE ES-105 report from ACE, then run the generator. If
`us_adcvd_trade_remedy_cases_seed.sql` exists, `apply_lookup_seed_bundle.sh`
applies it automatically and publishes `us-cbp-adcvd-active-cases-*`.

## API019 statistical codes

Generate staged customs statistical-code rows for internal-tax related code tables:

```bash
CUSTOMS_API_STATS_CODE_SERVICE_KEY=... \
python3 scripts/generate_customs_statistical_codes_seed.py \
  --output supabase/seed/generated/customs_statistical_codes_api019_seed.sql
```

The default code types are:

- `A01`: 내국세율 부호
- `A04`: 부가세감면율 부호
- `A07`: 내국세세종 부호

API019 provides code tables. It is not a complete HSK-to-internal-tax rules engine by itself.
