#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required." >&2
  echo "Example: DATABASE_URL='postgresql://postgres:...@...:5432/postgres' scripts/apply_lookup_seed_bundle.sh" >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required but was not found in PATH." >&2
  exit 1
fi

run_sql_file() {
  local file="$1"
  echo "applying ${file#$ROOT_DIR/}"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$file"
}

if [[ "${APPLY_MIGRATIONS:-0}" == "1" ]]; then
  while IFS= read -r migration; do
    run_sql_file "$migration"
  done < <(find "$ROOT_DIR/supabase/migrations" -maxdepth 1 -type f -name '*.sql' | sort)
fi

run_sql_file "$ROOT_DIR/supabase/seed/generated/customs_hs_seed.sql"
run_sql_file "$ROOT_DIR/supabase/seed/generated/customs_standard_product_seed.sql"
if [[ "${APPLY_CUSTOMS_HS_CODE_SEARCH:-1}" == "1" && -f "$ROOT_DIR/supabase/seed/generated/customs_hs_code_search_api018_seed.sql" ]]; then
  run_sql_file "$ROOT_DIR/supabase/seed/generated/customs_hs_code_search_api018_seed.sql"
fi
run_sql_file "$ROOT_DIR/supabase/seed/generated/customs_tariff_rates_api030_seed.sql"
run_sql_file "$ROOT_DIR/supabase/seed/generated/customs_confirmation_requirements_seed.sql"
run_sql_file "$ROOT_DIR/supabase/seed/generated/export_destination_data_sources_seed.sql"

if [[ "${APPLY_INTERNAL_TAX_LAW_RULES:-1}" == "1" && -f "$ROOT_DIR/supabase/seed/generated/internal_tax_law_rules_seed.sql" ]]; then
  run_sql_file "$ROOT_DIR/supabase/seed/generated/internal_tax_law_rules_seed.sql"
fi

if [[ "${APPLY_EXPORT_DESTINATION_TARIFFS:-1}" == "1" ]]; then
  run_sql_file "$ROOT_DIR/supabase/seed/generated/customs_export_destination_tariff_seed.sql"
fi

if [[ "${APPLY_CHINA_2026_TARIFFS:-1}" == "1" ]]; then
  run_sql_file "$ROOT_DIR/supabase/seed/generated/china_2026_import_tariff_seed.sql"
fi

if [[ "${APPLY_CHINA_CUSTOMS_CODES:-1}" == "1" ]]; then
  run_sql_file "$ROOT_DIR/supabase/seed/generated/china_2026_customs_codes_seed.sql"
fi

if [[ "${APPLY_CHINA_INTERNAL_TAXES:-1}" == "1" ]]; then
  run_sql_file "$ROOT_DIR/supabase/seed/generated/china_2026_import_internal_tax_seed.sql"
fi

if [[ "${APPLY_CHINA_IMPORT_REQUIREMENTS:-1}" == "1" ]]; then
  run_sql_file "$ROOT_DIR/supabase/seed/generated/china_3304_cosmetics_import_requirements_seed.sql"
  run_sql_file "$ROOT_DIR/supabase/seed/generated/china_cites_import_requirements_seed.sql"
  run_sql_file "$ROOT_DIR/supabase/seed/generated/china_processed_food_import_requirements_seed.sql"
  run_sql_file "$ROOT_DIR/supabase/seed/generated/china_electrical_ccc_import_requirements_seed.sql"
  run_sql_file "$ROOT_DIR/supabase/seed/generated/china_pharma_medical_import_requirements_seed.sql"
  run_sql_file "$ROOT_DIR/supabase/seed/generated/china_chemical_import_requirements_seed.sql"
  run_sql_file "$ROOT_DIR/supabase/seed/generated/china_textile_apparel_import_requirements_seed.sql"
  run_sql_file "$ROOT_DIR/supabase/seed/generated/china_additional_industrial_import_requirements_seed.sql"
fi

if [[ "${APPLY_UK_TRADE_TARIFF_API:-1}" == "1" ]]; then
  run_sql_file "$ROOT_DIR/supabase/seed/generated/uk_trade_tariff_api_seed.sql"
fi

if [[ "${APPLY_JAPAN_CUSTOMS_TARIFF:-1}" == "1" ]]; then
  if [[ "${GENERATE_JAPAN_CUSTOMS_TARIFF:-0}" == "1" ]]; then
    echo "generating Japan Customs tariff seed"
    python3 "$ROOT_DIR/scripts/generate_japan_customs_tariff_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/japan_customs_tariff_seed.sql"
