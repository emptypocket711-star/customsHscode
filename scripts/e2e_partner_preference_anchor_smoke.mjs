#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";
import {
  envValue,
  isLocalOrAllowedRemoteUrl,
  loadEnvFile,
  playwrightContextOptions,
  remoteE2ERequirement,
  safeOrigin
} from "./completion_preview_e2e_env.mjs";

const scope = "MARKETPLACE_TRANSACTION";
const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3100";
const timeoutMs = Number(process.env.E2E_TIMEOUT_MS || 120000);
const emptyForwarder = {
  companyId: "75000000-0000-4000-8000-000000000510",
  companyName: "E2E 빈 포워딩",
  email: "marketplace-empty-forwarder@example.test",
  fullName: "marketplace empty forwarder"
};

function assert(condition, message, details = {}) {
  if (condition) return;

  const error = new Error(message);
  error.details = details;
  throw error;
}

function assertAllowedUrl(value, label) {
  assert(
    isLocalOrAllowedRemoteUrl(value, scope),
    `${label}는 local 또는 명시적으로 허용된 remote에서만 실행할 수 있습니다. current=${safeOrigin(value)}. ${remoteE2ERequirement(scope)}`
  );
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

async function prepareEmptyForwarder(client, password) {
  const existing = await findUserByEmail(client, emptyForwarder.email);
  const metadata = {
    company_name: emptyForwarder.companyName,
    full_name: emptyForwarder.fullName
  };
  const userResult = existing
    ? await client.auth.admin.updateUserById(existing.id, {
      email_confirm: true,
      password,
      user_metadata: metadata
    })
    : await client.auth.admin.createUser({
      email: emptyForwarder.email,
      email_confirm: true,
      password,
      user_metadata: metadata
    });

  if (userResult.error) throw new Error(`empty forwarder auth prepare failed: ${userResult.error.message}`);
  const user = userResult.data.user;
  const now = new Date().toISOString();

  const { error: companyError } = await client
    .from("companies")
    .upsert({
      contact_email: emptyForwarder.email,
      country_code: "KR",
      id: emptyForwarder.companyId,
      name: emptyForwarder.companyName,
      trust_score: 60,
      type: "client",
      verification_status: "operator_approved",
      verified_at: now
    }, { onConflict: "id" });
  if (companyError) throw new Error(`empty forwarder company prepare failed: ${companyError.message}`);

  const { error: profileError } = await client
    .from("profiles")
    .upsert({
      company_id: emptyForwarder.companyId,
      company_role: "admin",
      email: emptyForwarder.email,
      full_name: emptyForwarder.fullName,
      id: user.id,
      onboarding_completed_at: now,
      preferred_locale: "ko-KR",
      role: "client"
    }, { onConflict: "id" });
  if (profileError) throw new Error(`empty forwarder profile prepare failed: ${profileError.message}`);

  const { error: partyError } = await client
    .from("company_party_types")
    .upsert({
      company_id: emptyForwarder.companyId,
      created_by: user.id,
      is_primary: true,
      party_type: "forwarder"
    }, { onConflict: "company_id,party_type" });
  if (partyError) throw new Error(`empty forwarder party type prepare failed: ${partyError.message}`);

  const { error: preferenceError } = await client
    .from("partner_service_preferences")
    .upsert({
      cargo_tags: ["p275-empty-anchor-only"],
      company_id: emptyForwarder.companyId,
      destination_country_codes: ["ZZ"],
      digest_enabled: false,
      directions: ["export"],
      notification_enabled: true,
      origin_country_codes: ["ZZ"],
      ports: ["ZZZZZ"],
      service_type: "freight",
      transport_modes: ["rail"],
      urgent_available: true
    }, { onConflict: "company_id,service_type" });
  if (preferenceError) throw new Error(`empty forwarder preference prepare failed: ${preferenceError.message}`);

  const { error: matchCleanupError } = await client
    .from("service_request_partner_matches")
    .delete()
    .eq("partner_company_id", emptyForwarder.companyId);
  if (matchCleanupError) throw new Error(`empty forwarder match cleanup failed: ${matchCleanupError.message}`);
}

async function login(page, password) {
  await page.goto(new URL("/login", baseUrl).toString(), { waitUntil: "domcontentloaded", timeout: timeoutMs });
  await page.locator('input[name="email"]').fill(emptyForwarder.email, { timeout: timeoutMs });
  await page.locator('input[name="password"]').fill(password, { timeout: timeoutMs });
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: timeoutMs }),
    page.locator('button[type="submit"]').click()
  ]);
}

async function main() {
  const localEnv = await loadEnvFile();
  const supabaseUrl = envValue(localEnv, "SUPABASE_URL") || envValue(localEnv, "NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = envValue(localEnv, "SUPABASE_SERVICE_ROLE_KEY");
  const password = envValue(localEnv, "E2E_TEST_PASSWORD");

  console.log("Partner preference anchor smoke");
  console.log(`baseUrlOrigin=${safeOrigin(baseUrl)}`);
  console.log(`supabaseOrigin=${safeOrigin(supabaseUrl)}`);
  console.log("secretValues=not-printed");

  assertAllowedUrl(baseUrl, "E2E_BASE_URL");
  assertAllowedUrl(supabaseUrl, "SUPABASE_URL");
  assert(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY가 필요합니다.");
  assert(password, "E2E_TEST_PASSWORD가 필요합니다.");

  const serviceRoleClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  await prepareEmptyForwarder(serviceRoleClient, password);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(playwrightContextOptions({ viewport: { width: 1366, height: 900 } }));
  const page = await context.newPage();

  try {
    await login(page, password);
    await page.goto(new URL("/requests/freight?workspace=forwarder", baseUrl).toString(), { waitUntil: "networkidle", timeout: timeoutMs });
    const body = await page.locator("body").innerText({ timeout: timeoutMs });
    assert(body.includes("현재 입찰 가능한 운송 요청이 없습니다"), "파트너 빈 상태 안내 문구가 보이지 않습니다.");

    const settingsLink = page.getByRole("link", { name: "관심 조건 설정 확인" }).first();
    const href = await settingsLink.getAttribute("href");
    assert(href === "/settings/members#partner-preferences", "관심 조건 링크 href가 설정 anchor와 다릅니다.", { href });

    await Promise.all([
      page.waitForURL((url) => url.pathname === "/settings/members" && url.hash === "#partner-preferences", { timeout: timeoutMs }),
      settingsLink.click({ timeout: timeoutMs })
    ]);
    await page.waitForLoadState("networkidle", { timeout: timeoutMs }).catch(() => undefined);

    const settingsBody = await page.locator("body").innerText({ timeout: timeoutMs });
    assert(settingsBody.includes("운송 견적 관심 조건"), "회사 설정의 파트너 관심 조건 섹션이 보이지 않습니다.");
  } finally {
    await context.close();
    await browser.close();
  }

  console.log("result=ok");
}

try {
  await main();
} catch (error) {
  console.error("Partner preference anchor smoke failed");
  console.error(`result=fail message=${error instanceof Error ? error.message : "Unknown error"}`);
  if (error instanceof Error && "details" in error) {
    console.error(`details=${JSON.stringify(error.details)}`);
  }
  process.exitCode = 1;
}
