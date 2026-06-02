#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import {
  envValue,
  isLocalUrl,
  loadEnvFile,
  safeOrigin
} from "./completion_preview_e2e_env.mjs";
import {
  marketplaceTransactionEnvExports,
  marketplaceTransactionMutationEnvExports,
  marketplaceTransactionFixture as fixture
} from "../tests/fixtures/marketplace-transaction.fixture.mjs";

function assert(condition, message) {
  if (condition) return;
  throw new Error(message);
}

const seededAt = "2026-06-01T00:00:00.000Z";
const validUntil = "2026-06-30";

async function upsertOrThrow(client, table, rows, options) {
  const { error } = await client.from(table).upsert(rows, options);
  if (error) throw new Error(`${table} upsert failed: ${error.message}`);
}

async function deleteByIds(client, table, ids) {
  const { error } = await client.from(table).delete().in("id", ids);
  if (error) throw new Error(`${table} cleanup failed: ${error.message}`);
}

async function assertMarketplaceSchemaReady(client) {
  const checks = [
    client.from("companies").select("id, contact_email, verification_status, trust_score").limit(1),
    client.from("company_party_types").select("company_id, party_type").limit(1),
    client.from("partner_service_preferences").select("company_id, service_type").limit(1),
    client.from("service_requests").select("id, request_type, status").limit(1),
    client.from("service_bids").select("id, request_id, bid_type").limit(1)
  ];
  const results = await Promise.all(checks);
  const failed = results.find((result) => result.error);

  if (failed?.error) {
    throw new Error(
      `marketplace local schema가 준비되지 않았습니다. local Supabase에 platform marketplace migration을 적용한 뒤 다시 실행하세요. detail=${failed.error.message}`
    );
  }
}

async function findUserByEmail(client, email) {
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`auth user list failed: ${error.message}`);

    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function ensureUser(client, role, user, company, testPassword) {
  const metadata = {
    company_name: company.name,
    full_name: `marketplace transaction ${role}`
  };

  const existing = await findUserByEmail(client, user.email);
  if (existing) {
    const { data, error } = await client.auth.admin.updateUserById(existing.id, {
      email_confirm: true,
      password: testPassword,
      user_metadata: metadata
    });
    if (error) throw new Error(`auth user update failed for ${user.email}: ${error.message}`);
    return data.user;
  }

  const { data, error } = await client.auth.admin.createUser({
    email: user.email,
    email_confirm: true,
    password: testPassword,
    user_metadata: metadata
  });

  if (error) throw new Error(`auth user create failed for ${user.email}: ${error.message}`);
  return data.user;
}

async function seedCompanies(client) {
  await upsertOrThrow(client, "companies", Object.entries(fixture.companies).map(([role, company]) => ({
    contact_email: fixture.users[role].email,
    country_code: "KR",
    id: company.id,
    name: company.name,
    trust_score: company.partyType === "domestic_shipper" ? 45 : 60,
    type: "client",
    verification_status: company.partyType === "domestic_shipper" ? "email_verified" : "operator_approved",
    verified_at: company.partyType === "domestic_shipper" ? null : seededAt
  })), { onConflict: "id" });
}

async function seedUsersAndProfiles(client, testPassword) {
  const authUsers = new Map();

  for (const [role, user] of Object.entries(fixture.users)) {
    const company = fixture.companies[role];
    authUsers.set(role, await ensureUser(client, role, user, company, testPassword));
  }

  await upsertOrThrow(client, "profiles", Object.entries(fixture.users).map(([role, user]) => ({
    company_id: fixture.companies[role].id,
    company_role: "admin",
    email: user.email,
    full_name: `marketplace transaction ${role}`,
    id: authUsers.get(role).id,
    onboarding_completed_at: seededAt,
    preferred_locale: "ko",
    role: "client"
  })), { onConflict: "id" });

  return authUsers;
}

