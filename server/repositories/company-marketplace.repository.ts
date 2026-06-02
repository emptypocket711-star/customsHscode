import type { SupabaseClient } from "@supabase/supabase-js";

export const companyPartyTypesTableName = "company_party_types";

export type SignupBusinessType = "customs_broker" | "foreign_shipper" | "forwarder" | "exporter" | "importer";

export type MarketplacePartyType =
  | "domestic_shipper"
  | "foreign_shipper"
  | "forwarder"
  | "customs_broker"
  | "support_partner";

export type CompanyMarketplaceRoleSyncResult = {
  partyTypes: MarketplacePartyType[];
  skipped: boolean;
};

const signupBusinessTypeToMarketplacePartyType: Partial<Record<SignupBusinessType, MarketplacePartyType>> = {
  exporter: "domestic_shipper",
  foreign_shipper: "foreign_shipper",
  importer: "domestic_shipper"
};

const signupBusinessTypeToMarketplaceRoleIntent: Record<SignupBusinessType, MarketplacePartyType> = {
  customs_broker: "customs_broker",
  exporter: "domestic_shipper",
  foreign_shipper: "foreign_shipper",
  forwarder: "forwarder",
  importer: "domestic_shipper"
};

const validMarketplacePartyTypes = [
  "customs_broker",
  "domestic_shipper",
  "foreign_shipper",
  "forwarder",
  "support_partner"
] satisfies MarketplacePartyType[];

function uniqueSorted<T extends string>(values: T[]) {
  return Array.from(new Set(values)).sort();
}

function isMissingMarketplaceSchemaError(error: { code?: string; message?: string }) {
  const message = error.message ?? "";
  return (
    error.code === "42P01" ||
    (error.code === "PGRST205" &&
      message.includes(companyPartyTypesTableName) &&
      message.toLowerCase().includes("schema cache"))
  );
}

export function mapSignupBusinessTypesToMarketplacePartyTypes(
  businessTypes: readonly string[] | null | undefined
): MarketplacePartyType[] {
  const mapped = (businessTypes ?? [])
    .map((businessType) => signupBusinessTypeToMarketplacePartyType[businessType as SignupBusinessType])
    .filter((partyType): partyType is MarketplacePartyType => Boolean(partyType));

  return uniqueSorted(mapped);
}

export function mapSignupBusinessTypesToMarketplaceRoleIntents(
  businessTypes: readonly string[] | null | undefined
): MarketplacePartyType[] {
  const mapped = (businessTypes ?? [])
    .map((businessType) => signupBusinessTypeToMarketplaceRoleIntent[businessType as SignupBusinessType])
    .filter((partyType): partyType is MarketplacePartyType => Boolean(partyType));

  return uniqueSorted(mapped);
}

export function readMarketplaceRoleIntentsFromUserMetadata(
  metadata: Record<string, unknown> | null | undefined
): MarketplacePartyType[] {
  const rawRole = metadata?.intended_marketplace_role;
  const rawBusinessTypes = metadata?.business_types;
  const roleIntents = [
    ...(typeof rawRole === "string" && (validMarketplacePartyTypes as readonly string[]).includes(rawRole)
      ? [rawRole as MarketplacePartyType]
      : []),
    ...mapSignupBusinessTypesToMarketplaceRoleIntents(Array.isArray(rawBusinessTypes) ? rawBusinessTypes.map(String) : [])
  ];

  return uniqueSorted(roleIntents);
}

export async function listCurrentCompanyMarketplacePartyTypes(
  supabase: SupabaseClient
): Promise<MarketplacePartyType[]> {
  const { data, error } = await supabase
    .from(companyPartyTypesTableName)
    .select("party_type")
    .order("party_type", { ascending: true });

  if (error) {
    if (isMissingMarketplaceSchemaError(error)) return [];
    throw new Error(error.message);
  }

  return uniqueSorted(
    (data ?? [])
      .map((row) => String(row.party_type))
      .filter((partyType): partyType is MarketplacePartyType =>
        (validMarketplacePartyTypes as readonly string[]).includes(partyType)
      )
  );
}

export async function syncCompanyMarketplacePartyTypes(
  supabase: SupabaseClient,
  input: {
    businessTypes: readonly string[] | null | undefined;
    companyId: string | null | undefined;
    createdBy: string | null | undefined;
  }
): Promise<CompanyMarketplaceRoleSyncResult> {
  if (!input.companyId || !input.createdBy) {
    return { partyTypes: [], skipped: true };
  }

  const partyTypes = mapSignupBusinessTypesToMarketplacePartyTypes(input.businessTypes);
  if (partyTypes.length === 0) {
    return { partyTypes, skipped: false };
  }

  const rows = partyTypes.map((partyType) => ({
    company_id: input.companyId,
    created_by: input.createdBy,
    party_type: partyType
  }));

  const { error } = await supabase
    .from(companyPartyTypesTableName)
    .upsert(rows, { onConflict: "company_id,party_type" });

  if (error) {
    if (isMissingMarketplaceSchemaError(error)) {
      return { partyTypes, skipped: true };
    }
    throw new Error(error.message);
  }

  return { partyTypes, skipped: false };
}
