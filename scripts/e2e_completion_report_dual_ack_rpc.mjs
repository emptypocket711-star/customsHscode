#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import {
  isLocalOrAllowedRemoteUrl,
  remoteE2ERequirement,
  safeOrigin
} from "./completion_preview_e2e_env.mjs";
import {
  completionReportPreviewFixture as fixture,
  completionReportPreviewSeedReports as reports
} from "../tests/fixtures/completion-report-preview.fixture.mjs";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const testPassword = process.env.E2E_TEST_PASSWORD;
const reportId = reports.find((report) => report.requestId === fixture.draftFreightRequestId)?.id;

function assert(condition, message, details = {}) {
  if (condition) return;

  const error = new Error(message);
  error.details = details;
  throw error;
}

function assertAllowedSupabaseUrl(value) {
  assert(value, "SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_URL이 필요합니다.");
  assert(
    isLocalOrAllowedRemoteUrl(value, "COMPLETION_PREVIEW"),
    `local Supabase 또는 명시적으로 허용된 remote Supabase에서만 completion dual-ack E2E를 실행할 수 있습니다. current=${safeOrigin(value)}. ${remoteE2ERequirement("COMPLETION_PREVIEW")}`
  );
}

async function signedClient(email) {
  const client = createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  const { error } = await client.auth.signInWithPassword({
    email,
    password: testPassword
  });

  if (error) throw new Error(`signIn failed for ${email}: ${error.message}`);
  return client;
}

async function rpcOrThrow(client, name, params) {
  const { data, error } = await client.rpc(name, params);
  if (error) throw new Error(`${name} failed: ${error.message}`);
  return data;
}

async function expectReviewBlocked(developer) {
  const { error } = await developer.rpc("review_completion_report", {
    p_report_id: reportId
  });

  assert(error, "partner acknowledgement 없이 운영 검토가 통과했습니다.");
  assert(
    error.message.includes("화주와 파트너 확인을 모두 완료"),
    "운영 검토 차단 메시지가 dual acknowledgement 기준이 아닙니다.",
    { message: error.message }
  );
}

async function main() {
  assertAllowedSupabaseUrl(supabaseUrl);
  assert(anonKey, "SUPABASE_ANON_KEY 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY가 필요합니다.");
  assert(testPassword, "E2E_TEST_PASSWORD가 필요합니다.");
  assert(reportId, "draft completion report fixture id를 찾을 수 없습니다.");

  const requester = await signedClient(fixture.requesterUserEmail);
  const selectedPartner = await signedClient(fixture.selectedPartnerUserEmail);
  const developer = await signedClient(fixture.developerUserEmail);

  await rpcOrThrow(requester, "submit_completion_report", { p_report_id: reportId });
  await rpcOrThrow(requester, "acknowledge_completion_report", {
    p_report_id: reportId,
    p_role: "requester"
  });
  await expectReviewBlocked(developer);
  await rpcOrThrow(selectedPartner, "acknowledge_completion_report", {
    p_report_id: reportId,
    p_role: "partner"
  });
  await rpcOrThrow(developer, "review_completion_report", { p_report_id: reportId });

  console.log("Completion report dual acknowledgement RPC E2E");
  console.log(`supabaseOrigin=${safeOrigin(supabaseUrl)}`);
  console.log("secretValues=not-printed");
  console.log("result=ok");
}

try {
  await main();
} catch (error) {
  console.error("Completion report dual acknowledgement RPC E2E");
  console.error(`result=fail message=${error instanceof Error ? error.message : "Unknown error"}`);
  if (error instanceof Error && "details" in error) {
    console.error(`details=${JSON.stringify(error.details)}`);
  }
  process.exitCode = 1;
}
