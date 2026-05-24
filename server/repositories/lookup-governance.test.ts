import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), "utf8");
}

function expectPublishedEffectiveFilter(source: string, tableName: string) {
  const tableIndex = source.indexOf(`.from("${tableName}")`);
  expect(tableIndex, `${tableName} query was not found`).toBeGreaterThanOrEqual(0);

  const nextTableIndex = source.indexOf(".from(", tableIndex + 1);
  const queryBlock = source.slice(tableIndex, nextTableIndex === -1 ? undefined : nextTableIndex);

  expect(queryBlock, `${tableName} query must filter effective_from by basis date`).toContain(".lte(\"effective_from\"");
  expect(queryBlock, `${tableName} query must include open-ended effective_to logic`).toContain("effective_to.is.null");
  expect(queryBlock, `${tableName} query must filter published records`).toContain(".eq(\"status\", \"published\")");
}

describe("lookup governance guards", () => {
  it("keeps dashboard legal-data counts basis-date scoped", () => {
    const source = read("server/rules/dashboard-metrics.service.ts");

    for (const tableName of ["hs_master", "standard_product_names", "tariff_rates", "customs_statistical_codes"]) {
      expectPublishedEffectiveFilter(source, tableName);
    }
  });

  it("keeps direct import/export lookup repositories basis-date scoped", () => {
    const directLookup = read("server/repositories/hs-master.repository.ts");
    const importDiagnosis = read("server/repositories/import-diagnosis.repository.ts");
    const exportTariff = read("server/repositories/export-destination-tariff.repository.ts");
    const exportImportData = read("server/repositories/export-destination-import-data.repository.ts");

    for (const tableName of ["hs_master", "tariff_rates", "customs_confirmation_requirements", "integrated_public_notice_requirements"]) {
      expectPublishedEffectiveFilter(directLookup, tableName);
    }

    for (const tableName of ["hs_master", "tariff_rates", "fta_agreements", "fta_rates", "fta_psr", "customs_confirmation_requirements", "integrated_public_notice_requirements", "requirement_playbooks"]) {
      expectPublishedEffectiveFilter(importDiagnosis, tableName);
    }

    expectPublishedEffectiveFilter(exportTariff, "export_destination_tariff_rates");
    expectPublishedEffectiveFilter(exportTariff, "export_destination_customs_codes");

    for (const tableName of [
      "export_destination_import_requirements",
      "export_destination_internal_taxes",
      "export_destination_additional_tariffs",
      "export_destination_trade_remedy_cases"
    ]) {
      expectPublishedEffectiveFilter(exportImportData, tableName);
    }
  });

  it("keeps sensitive and legal-data tables under RLS in migrations", () => {
    const migrations = [
      "supabase/migrations/20260521140000_phase_0_1_core_schema.sql",
      "supabase/migrations/20260521150000_document_upload_metadata.sql",
      "supabase/migrations/20260521220000_export_destination_tariff_rates.sql",
      "supabase/migrations/20260523020000_customs_statistical_codes.sql",
      "supabase/migrations/20260523060000_export_destination_import_data.sql",
      "supabase/migrations/20260523070000_export_destination_customs_codes.sql",
      "supabase/migrations/20260523090000_export_destination_additional_tariffs.sql",
      "supabase/migrations/20260523103000_export_destination_trade_remedy_cases.sql",
      "supabase/migrations/20260524040000_background_jobs.sql"
    ].map(read).join("\n");

    for (const tableName of [
      "hs_master",
      "standard_product_names",
      "tariff_rates",
      "customs_confirmation_requirements",
      "integrated_public_notice_requirements",
      "requirement_playbooks",
      "customs_statistical_codes",
      "export_destination_tariff_rates",
      "export_destination_customs_codes",
      "export_destination_import_requirements",
      "export_destination_internal_taxes",
      "export_destination_additional_tariffs",
      "export_destination_trade_remedy_cases",
      "export_destination_data_sources",
      "case_documents",
      "background_jobs"
    ]) {
      expect(migrations, `${tableName} must enable row level security`).toContain(`alter table public.${tableName} enable row level security`);
    }
  });
});
