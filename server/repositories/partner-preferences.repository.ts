import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  PartnerPreferenceInput,
  PartnerServiceType
} from "@/features/partner-preferences/schemas";

export type PartnerPreferenceItem = {
  id: string | null;
  serviceType: PartnerServiceType;
  directions: string[];
  originCountryCodes: string[];
  destinationCountryCodes: string[];
  transportModes: string[];
  cargoTags: string[];
  ports: string[];
  urgentAvailable: boolean;
  notificationEnabled: boolean;
  digestEnabled: boolean;
  updatedAt: string | null;
};

export type PartnerPreferencesDashboard = {
  companyId: string;
  companyRole: string;
  partyTypes: string[];
  schemaReady: boolean;
  preferences: PartnerPreferenceItem[];
};

type PreferenceRow = {
  id: string;
  service_type: PartnerServiceType;
  directions: string[] | null;
  origin_country_codes: string[] | null;
  destination_country_codes: string[] | null;
  transport_modes: string[] | null;
  cargo_tags: string[] | null;
  ports: string[] | null;
  urgent_available: boolean | null;
  notification_enabled: boolean | null;
  digest_enabled: boolean | null;
  updated_at: string | null;
};

function isMissingMarketplaceSchemaError(error: { code?: string; message?: string }) {
  const message = error.message ?? "";
  return (
    error.code === "42703" ||
    error.code === "42P01" ||
    (error.code === "PGRST205" && message.toLowerCase().includes("schema cache"))
  );
}

function emptyPreference(serviceType: PartnerServiceType): PartnerPreferenceItem {
  return {
    cargoTags: [],
    destinationCountryCodes: [],
    digestEnabled: false,
    directions: [],
    id: null,
    notificationEnabled: true,
    originCountryCodes: [],
    ports: [],
    serviceType,
    transportModes: [],
    updatedAt: null,
    urgentAvailable: false
  };
}

function mapPreference(row: PreferenceRow): PartnerPreferenceItem {
  return {
    cargoTags: row.cargo_tags ?? [],
    destinationCountryCodes: row.destination_country_codes ?? [],
    digestEnabled: Boolean(row.digest_enabled),
    directions: row.directions ?? [],
    id: row.id,
    notificationEnabled: row.notification_enabled !== false,
    originCountryCodes: row.origin_country_codes ?? [],
    ports: row.ports ?? [],
    serviceType: row.service_type,
    transportModes: row.transport_modes ?? [],
    updatedAt: row.updated_at,
    urgentAvailable: Boolean(row.urgent_available)
  };
}

function allowedServiceTypesForPartyTypes(partyTypes: string[]): PartnerServiceType[] {
  const allowed = new Set<PartnerServiceType>();
  if (partyTypes.includes("forwarder")) allowed.add("freight");
  if (partyTypes.includes("customs_broker")) allowed.add("clearance");
  return Array.from(allowed);
}

export async function getPartnerPreferencesDashboard(
  supabase: SupabaseClient
): Promise<PartnerPreferencesDashboard> {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("로그인 후 파트너 관심 조건을 확인할 수 있습니다.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id,company_role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.company_id) {
    throw new Error("회사 프로필을 확인할 수 없습니다.");
  }

  const base = {
    companyId: String(profile.company_id),
    companyRole: String(profile.company_role ?? "member"),
    partyTypes: [],
    preferences: [],
    schemaReady: false
  } satisfies PartnerPreferencesDashboard;

  const { data: partyTypes, error: partyTypeError } = await supabase
    .from("company_party_types")
    .select("party_type")
    .eq("company_id", profile.company_id);

  if (partyTypeError) {
    if (isMissingMarketplaceSchemaError(partyTypeError)) return base;
    throw new Error(partyTypeError.message);
  }

  const normalizedPartyTypes = (partyTypes ?? []).map((row) => String(row.party_type));
  const allowedServiceTypes = allowedServiceTypesForPartyTypes(normalizedPartyTypes);

  const { data: preferences, error: preferencesError } = await supabase
    .from("partner_service_preferences")
    .select(
      "id,service_type,directions,origin_country_codes,destination_country_codes,transport_modes,cargo_tags,ports,urgent_available,notification_enabled,digest_enabled,updated_at"
    )
    .eq("company_id", profile.company_id);

  if (preferencesError) {
    if (isMissingMarketplaceSchemaError(preferencesError)) return { ...base, partyTypes: normalizedPartyTypes };
    throw new Error(preferencesError.message);
  }

  const preferenceByType = new Map(
    ((preferences ?? []) as PreferenceRow[]).map((preference) => [preference.service_type, mapPreference(preference)])
  );

  return {
    ...base,
    partyTypes: normalizedPartyTypes,
    preferences: allowedServiceTypes.map((serviceType) => preferenceByType.get(serviceType) ?? emptyPreference(serviceType)),
    schemaReady: true
  };
}

export async function upsertPartnerServicePreference(
  supabase: SupabaseClient,
  input: PartnerPreferenceInput
) {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("로그인 후 파트너 관심 조건을 저장할 수 있습니다.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id,company_role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.company_id) {
    throw new Error("회사 프로필을 확인할 수 없습니다.");
  }

  if (profile.company_role !== "admin") {
    throw new Error("회사 관리자만 파트너 관심 조건을 저장할 수 있습니다.");
  }

  const { data: partyTypes, error: partyTypeError } = await supabase
    .from("company_party_types")
    .select("party_type")
    .eq("company_id", profile.company_id);

  if (partyTypeError) throw new Error(partyTypeError.message);

  const normalizedPartyTypes = (partyTypes ?? []).map((row) => String(row.party_type));
  const allowedServiceTypes = allowedServiceTypesForPartyTypes(normalizedPartyTypes);
  if (!allowedServiceTypes.includes(input.serviceType)) {
    throw new Error("해당 회사 역할로는 이 서비스 관심 조건을 저장할 수 없습니다.");
  }

  const { data, error } = await supabase
    .from("partner_service_preferences")
    .upsert({
      cargo_tags: input.cargoTags,
      company_id: profile.company_id,
      destination_country_codes: input.destinationCountryCodes,
      digest_enabled: input.digestEnabled,
      directions: input.directions,
      notification_enabled: input.notificationEnabled,
      origin_country_codes: input.originCountryCodes,
      ports: input.ports,
      service_type: input.serviceType,
      transport_modes: input.transportModes,
      urgent_available: input.urgentAvailable,
      updated_at: new Date().toISOString()
    }, {
      onConflict: "company_id,service_type"
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return {
    companyId: String(profile.company_id),
    preferenceId: String(data.id),
    serviceType: input.serviceType
  };
}