async function seedMarketplaceRoles(client, authUsers) {
  await upsertOrThrow(client, "company_party_types", Object.entries(fixture.companies).map(([role, company]) => ({
    company_id: company.id,
    created_by: authUsers.get(role).id,
    is_primary: true,
    party_type: company.partyType
  })), { onConflict: "company_id,party_type" });

  await upsertOrThrow(client, "partner_service_preferences", [
    {
      cargo_tags: ["general"],
      company_id: fixture.companies.forwarder.id,
      destination_country_codes: ["KR", "CN", "US"],
      digest_enabled: false,
      directions: ["import", "export"],
      notification_enabled: true,
      origin_country_codes: ["KR", "CN", "US"],
      ports: ["KRPUS", "CNSHA"],
      service_type: "freight",
      transport_modes: ["sea", "air"],
      urgent_available: true
    },
    {
      cargo_tags: ["general", "plastic"],
      company_id: fixture.companies.broker.id,
      destination_country_codes: ["KR"],
      digest_enabled: false,
      directions: ["import", "export"],
      notification_enabled: true,
      origin_country_codes: ["CN", "US", "EU"],
      ports: ["KRPUS", "KRINC"],
      service_type: "clearance",
      transport_modes: [],
      urgent_available: true
    }
  ], { onConflict: "company_id,service_type" });
}

async function cleanupTransactionFixture(client) {
  await deleteByIds(client, "service_requests", [
    fixture.requests.freight.id,
    fixture.requests.clearance.id,
    fixture.mutation.requests.freight.id,
    fixture.mutation.requests.clearance.id
  ]);
}

async function seedServiceRequests(client, authUsers) {
  const requesterUserId = authUsers.get("requester").id;

  await upsertOrThrow(client, "service_requests", [
    {
      created_at: seededAt,
      created_by: requesterUserId,
      deadline_at: "2026-06-30T00:00:00.000Z",
      destination_country_code: "KR",
      direction: "import",
      export_country_code: "CN",
      id: fixture.requests.freight.id,
      incoterms: "FOB",
      internal_note: "E2E synthetic fixture only",
      missing_information: [],
      origin_country_code: "CN",
      preferred_arrival_date: "2026-07-10",
      preferred_start_date: "2026-06-20",
      product_summary: "E2E 합성 운송 품목",
      published_at: seededAt,
      requester_company_id: fixture.companies.requester.id,
      request_type: "freight",
      shipment_country_code: "CN",
      source_lookup_snapshot: {
        generatedAt: seededAt,
        legalCertainty: false,
        source: "e2e synthetic fixture"
      },
      status: "bids_received",
      title: fixture.requests.freight.title,
      updated_at: seededAt,
      visibility: "matched_partners"
    },
    {
      created_at: seededAt,
      created_by: requesterUserId,
      deadline_at: "2026-06-30T00:00:00.000Z",
      destination_country_code: "KR",
      direction: "import",
      export_country_code: "CN",
      hs6: fixture.requests.clearance.hskCode.slice(0, 6),
      hsk_code: fixture.requests.clearance.hskCode,
      id: fixture.requests.clearance.id,
      incoterms: "FOB",
      internal_note: "E2E synthetic fixture only",
      missing_information: [],
      origin_country_code: "CN",
      preferred_arrival_date: "2026-07-10",
      preferred_start_date: "2026-06-20",
      product_summary: "E2E 합성 통관 품목",
      published_at: seededAt,
      requester_company_id: fixture.companies.requester.id,
      request_type: "clearance",
      shipment_country_code: "CN",
      source_lookup_snapshot: {
        generatedAt: seededAt,
        legalCertainty: false,
        source: "e2e synthetic fixture"
      },
      status: "bids_received",
      title: fixture.requests.clearance.title,
      updated_at: seededAt,
      visibility: "matched_partners"
    }
  ], { onConflict: "id" });

  await upsertOrThrow(client, "freight_request_details", [
    {
      cbm: 8.5,
      container_type: "20GP",
      destination_place: "Busan warehouse",
      destination_port: "KRPUS",
      gross_weight: 1200,
      hazardous: false,
      load_type: "fcl",
      origin_place: "Shanghai factory",
      origin_port: "CNSHA",
      package_count: 10,
      package_unit: "CT",
      request_id: fixture.requests.freight.id,
      temperature_controlled: false,
      transport_mode: "sea",
      used_car: false,
      vehicle_vin: null,
      weight_unit: "KG"
    }
  ], { onConflict: "request_id" });

  await upsertOrThrow(client, "clearance_request_details", [
    {
      estimated_declaration_count: 1,
      fta_preference_requested: false,
      hs_code_known: true,
      model_name: "E2E-MODEL",
      product_material: "synthetic plastic",
      product_usage: "E2E verification only",
      request_id: fixture.requests.clearance.id,
      required_review_points: ["예비 fixture"],
      requirements_check_needed: true,
      urgent: false
    }
  ], { onConflict: "request_id" });
}

