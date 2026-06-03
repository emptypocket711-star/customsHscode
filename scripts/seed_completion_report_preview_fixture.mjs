#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import {
  isLocalOrAllowedRemoteUrl,
  remoteE2ERequirement,
  safeOrigin
} from "./completion_preview_e2e_env.mjs";
import {
  buildCompletionReportPreviewSourceSnapshot,
  completionReportPreviewFixture as fixture,
  completionReportPreviewSeedCompanies as companies,
  completionReportPreviewSeedUsers as users
} from "../tests/fixtures/completion-report-preview.fixture.mjs";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const testPassword = process.env.E2E_TEST_PASSWORD;

function assert(condition, message) {
  if (condition) return;
  throw new Error(message);
}

function assertLocalSupabaseUrl(value) {
  assert(value, "SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_URL이 필요합니다.");

  assert(
    isLocalOrAllowedRemoteUrl(value, "COMPLETION_PREVIEW"),
    `local Supabase 또는 명시적으로 허용된 remote Supabase에서만 실행할 수 있습니다. current=${safeOrigin(value)}. ${remoteE2ERequirement("COMPLETION_PREVIEW")}`
  );
}

function requiredEnv() {
  assertLocalSupabaseUrl(supabaseUrl);
  assert(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY가 필요합니다.");
  assert(testPassword, "E2E_TEST_PASSWORD가 필요합니다.");
}

async function upsertOrThrow(client, table, rows, options) {
  const { error } = await client.from(table).upsert(rows, options);
  if (error) throw new Error(`${table} upsert failed: ${error.message}`);
}

async function deleteByIds(client, table, ids) {
  const { error } = await client.from(table).delete().in("id", ids);
  if (error) throw new Error(`${table} cleanup failed: ${error.message}`);
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

async function ensureUser(client, user) {
  const existing = await findUserByEmail(client, user.email);
  if (existing) {
    const { data, error } = await client.auth.admin.updateUserById(existing.id, {
      email_confirm: true,
      password: testPassword,
      user_metadata: {
        company_name: companies.find((company) => company.id === user.companyId)?.name,
        full_name: `completion preview ${user.role}`
      }
    });
    if (error) throw new Error(`auth user update failed for ${user.email}: ${error.message}`);
    return data.user;
  }

  const { data, error } = await client.auth.admin.createUser({
    email: user.email,
    email_confirm: true,
    password: testPassword,
    user_metadata: {
      company_name: companies.find((company) => company.id === user.companyId)?.name,
      full_name: `completion preview ${user.role}`
    }
  });

  if (error) throw new Error(`auth user create failed for ${user.email}: ${error.message}`);
  return data.user;
}

async function main() {
  requiredEnv();

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  await upsertOrThrow(client, "companies", companies.map((company) => ({
    country_code: "KR",
    id: company.id,
    name: company.name,
    type: company.type,
    verification_status: "operator_approved"
  })), { onConflict: "id" });

  const authUsers = new Map();
  for (const user of users) {
    authUsers.set(user.email, await ensureUser(client, user));
  }

  await upsertOrThrow(client, "profiles", users.map((user) => ({
    company_id: user.companyId,
    company_role: "admin",
    email: user.email,
    full_name: `completion preview ${user.role}`,
    id: authUsers.get(user.email).id,
    onboarding_completed_at: "2026-06-01T00:00:00.000Z",
    role: user.profileRole
  })), { onConflict: "id" });

  await deleteByIds(client, "service_request_completion_report_documents", [
    "00000000-0000-4000-8000-000000000141",
    "00000000-0000-4000-8000-000000000241",
    "00000000-0000-4000-8000-000000000341"
  ]);
  await deleteByIds(client, "service_request_completion_reports", [
    "00000000-0000-4000-8000-000000000121",
    "00000000-0000-4000-8000-000000000221",
    "00000000-0000-4000-8000-000000000321"
  ]);
  await deleteByIds(client, "service_bids", [
    "00000000-0000-4000-8000-000000000111",
    "00000000-0000-4000-8000-000000000211",
    "00000000-0000-4000-8000-000000000311"
  ]);
  await deleteByIds(client, "service_request_documents", [
    "00000000-0000-4000-8000-000000000131",
    "00000000-0000-4000-8000-000000000231",
    "00000000-0000-4000-8000-000000000331"
  ]);
  await deleteByIds(client, "service_requests", [
    fixture.freightRequestId,
    fixture.clearanceRequestId,
    fixture.draftFreightRequestId
  ]);

  const requesterUserId = authUsers.get(fixture.requesterUserEmail).id;
  const selectedPartnerUserId = authUsers.get(fixture.selectedPartnerUserEmail).id;

  await upsertOrThrow(client, "service_requests", [
    {
      created_by: requesterUserId,
      destination_country_code: "KR",
      direction: "export",
      id: fixture.freightRequestId,
      origin_country_code: "KR",
      product_summary: "테스트 운송 완료 리포트 품목",
      requester_company_id: companies[0].id,
      request_type: "freight",
      source_lookup_snapshot: {},
      status: "completed",
      title: "완료 리포트 테스트 운송 요청",
      visibility: "matched_partners"
    },
    {
      created_by: requesterUserId,
      destination_country_code: "KR",
      direction: "import",
      id: fixture.clearanceRequestId,
      origin_country_code: "CN",
      product_summary: "테스트 통관 완료 리포트 품목",
      requester_company_id: companies[0].id,
      request_type: "clearance",
      source_lookup_snapshot: {},
      status: "completed",
      title: "완료 리포트 테스트 통관 요청",
      visibility: "matched_partners"
    },
    {
      created_by: requesterUserId,
      destination_country_code: "US",
      direction: "export",
      id: fixture.draftFreightRequestId,
      origin_country_code: "KR",
      product_summary: "테스트 수정 가능 운송 완료 리포트 품목",
      requester_company_id: companies[0].id,
      request_type: "freight",
      source_lookup_snapshot: {},
      status: "completed",
      title: "완료 리포트 mutation 테스트 운송 요청",
      visibility: "matched_partners"
    }
  ], { onConflict: "id" });

  await upsertOrThrow(client, "service_bids", [
    {
      bid_type: "freight",
      bidder_company_id: companies[1].id,
      created_by: selectedPartnerUserId,
      currency: "KRW",
      id: "00000000-0000-4000-8000-000000000111",
      request_id: fixture.freightRequestId,
      selected_at: "2026-06-01T00:00:00.000Z",
      status: "selected",
      submitted_at: "2026-06-01T00:00:00.000Z",
      total_amount: 220000
    },
    {
      bid_type: "clearance",
      bidder_company_id: companies[1].id,
      created_by: selectedPartnerUserId,
      currency: "KRW",
      id: "00000000-0000-4000-8000-000000000211",
      request_id: fixture.clearanceRequestId,
      selected_at: "2026-06-01T00:00:00.000Z",
      status: "selected",
      submitted_at: "2026-06-01T00:00:00.000Z",
      total_amount: 110000
    },
    {
      bid_type: "freight",
      bidder_company_id: companies[1].id,
      created_by: selectedPartnerUserId,
      currency: "KRW",
      id: "00000000-0000-4000-8000-000000000311",
      request_id: fixture.draftFreightRequestId,
      selected_at: "2026-06-01T00:00:00.000Z",
      status: "selected",
      submitted_at: "2026-06-01T00:00:00.000Z",
      total_amount: 330000
    }
  ], { onConflict: "id" });

  await upsertOrThrow(client, "service_request_documents", [
    {
      checksum: "completion-preview-document-checksum-freight",
      document_type: "bill_of_lading",
      file_name: "TEST-FREIGHT-FILE-NOT-DISPLAYED.pdf",
      id: "00000000-0000-4000-8000-000000000131",
      mime_type: "application/pdf",
      request_id: fixture.freightRequestId,
      requester_company_id: companies[0].id,
      storage_bucket: "service-request-documents",
      storage_path: `${companies[0].id}/completion-preview/freight.pdf`,
      uploaded_by: requesterUserId,
      visibility: "selected_partner"
    },
    {
      checksum: "completion-preview-document-checksum-clearance",
      document_type: "commercial_invoice",
      file_name: "TEST-CLEARANCE-FILE-NOT-DISPLAYED.pdf",
      id: "00000000-0000-4000-8000-000000000231",
      mime_type: "application/pdf",
      request_id: fixture.clearanceRequestId,
      requester_company_id: companies[0].id,
      storage_bucket: "service-request-documents",
      storage_path: `${companies[0].id}/completion-preview/clearance.pdf`,
      uploaded_by: requesterUserId,
      visibility: "selected_partner"
    },
    {
      checksum: "completion-preview-document-checksum-draft-freight",
      document_type: "bill_of_lading",
      file_name: "TEST-DRAFT-FREIGHT-FILE-NOT-DISPLAYED.pdf",
      id: "00000000-0000-4000-8000-000000000331",
      mime_type: "application/pdf",
      request_id: fixture.draftFreightRequestId,
      requester_company_id: companies[0].id,
      storage_bucket: "service-request-documents",
      storage_path: `${companies[0].id}/completion-preview/draft-freight.pdf`,
      uploaded_by: requesterUserId,
      visibility: "selected_partner"
    }
  ], { onConflict: "id" });

  await upsertOrThrow(client, "service_request_completion_reports", [
    {
      clearance_result: {},
      created_by: requesterUserId,
      currency: "KRW",
      final_amount: 220000,
      freight_result: {
        blOrAwbNo: "TEST-BL-001",
        carrier: "TEST CARRIER",
        departureDate: "2026-06-01",
        destinationPort: "BUSAN",
        exceptions: ["테스트 예외사항 없음"],
        originPort: "INCHEON"
      },
      id: "00000000-0000-4000-8000-000000000121",
      locked_at: "2026-06-01T00:00:00.000Z",
      request_id: fixture.freightRequestId,
      request_type: "freight",
      requester_company_id: companies[0].id,
      selected_partner_company_id: companies[1].id,
      settlement_items: [{ amount: 220000, currency: "KRW", label: "테스트 운임" }],
      source_snapshot: buildCompletionReportPreviewSourceSnapshot({
        bidType: "freight",
        direction: "export",
        selectedBidId: "00000000-0000-4000-8000-000000000111"
      }),
      status: "locked",
      submitted_at: "2026-06-01T00:00:00.000Z",
      summary: "테스트 운송 완료 리포트 요약"
    },
    {
      clearance_result: {
        acceptedAt: "2026-06-01",
        cautions: ["테스트 통관 주의사항"],
        declarationNo: "TEST-DECL-001",
        declaredHskCode: "3926909000",
        originCountryCode: "CN",
        taxSummary: [{ amount: 110000, currency: "KRW", label: "테스트 관세" }]
      },
      created_by: requesterUserId,
      currency: "KRW",
      final_amount: 110000,
      freight_result: {},
      id: "00000000-0000-4000-8000-000000000221",
      request_id: fixture.clearanceRequestId,
      request_type: "clearance",
      requester_company_id: companies[0].id,
      selected_partner_company_id: companies[1].id,
      settlement_items: [{ amount: 110000, currency: "KRW", label: "테스트 통관 수수료" }],
      source_snapshot: buildCompletionReportPreviewSourceSnapshot({
        bidType: "clearance",
        direction: "import",
        selectedBidId: "00000000-0000-4000-8000-000000000211"
      }),
      status: "operator_reviewed",
      submitted_at: "2026-06-01T00:00:00.000Z",
      summary: "테스트 통관 완료 리포트 요약"
    },
    {
      clearance_result: {},
      created_by: requesterUserId,
      currency: "KRW",
      final_amount: 330000,
      freight_result: {
        blOrAwbNo: "TEST-DRAFT-BL-BEFORE",
        carrier: "TEST DRAFT CARRIER BEFORE"
      },
      id: "00000000-0000-4000-8000-000000000321",
      request_id: fixture.draftFreightRequestId,
      request_type: "freight",
      requester_company_id: companies[0].id,
      selected_partner_company_id: companies[1].id,
      settlement_items: [{ amount: 330000, currency: "KRW", label: "테스트 수정 전 운임" }],
      source_snapshot: buildCompletionReportPreviewSourceSnapshot({
        bidType: "freight",
        direction: "export",
        selectedBidId: "00000000-0000-4000-8000-000000000311"
      }),
      status: "draft",
      submitted_at: null,
      summary: "테스트 수정 전 운송 완료 리포트 요약"
    }
  ], { onConflict: "id" });

  await upsertOrThrow(client, "service_request_completion_report_documents", [
    {
      added_by: requesterUserId,
      completion_report_id: "00000000-0000-4000-8000-000000000121",
      document_role: "final_bl_or_awb",
      id: "00000000-0000-4000-8000-000000000141",
      request_document_id: "00000000-0000-4000-8000-000000000131",
      required_for_archive: true
    },
    {
      added_by: requesterUserId,
      completion_report_id: "00000000-0000-4000-8000-000000000221",
      document_role: "import_declaration_certificate",
      id: "00000000-0000-4000-8000-000000000241",
      request_document_id: "00000000-0000-4000-8000-000000000231",
      required_for_archive: true
    },
    {
      added_by: requesterUserId,
      completion_report_id: "00000000-0000-4000-8000-000000000321",
      document_role: "final_bl_or_awb",
      id: "00000000-0000-4000-8000-000000000341",
      request_document_id: "00000000-0000-4000-8000-000000000331",
      required_for_archive: true
    }
  ], { onConflict: "id" });

  console.log("Completion report preview fixture seeded");
  console.log(`freightRequestId=${fixture.freightRequestId}`);
  console.log(`clearanceRequestId=${fixture.clearanceRequestId}`);
  console.log(`requester=${fixture.requesterUserEmail}`);
  console.log(`selectedPartner=${fixture.selectedPartnerUserEmail}`);
  console.log(`unmatchedPartner=${fixture.unmatchedPartnerUserEmail}`);
  console.log(`developer=${fixture.developerUserEmail}`);
}

try {
  await main();
} catch (error) {
  console.error("Completion report preview fixture seed failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
