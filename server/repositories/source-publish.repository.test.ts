import { describe, expect, it } from "vitest";
import {
  publishLegalSourceVersionRpcName,
  shouldMatchSourceVersionPrefix
} from "@/server/repositories/source-publish.repository";

describe("source publish repository helpers", () => {
  it("uses the staff-only publish rpc", () => {
    expect(publishLegalSourceVersionRpcName).toBe("publish_legal_source_version");
  });

  it("detects prefix publish requests", () => {
    expect(shouldMatchSourceVersionPrefix({
      targetTable: "export_destination_tariff_rates",
      sourceVersion: "customs-country-tariff-20251231:",
      matchPrefix: "on"
    })).toBe(true);
  });

  it("does not require prefix publishing for API029 requirement rows", () => {
    expect(shouldMatchSourceVersionPrefix({
      targetTable: "customs_confirmation_requirements",
      sourceVersion: "myc-openapi-api029-v1.0",
      matchPrefix: undefined
    })).toBe(false);
  });

  it("accepts internal tax law rule publish requests", () => {
    expect(shouldMatchSourceVersionPrefix({
      targetTable: "internal_tax_law_rules",
      sourceVersion: "internal-tax-law-rules-20260524",
      matchPrefix: ""
    })).toBe(false);
  });
});