async function seedPartnerMatches(client) {
  await upsertOrThrow(client, "service_request_partner_matches", [
    {
      interest_status: "interested",
      match_reason: {
        country: "CN-KR",
        source: "e2e synthetic fixture",
        transportMode: "sea"
      },
      matched_by: "preference",
      notification_status: "sent",
      notified_at: seededAt,
      partner_company_id: fixture.companies.forwarder.id,
      request_id: fixture.requests.freight.id
    },
    {
      interest_status: "interested",
      match_reason: {
        hskCode: fixture.requests.clearance.hskCode,
        source: "e2e synthetic fixture"
      },
      matched_by: "preference",
      notification_status: "sent",
      notified_at: seededAt,
      partner_company_id: fixture.companies.broker.id,
      request_id: fixture.requests.clearance.id
    }
  ], { onConflict: "request_id,partner_company_id" });
}

async function seedMutationRequests(client, authUsers) {
  const requesterUserId = authUsers.get("requester").id;

  await upsertOrThrow(client, "service_requests", [
    {
      created_at: seededAt,
      created_by: requesterUserId,
      deadline_at: "2026-06-30T00:00:00.000Z",
      destination_country_code: "KR",
      direction: "import",
      export_country_code: "CN",
      id: fixture.mutation.requests.freight.id,
      incoterms: "FOB",
      internal_note: "E2E mutation fixture only",
      missing_information: [],
      origin_country_code: "CN",
      preferred_arrival_date: "2026-07-10",
      preferred_start_date: "2026-06-20",
      product_summary: "E2E mutation 운송 품목",
      published_at: seededAt,
      requester_company_id: fixture.companies.requester.id,
      request_type: "freight",
      shipment_country_code: "CN",
      source_lookup_snapshot: {
        generatedAt: seededAt,
        legalCertainty: false,
        source: "e2e mutation fixture"
      },
      status: "open",
      title: fixture.mutation.requests.freight.title,
      updated_at: seededAt,
      visibility: "matched_partners"
    },
    {
      created_at: seededAt,
      created_by: requesterUserId,
      deadline_at: "2026-06-30T00:00:00.000Z",
      destination_country_code: "KR",
      direction: "import",
      export_country_code: "CN",
      hs6: fixture.mutation.requests.clearance.hskCode.slice(0, 6),
      hsk_code: fixture.mutation.requests.clearance.hskCode,
      id: fixture.mutation.requests.clearance.id,
      incoterms: "FOB",
      internal_note: "E2E mutation fixture only",
      missing_information: [],
      origin_country_code: "CN",
      preferred_arrival_date: "2026-07-10",
      preferred_start_date: "2026-06-20",
      product_summary: "E2E mutation 통관 품목",
      published_at: seededAt,
      requester_company_id: fixture.companies.requester.id,
      request_type: "clearance",
      shipment_country_code: "CN",
      source_lookup_snapshot: {
        generatedAt: seededAt,
        legalCertainty: false,
        source: "e2e mutation fixture"
      },
      status: "open",
      title: fixture.mutation.requests.clearance.title,
      updated_at: seededAt,
      visibility: "matched_partners"
    }
  ], { onConflict: "id" });

  await upsertOrThrow(client, "freight_request_details", [
    {
      cbm: 9.25,
      container_type: "20GP",
      destination_place: "Busan mutation warehouse",
      destination_port: "KRPUS",
      gross_weight: 1350,
      hazardous: false,
      load_type: "fcl",
      origin_place: "Shanghai mutation factory",
      origin_port: "CNSHA",
      package_count: 12,
      package_unit: "CT",
      request_id: fixture.mutation.requests.freight.id,
      temperature_controlled: false,
      transport_mode: "sea",
      used_car: false,
      vehicle_vin: null,
      weight_unit: "KG"
    }
  ], { onConflict: "request_id" });

  await upsertOrThrow(client, "clearance_request_details", [
    {
      estimated_declaration_count: 1,
      fta_preference_requested: false,
      hs_code_known: true,
      model_name: "E2E-MUTATION-MODEL",
      product_material: "synthetic plastic",
      product_usage: "E2E mutation verification only",
      request_id: fixture.mutation.requests.clearance.id,
      required_review_points: ["예비 mutation fixture"],
      requirements_check_needed: true,
      urgent: false
    }
  ], { onConflict: "request_id" });

  await upsertOrThrow(client, "service_request_partner_matches", [
    {
      interest_status: "interested",
      match_reason: {
        country: "CN-KR",
        source: "e2e mutation fixture",
        transportMode: "sea"
      },
      matched_by: "preference",
      notification_status: "sent",
      notified_at: seededAt,
      partner_company_id: fixture.companies.forwarder.id,
      request_id: fixture.mutation.requests.freight.id
    },
    {
      interest_status: "interested",
      match_reason: {
        hskCode: fixture.mutation.requests.clearance.hskCode,
        source: "e2e mutation fixture"
      },
      matched_by: "preference",
      notification_status: "sent",
      notified_at: seededAt,
      partner_company_id: fixture.companies.broker.id,
      request_id: fixture.mutation.requests.clearance.id
    }
  ], { onConflict: "request_id,partner_company_id" });
}

