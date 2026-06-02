import { describe, expect, it } from "vitest";
import {
  companyPartyTypesTableName,
  mapSignupBusinessTypesToMarketplaceRoleIntents,
  mapSignupBusinessTypesToMarketplacePartyTypes,
  readMarketplaceRoleIntentsFromUserMetadata,
  syncCompanyMarketplacePartyTypes
} from "@/server/repositories/company-marketplace.repository";

describe("company marketplace repository", () => {
  it("maps signup business types to company marketplace party types", () => {
    expect(
      mapSignupBusinessTypesToMarketplacePartyTypes([
        "importer",
        "exporter",
        "foreign_shipper",
        "forwarder",
        "customs_broker",
        "unknown"
      ])
    ).toEqual(["domestic_shipper", "foreign_shipper"]);
  });

  it("skips sync safely before the marketplace schema is applied", async () => {
    const fakeSupabase = {
      from(tableName: string) {
        expect(tableName).toBe(companyPartyTypesTableName);
        return {
          upsert() {
            return Promise.resolve({
              data: null,
              error: {
                code: "42P01",
                message: 'relation "company_party_types" does not exist'
              }
            });
          }
        };
      }
    };

    await expect(
      syncCompanyMarketplacePartyTypes(fakeSupabase as never, {
        businessTypes: ["importer", "forwarder"],
        companyId: "00000000-0000-0000-0000-000000000001",
        createdBy: "00000000-0000-0000-0000-000000000002"
      })
    ).resolves.toEqual({
      partyTypes: ["domestic_shipper"],
      skipped: true
    });
  });

  it("does not auto-grant high-impact partner roles from signup claims", async () => {
    const fakeSupabase = {
      from(tableName: string) {
        expect(tableName).toBe(companyPartyTypesTableName);
        return {
          upsert() {
            return Promise.resolve({
              data: null,
              error: {
                code: "42501",
                message: 'new row violates row-level security policy for table "company_party_types"'
              }
            });
          }
        };
      }
    };

    await expect(
      syncCompanyMarketplacePartyTypes(fakeSupabase as never, {
        businessTypes: ["forwarder"],
        companyId: "00000000-0000-0000-0000-000000000001",
        createdBy: "00000000-0000-0000-0000-000000000002"
      })
    ).resolves.toEqual({
      partyTypes: [],
      skipped: false
    });
  });

  it("keeps high-impact signup roles as display-only role intents", () => {
    expect(
      mapSignupBusinessTypesToMarketplaceRoleIntents([
        "importer",
        "forwarder",
        "customs_broker",
        "unknown"
      ])
    ).toEqual(["customs_broker", "domestic_shipper", "forwarder"]);
  });

  it("reads display-only marketplace role intents from auth metadata", () => {
    expect(
      readMarketplaceRoleIntentsFromUserMetadata({
        business_types: ["foreign_shipper", "forwarder"],
        intended_marketplace_role: "customs_broker"
      })
    ).toEqual(["customs_broker", "foreign_shipper", "forwarder"]);

    expect(
      readMarketplaceRoleIntentsFromUserMetadata({
        intended_marketplace_role: "invalid"
      })
    ).toEqual([]);
  });

  it("skips schema-cache misses from PostgREST before migration is applied", async () => {
    const fakeSupabase = {
      from(tableName: string) {
        expect(tableName).toBe(companyPartyTypesTableName);
        return {
          upsert() {
            return Promise.resolve({
              data: null,
              error: {
                code: "PGRST205",
                message: "Could not find the table 'public.company_party_types' in the schema cache"
              }
            });
          }
        };
      }
    };

    await expect(
      syncCompanyMarketplacePartyTypes(fakeSupabase as never, {
        businessTypes: ["forwarder"],
        companyId: "00000000-0000-0000-0000-000000000001",
        createdBy: "00000000-0000-0000-0000-000000000002"
      })
    ).resolves.toEqual({
      partyTypes: [],
      skipped: false
    });
  });

  it("upserts mapped marketplace party types when schema exists", async () => {
    const calls: unknown[] = [];
    const fakeSupabase = {
      from(tableName: string) {
        expect(tableName).toBe(companyPartyTypesTableName);
        return {
          upsert(rows: unknown[], options: unknown) {
            calls.push({ options, rows });
            return Promise.resolve({ data: null, error: null });
          }
        };
      }
    };

    await expect(
      syncCompanyMarketplacePartyTypes(fakeSupabase as never, {
        businessTypes: ["importer", "customs_broker", "foreign_shipper"],
        companyId: "00000000-0000-0000-0000-000000000001",
        createdBy: "00000000-0000-0000-0000-000000000002"
      })
    ).resolves.toEqual({
      partyTypes: ["domestic_shipper", "foreign_shipper"],
      skipped: false
    });

    expect(calls).toEqual([
      {
        options: { onConflict: "company_id,party_type" },
        rows: [
          {
            company_id: "00000000-0000-0000-0000-000000000001",
            created_by: "00000000-0000-0000-0000-000000000002",
            party_type: "domestic_shipper"
          },
          {
            company_id: "00000000-0000-0000-0000-000000000001",
            created_by: "00000000-0000-0000-0000-000000000002",
            party_type: "foreign_shipper"
          }
        ]
      }
    ]);
  });
});