fi

if [[ "${APPLY_JAPAN_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_JAPAN_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Japan import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_japan_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/japan_import_data_seed.sql"
fi

if [[ "${APPLY_EU_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_EU_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating EU import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_eu_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/eu_import_data_seed.sql"
fi

if [[ "${APPLY_AUSTRALIA_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_AUSTRALIA_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Australia import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_australia_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/australia_import_data_seed.sql"
fi

if [[ "${APPLY_CANADA_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_CANADA_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Canada import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_canada_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/canada_import_data_seed.sql"
fi

if [[ "${APPLY_INDIA_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_INDIA_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating India import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_india_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/india_import_data_seed.sql"
fi

if [[ "${APPLY_VIETNAM_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_VIETNAM_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Vietnam import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_vietnam_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/vietnam_import_data_seed.sql"
fi

if [[ "${APPLY_THAILAND_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_THAILAND_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Thailand import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_thailand_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/thailand_import_data_seed.sql"
fi

if [[ "${APPLY_INDONESIA_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_INDONESIA_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Indonesia import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_indonesia_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/indonesia_import_data_seed.sql"
fi

if [[ "${APPLY_MEXICO_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_MEXICO_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Mexico import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_mexico_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/mexico_import_data_seed.sql"
fi

if [[ "${APPLY_BANGLADESH_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_BANGLADESH_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Bangladesh import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_bangladesh_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/bangladesh_import_data_seed.sql"
fi

if [[ "${APPLY_LAOS_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_LAOS_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Laos import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_laos_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/laos_import_data_seed.sql"
fi

if [[ "${APPLY_MALAYSIA_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_MALAYSIA_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Malaysia import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_malaysia_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/malaysia_import_data_seed.sql"
fi

if [[ "${APPLY_PHILIPPINES_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_PHILIPPINES_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Philippines import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_philippines_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/philippines_import_data_seed.sql"
fi

if [[ "${APPLY_SINGAPORE_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_SINGAPORE_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Singapore import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_singapore_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/singapore_import_data_seed.sql"
fi

if [[ "${APPLY_CAMBODIA_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_CAMBODIA_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Cambodia import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_cambodia_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/cambodia_import_data_seed.sql"
fi

if [[ "${APPLY_MYANMAR_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_MYANMAR_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Myanmar import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_myanmar_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/myanmar_import_data_seed.sql"
fi

if [[ "${APPLY_BRUNEI_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_BRUNEI_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Brunei import requirement seed"
    python3 "$ROOT_DIR/scripts/generate_brunei_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/brunei_import_data_seed.sql"
fi

if [[ "${APPLY_NEW_ZEALAND_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_NEW_ZEALAND_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating New Zealand import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_new_zealand_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/new_zealand_import_data_seed.sql"
fi

if [[ "${APPLY_TAIWAN_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_TAIWAN_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Taiwan import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_taiwan_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/taiwan_import_data_seed.sql"
fi

if [[ "${APPLY_TURKEY_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_TURKEY_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Turkey import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_turkey_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/turkey_import_data_seed.sql"
fi

if [[ "${APPLY_SAUDI_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_SAUDI_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Saudi Arabia import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_saudi_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/saudi_import_data_seed.sql"
fi

if [[ "${APPLY_UAE_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_UAE_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating United Arab Emirates import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_uae_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/uae_import_data_seed.sql"
fi

if [[ "${APPLY_SWITZERLAND_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_SWITZERLAND_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Switzerland import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_switzerland_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/switzerland_import_data_seed.sql"
fi

if [[ "${APPLY_NORWAY_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_NORWAY_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Norway import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_norway_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/norway_import_data_seed.sql"
fi

if [[ "${APPLY_ICELAND_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_ICELAND_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Iceland import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_iceland_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/iceland_import_data_seed.sql"
fi

if [[ "${APPLY_CHILE_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_CHILE_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Chile import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_chile_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/chile_import_data_seed.sql"
fi

if [[ "${APPLY_COLOMBIA_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_COLOMBIA_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Colombia import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_colombia_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/colombia_import_data_seed.sql"
fi

if [[ "${APPLY_COSTA_RICA_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_COSTA_RICA_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Costa Rica import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_costa_rica_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/costa_rica_import_data_seed.sql"
fi

if [[ "${APPLY_PANAMA_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_PANAMA_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Panama import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_panama_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/panama_import_data_seed.sql"
fi

if [[ "${APPLY_HONDURAS_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_HONDURAS_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Honduras import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_honduras_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/honduras_import_data_seed.sql"
fi

if [[ "${APPLY_NICARAGUA_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_NICARAGUA_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Nicaragua import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_nicaragua_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/nicaragua_import_data_seed.sql"
fi

if [[ "${APPLY_EL_SALVADOR_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_EL_SALVADOR_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating El Salvador import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_el_salvador_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/el_salvador_import_data_seed.sql"
fi

if [[ "${APPLY_BRAZIL_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_BRAZIL_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Brazil import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_brazil_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/brazil_import_data_seed.sql"
fi

if [[ "${APPLY_ISRAEL_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_ISRAEL_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Israel import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_israel_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/israel_import_data_seed.sql"
fi

if [[ "${APPLY_UZBEKISTAN_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_UZBEKISTAN_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Uzbekistan import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_uzbekistan_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/uzbekistan_import_data_seed.sql"
fi

if [[ "${APPLY_PERU_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_PERU_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Peru import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_peru_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/peru_import_data_seed.sql"
fi

if [[ "${APPLY_SOUTH_AFRICA_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_SOUTH_AFRICA_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating South Africa import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_south_africa_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/south_africa_import_data_seed.sql"
fi

if [[ "${APPLY_MONGOLIA_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_MONGOLIA_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Mongolia import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_mongolia_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/mongolia_import_data_seed.sql"
fi

if [[ "${APPLY_RUSSIA_IMPORT_DATA:-1}" == "1" ]]; then
  if [[ "${GENERATE_RUSSIA_IMPORT_DATA:-0}" == "1" ]]; then
    echo "generating Russia import tax and requirement seed"
    python3 "$ROOT_DIR/scripts/generate_russia_import_data_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/russia_import_data_seed.sql"
fi

if [[ "${APPLY_USITC_HTS:-1}" == "1" ]]; then
  if [[ "${GENERATE_USITC_HTS:-0}" == "1" ]]; then
    echo "generating USITC HTS seed"
    python3 "$ROOT_DIR/scripts/generate_usitc_hts_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/usitc_hts_seed.sql"
  run_sql_file "$ROOT_DIR/supabase/seed/generated/us_chapter99_additional_tariffs_seed.sql"
fi

if [[ "${APPLY_US_INTERNAL_TAX:-1}" == "1" ]]; then
  if [[ "${GENERATE_US_INTERNAL_TAX:-0}" == "1" ]]; then
    echo "generating U.S. internal tax seed"
    python3 "$ROOT_DIR/scripts/generate_us_internal_tax_seed.py"
  fi
  run_sql_file "$ROOT_DIR/supabase/seed/generated/us_internal_tax_seed.sql"
fi

if [[ "${APPLY_US_IMPORT_REQUIREMENTS:-1}" == "1" ]]; then
  run_sql_file "$ROOT_DIR/supabase/seed/generated/us_import_requirements_seed.sql"
fi

if [[ "${APPLY_US_AD_CVD:-1}" == "1" && -f "$ROOT_DIR/supabase/seed/generated/us_adcvd_trade_remedy_cases_seed.sql" ]]; then
  run_sql_file "$ROOT_DIR/supabase/seed/generated/us_adcvd_trade_remedy_cases_seed.sql"
fi

if [[ "${PUBLISH_SEEDS:-1}" == "1" ]]; then
  echo "publishing lookup seed source versions"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
update public.hs_master
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version = 'customs-hs-20260101';

update public.standard_product_names
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version = 'customs-standard-product-20260101';

update public.tariff_rates
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version = 'myc-openapi-api030-v1.0';

update public.customs_confirmation_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version = 'myc-openapi-api029-v1.0';

update public.export_destination_tariff_rates
set status = 'published'::public.legal_record_status,
    effective_to = null,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'customs-country-tariff-20251231:%';

update public.export_destination_tariff_rates
set effective_to = date '2025-12-31'
where country_code = 'CHN'
  and source_version like 'customs-country-tariff-20251231:%'
  and effective_to is null;

update public.export_destination_tariff_rates
set effective_to = date '2026-03-31'
where country_code = 'JPN'
  and source_version like 'customs-country-tariff-20251231:%'
  and effective_to is null;

update public.export_destination_tariff_rates
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version = 'china-import-export-tariff-2026';

update public.export_destination_data_sources
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version = 'destination-source-registry-20260523';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'china-import-internal-tax-2026%';

update public.export_destination_customs_codes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'china-customs-declaration-codes-2026%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and (
    source_version = 'china-cosmetics-import-requirements-2026'
    or source_version = 'china-cites-import-requirements-2026'
    or source_version like 'china-processed-food-import-requirements-2026%'
    or source_version = 'china-electrical-ccc-import-requirements-2026'
    or source_version like 'china-pharma-medical-import-requirements-2026%'
    or source_version like 'china-chemical-import-requirements-2026%'
    or source_version = 'china-textile-apparel-import-requirements-2026'
    or source_version = 'china-additional-industrial-import-requirements-2026'
  );

update public.export_destination_tariff_rates
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version = 'hmrc-trade-tariff-api-20260523';

update public.export_destination_tariff_rates
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version = 'japan-customs-tariff-20260401';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'japan-import-data-20260401%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'japan-import-data-20260401%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'eu-import-data-20260523%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'eu-import-data-20260523%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'australia-import-data-20260523%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'australia-import-data-20260523%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'canada-import-data-20260523%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'canada-import-data-20260523%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'india-import-data-20260523%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'india-import-data-20260523%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'vietnam-import-data-20260523%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'vietnam-import-data-20260523%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'thailand-import-data-20260523%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'thailand-import-data-20260523%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'indonesia-import-data-20260523%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'indonesia-import-data-20260523%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'mexico-import-data-20260523%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'mexico-import-data-20260523%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'bangladesh-import-data-20260523%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'bangladesh-import-data-20260523%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'laos-import-data-20260523%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'laos-import-data-20260523%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'malaysia-import-data-20260523%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'malaysia-import-data-20260523%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'philippines-import-data-20260523%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'philippines-import-data-20260523%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'singapore-import-data-20260523%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'singapore-import-data-20260523%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'cambodia-import-data-20260523%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'cambodia-import-data-20260523%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'myanmar-import-data-20260523%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'myanmar-import-data-20260523%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'brunei-import-data-20260523%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'brunei-import-data-20260523%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'new-zealand-import-data-20260523%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'new-zealand-import-data-20260523%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'taiwan-import-data-20260523%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'taiwan-import-data-20260523%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'turkey-import-data-20260524%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'turkey-import-data-20260524%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'saudi-import-data-20260524%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'saudi-import-data-20260524%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'uae-import-data-20260524%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'uae-import-data-20260524%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'switzerland-import-data-20260524%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'switzerland-import-data-20260524%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'norway-import-data-20260524%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'norway-import-data-20260524%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'iceland-import-data-20260524%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'iceland-import-data-20260524%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'chile-import-data-20260524%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'chile-import-data-20260524%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'colombia-import-data-20260524%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'colombia-import-data-20260524%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'costa-rica-import-data-20260524%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'costa-rica-import-data-20260524%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'panama-import-data-20260524%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'panama-import-data-20260524%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'honduras-import-data-20260524%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'honduras-import-data-20260524%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'nicaragua-import-data-20260524%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'nicaragua-import-data-20260524%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'el-salvador-import-data-20260524%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'el-salvador-import-data-20260524%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'brazil-import-data-20260524%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'brazil-import-data-20260524%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'israel-import-data-20260524%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'israel-import-data-20260524%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'uzbekistan-import-data-20260524%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'uzbekistan-import-data-20260524%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'peru-import-data-20260524%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'peru-import-data-20260524%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'south-africa-import-data-20260524%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'south-africa-import-data-20260524%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'mongolia-import-data-20260524%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'mongolia-import-data-20260524%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'russia-import-data-20260524%';

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'russia-import-data-20260524%';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'hmrc-trade-tariff-api-20260523%';

update public.export_destination_tariff_rates
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version = 'usitc-hts-2026-rev7-20260523';

update public.export_destination_additional_tariffs
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version = 'usitc-chapter99-additional-tariffs-20260523';

update public.export_destination_internal_taxes
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'us-internal-tax-data-20260524%';

update public.export_destination_trade_remedy_cases
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'us-cbp-adcvd-active-cases-%';

update public.export_destination_tariff_rates
set effective_to = date '2026-04-28'
where country_code = 'USA'
  and source_version like 'customs-country-tariff-20251231:%'
  and effective_to is null;

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version in (
    'us-fda-human-drug-import-requirements-20260523',
    'us-fda-cosmetics-import-requirements-20260523',
    'us-fda-medical-device-import-requirements-20260523',
    'us-fda-radiation-electronic-product-import-requirements-20260523',
    'us-fcc-rf-device-import-requirements-20260523',
    'us-fws-wildlife-cites-import-requirements-20260523',
    'us-cpsc-consumer-product-import-requirements-20260523'
  );

update public.export_destination_import_requirements
set status = 'published'::public.legal_record_status,
    published_at = coalesce(published_at, now())
where status in ('staged'::public.legal_record_status, 'reviewed'::public.legal_record_status)
  and source_version like 'hmrc-trade-tariff-api-20260523%';

do $$
begin
  if exists (
    select 1
    from pg_matviews
    where schemaname = 'public'
      and matviewname = 'export_destination_country_coverage'
  ) then
    refresh materialized view public.export_destination_country_coverage;
  end if;
end $$;

select 'hs_master' as target_table, source_version, status, count(*) as row_count
from public.hs_master
where source_version = 'customs-hs-20260101'
group by source_version, status
union all
select 'standard_product_names', source_version, status, count(*)
from public.standard_product_names
where source_version = 'customs-standard-product-20260101'
group by source_version, status
union all
select 'tariff_rates', source_version, status, count(*)
from public.tariff_rates
where source_version = 'myc-openapi-api030-v1.0'
group by source_version, status
union all
select 'customs_confirmation_requirements', source_version, status, count(*)
from public.customs_confirmation_requirements
where source_version = 'myc-openapi-api029-v1.0'
group by source_version, status
union all
select 'export_destination_tariff_rates', source_version, status, count(*)
from public.export_destination_tariff_rates
where source_version like 'customs-country-tariff-20251231:%'
   or source_version = 'china-import-export-tariff-2026'
   or source_version = 'hmrc-trade-tariff-api-20260523'
   or source_version = 'japan-customs-tariff-20260401'
   or source_version = 'usitc-hts-2026-rev7-20260523'
group by source_version, status
union all
select 'export_destination_additional_tariffs', source_version, status, count(*)
from public.export_destination_additional_tariffs
where source_version = 'usitc-chapter99-additional-tariffs-20260523'
group by source_version, status
union all
select 'export_destination_trade_remedy_cases', source_version, status, count(*)
from public.export_destination_trade_remedy_cases
where source_version like 'us-cbp-adcvd-active-cases-%'
group by source_version, status
union all
select 'export_destination_data_sources', source_version, status, count(*)
from public.export_destination_data_sources
where source_version = 'destination-source-registry-20260523'
group by source_version, status
union all
select 'export_destination_internal_taxes', source_version, status, count(*)
from public.export_destination_internal_taxes
where source_version like 'china-import-internal-tax-2026%'
   or source_version like 'japan-import-data-20260401%'
   or source_version like 'eu-import-data-20260523%'
   or source_version like 'australia-import-data-20260523%'
   or source_version like 'canada-import-data-20260523%'
   or source_version like 'india-import-data-20260523%'
   or source_version like 'vietnam-import-data-20260523%'
   or source_version like 'thailand-import-data-20260523%'
   or source_version like 'indonesia-import-data-20260523%'
   or source_version like 'mexico-import-data-20260523%'
   or source_version like 'bangladesh-import-data-20260523%'
   or source_version like 'laos-import-data-20260523%'
   or source_version like 'malaysia-import-data-20260523%'
   or source_version like 'philippines-import-data-20260523%'
   or source_version like 'singapore-import-data-20260523%'
   or source_version like 'cambodia-import-data-20260523%'
   or source_version like 'myanmar-import-data-20260523%'
   or source_version like 'brunei-import-data-20260523%'
   or source_version like 'new-zealand-import-data-20260523%'
   or source_version like 'taiwan-import-data-20260523%'
   or source_version like 'turkey-import-data-20260524%'
   or source_version like 'saudi-import-data-20260524%'
   or source_version like 'uae-import-data-20260524%'
   or source_version like 'switzerland-import-data-20260524%'
   or source_version like 'norway-import-data-20260524%'
   or source_version like 'iceland-import-data-20260524%'
   or source_version like 'chile-import-data-20260524%'
   or source_version like 'colombia-import-data-20260524%'
   or source_version like 'costa-rica-import-data-20260524%'
   or source_version like 'panama-import-data-20260524%'
   or source_version like 'honduras-import-data-20260524%'
   or source_version like 'nicaragua-import-data-20260524%'
   or source_version like 'el-salvador-import-data-20260524%'
   or source_version like 'brazil-import-data-20260524%'
   or source_version like 'israel-import-data-20260524%'
   or source_version like 'uzbekistan-import-data-20260524%'
   or source_version like 'peru-import-data-20260524%'
   or source_version like 'south-africa-import-data-20260524%'
   or source_version like 'mongolia-import-data-20260524%'
   or source_version like 'russia-import-data-20260524%'
   or source_version like 'us-internal-tax-data-20260524%'
   or source_version like 'hmrc-trade-tariff-api-20260523%'
group by source_version, status
union all
select 'export_destination_customs_codes', source_version, status, count(*)
from public.export_destination_customs_codes
where source_version like 'china-customs-declaration-codes-2026%'
group by source_version, status
union all
select 'export_destination_import_requirements', source_version, status, count(*)
from public.export_destination_import_requirements
where source_version = 'china-cosmetics-import-requirements-2026'
   or source_version = 'china-cites-import-requirements-2026'
   or source_version like 'china-processed-food-import-requirements-2026%'
   or source_version = 'china-electrical-ccc-import-requirements-2026'
   or source_version like 'china-pharma-medical-import-requirements-2026%'
   or source_version like 'china-chemical-import-requirements-2026%'
   or source_version = 'china-textile-apparel-import-requirements-2026'
   or source_version = 'china-additional-industrial-import-requirements-2026'
   or source_version like 'japan-import-data-20260401%'
   or source_version like 'eu-import-data-20260523%'
   or source_version like 'australia-import-data-20260523%'
   or source_version like 'canada-import-data-20260523%'
   or source_version like 'india-import-data-20260523%'
   or source_version like 'vietnam-import-data-20260523%'
   or source_version like 'thailand-import-data-20260523%'
   or source_version like 'indonesia-import-data-20260523%'
   or source_version like 'mexico-import-data-20260523%'
   or source_version like 'bangladesh-import-data-20260523%'
   or source_version like 'laos-import-data-20260523%'
   or source_version like 'malaysia-import-data-20260523%'
   or source_version like 'philippines-import-data-20260523%'
   or source_version like 'singapore-import-data-20260523%'
   or source_version like 'cambodia-import-data-20260523%'
   or source_version like 'myanmar-import-data-20260523%'
   or source_version like 'brunei-import-data-20260523%'
   or source_version like 'new-zealand-import-data-20260523%'
   or source_version like 'taiwan-import-data-20260523%'
   or source_version like 'turkey-import-data-20260524%'
   or source_version like 'saudi-import-data-20260524%'
   or source_version like 'uae-import-data-20260524%'
   or source_version like 'switzerland-import-data-20260524%'
   or source_version like 'norway-import-data-20260524%'
   or source_version like 'iceland-import-data-20260524%'
   or source_version like 'chile-import-data-20260524%'
   or source_version like 'colombia-import-data-20260524%'
   or source_version like 'costa-rica-import-data-20260524%'
   or source_version like 'panama-import-data-20260524%'
   or source_version like 'honduras-import-data-20260524%'
   or source_version like 'nicaragua-import-data-20260524%'
   or source_version like 'el-salvador-import-data-20260524%'
   or source_version like 'brazil-import-data-20260524%'
   or source_version like 'israel-import-data-20260524%'
   or source_version like 'uzbekistan-import-data-20260524%'
   or source_version like 'peru-import-data-20260524%'
   or source_version like 'south-africa-import-data-20260524%'
   or source_version like 'mongolia-import-data-20260524%'
   or source_version like 'russia-import-data-20260524%'
   or source_version like 'hmrc-trade-tariff-api-20260523%'
   or source_version in (
    'us-fda-human-drug-import-requirements-20260523',
    'us-fda-cosmetics-import-requirements-20260523',
    'us-fda-medical-device-import-requirements-20260523',
    'us-fda-radiation-electronic-product-import-requirements-20260523',
    'us-fcc-rf-device-import-requirements-20260523',
    'us-fws-wildlife-cites-import-requirements-20260523',
    'us-cpsc-consumer-product-import-requirements-20260523'
   )
group by source_version, status
order by target_table, status;
SQL
fi