async function seedBids(client, authUsers) {
  await upsertOrThrow(client, "service_bids", [
    {
      bid_type: "freight",
      bidder_company_id: fixture.companies.forwarder.id,
      created_at: seededAt,
      created_by: authUsers.get("forwarder").id,
      currency: "KRW",
      excluded_costs: [],
      id: fixture.bids.freight.id,
      included_costs: ["해상운임", "국내 로컬비용", "부대비용"],
      lead_time_days: 7,
      message: null,
      request_id: fixture.requests.freight.id,
      status: "submitted",
      submitted_at: seededAt,
      total_amount: fixture.bids.freight.totalAmount,
      updated_at: seededAt,
      valid_until: validUntil
    },
    {
      bid_type: "clearance",
      bidder_company_id: fixture.companies.broker.id,
      created_at: seededAt,
      created_by: authUsers.get("broker").id,
      currency: "KRW",
      excluded_costs: [],
      id: fixture.bids.clearance.id,
      included_costs: ["수입신고 대행", "HS 예비검토", "요건 확인"],
      lead_time_days: 3,
      message: null,
      request_id: fixture.requests.clearance.id,
      status: "submitted",
      submitted_at: seededAt,
      total_amount: fixture.bids.clearance.totalAmount,
      updated_at: seededAt,
      valid_until: validUntil
    }
  ], { onConflict: "id" });

  await upsertOrThrow(client, "freight_bid_details", [
    {
      bid_id: fixture.bids.freight.id,
      carrier_note: "E2E synthetic carrier note",
      free_time_note: "E2E synthetic free time",
      freight_rate_amount: 900000,
      local_charge_amount: 250000,
      surcharge_amount: 100000,
      transit_time_days: 7
    }
  ], { onConflict: "bid_id" });

  await upsertOrThrow(client, "clearance_bid_details", [
    {
      additional_documents_required: ["E2E synthetic catalog"],
      bid_id: fixture.bids.clearance.id,
      brokerage_fee_amount: 300000,
      expected_clearance_days: 3,
      review_available: true,
      risk_note: "E2E preliminary fixture"
    }
  ], { onConflict: "bid_id" });
}

async function main() {
  const localEnv = await loadEnvFile();
  const supabaseUrl = envValue(localEnv, "SUPABASE_URL") || envValue(localEnv, "NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = envValue(localEnv, "SUPABASE_SERVICE_ROLE_KEY");
  const testPassword = envValue(localEnv, "E2E_TEST_PASSWORD");

  console.log("Marketplace transaction fixture seed");
  console.log(`supabaseOrigin=${safeOrigin(supabaseUrl) || "missing"}`);
  console.log("secretValues=not-printed");

  assert(isLocalUrl(supabaseUrl), `local Supabase에서만 seed를 실행할 수 있습니다. current=${safeOrigin(supabaseUrl)}`);
  assert(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY가 필요합니다.");
  assert(testPassword, "E2E_TEST_PASSWORD가 필요합니다.");

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  await assertMarketplaceSchemaReady(client);
  await seedCompanies(client);
  const authUsers = await seedUsersAndProfiles(client, testPassword);
  await seedMarketplaceRoles(client, authUsers);
  await cleanupTransactionFixture(client);
  await seedServiceRequests(client, authUsers);
  await seedPartnerMatches(client);
  await seedBids(client, authUsers);
  await seedMutationRequests(client, authUsers);

  console.log("envExports=");
  for (const line of marketplaceTransactionEnvExports(fixture)) {
    console.log(line);
  }
  for (const line of marketplaceTransactionMutationEnvExports(fixture)) {
    console.log(line);
  }

  console.log("result=ok message=marketplace transaction fixture seeded");
}

try {
  await main();
} catch (error) {
  console.error("Marketplace transaction fixture seed");
  console.error(`result=fail message=${error instanceof Error ? error.message : "Unknown error"}`);
  process.exitCode = 1;
}
