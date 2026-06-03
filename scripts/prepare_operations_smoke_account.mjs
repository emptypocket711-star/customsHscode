#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

const developerEmail = (process.env.OPERATIONS_DEVELOPER_EMAIL || "emptypocket711@gmail.com").trim().toLowerCase();
const developerPassword =
  process.env.SMOKE_OPERATIONS_PASSWORD ||
  process.env.OPERATIONS_DEVELOPER_PASSWORD ||
  "";
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const fullName = process.env.OPERATIONS_DEVELOPER_FULL_NAME || "HS Finder 운영 개발자";
const companyName = process.env.OPERATIONS_DEVELOPER_COMPANY_NAME || "HS Finder 운영";

function requireEnv() {
  const missing = [];
  if (!supabaseUrl) missing.push("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!developerPassword) missing.push("SMOKE_OPERATIONS_PASSWORD or OPERATIONS_DEVELOPER_PASSWORD");

  if (missing.length) {
    console.log("HS Finder operations smoke account prepare");
    console.log(`developerEmail=${developerEmail}`);
    console.log(`supabaseOrigin=${supabaseUrl ? new URL(supabaseUrl).origin : "missing"}`);
    console.log(`serviceRoleKey=${serviceRoleKey ? "present" : "missing"}`);
    console.log(`developerPassword=${developerPassword ? "present" : "missing"}`);
    console.log(`missing=${missing.join(", ")}`);
    console.log("nextAction=필수 env를 설정한 뒤 다시 실행하세요. 성공 후 같은 비밀번호를 SMOKE_OPERATIONS_PASSWORD로 smoke에 전달합니다.");
    process.exit(1);
  }
}

function assertDeveloperEmail() {
  if (developerEmail !== "emptypocket711@gmail.com") {
    throw new Error("운영 smoke는 지정 개발자 이메일 emptypocket711@gmail.com만 준비할 수 있습니다.");
  }
}

async function findUserByEmail(client, email) {
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`auth user list failed: ${error.message}`);

    const found = data.users.find((user) => user.email?.trim().toLowerCase() === email);
    if (found) return found;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function ensureAuthUser(client) {
  const existing = await findUserByEmail(client, developerEmail);
  const metadata = {
    account_type: "company",
    company_name: companyName,
    full_name: fullName
  };

  if (existing) {
    const { data, error } = await client.auth.admin.updateUserById(existing.id, {
      email_confirm: true,
      password: developerPassword,
      user_metadata: metadata
    });
    if (error) throw new Error(`developer auth user update failed: ${error.message}`);
    return { user: data.user, created: false };
  }

  const { data, error } = await client.auth.admin.createUser({
    email: developerEmail,
    email_confirm: true,
    password: developerPassword,
    user_metadata: metadata
  });
  if (error) throw new Error(`developer auth user create failed: ${error.message}`);
  return { user: data.user, created: true };
}

async function ensureCompany(client) {
  const { data: existing, error: selectError } = await client
    .from("companies")
    .select("id,name,type")
    .eq("name", companyName)
    .eq("type", "internal")
    .limit(1)
    .maybeSingle();
  if (selectError) throw new Error(`developer company lookup failed: ${selectError.message}`);
  if (existing?.id) return { company: existing, created: false };

  const { data, error } = await client
    .from("companies")
    .insert({
      name: companyName,
      type: "internal"
    })
    .select("id,name,type")
    .single();
  if (error) throw new Error(`developer company create failed: ${error.message}`);
  return { company: data, created: true };
}

async function ensureProfile(client, userId, companyId) {
  const { data, error } = await client
    .from("profiles")
    .upsert({
      id: userId,
      email: developerEmail,
      full_name: fullName,
      role: "developer",
      company_id: companyId,
      company_role: "admin",
      account_type: "company",
      allowed_ip_count: 5,
      onboarding_completed_at: new Date().toISOString()
    }, { onConflict: "id" })
    .select("id,email,role,company_id,company_role")
    .single();
  if (error) throw new Error(`developer profile upsert failed: ${error.message}`);
  return data;
}

async function main() {
  requireEnv();
  assertDeveloperEmail();

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const authResult = await ensureAuthUser(client);
  const companyResult = await ensureCompany(client);
  const profile = await ensureProfile(client, authResult.user.id, companyResult.company.id);

  console.log("HS Finder operations smoke account prepare");
  console.log(`developerEmail=${developerEmail}`);
  console.log(`supabaseOrigin=${new URL(supabaseUrl).origin}`);
  console.log(`authUserCreated=${authResult.created}`);
  console.log(`companyCreated=${companyResult.created}`);
  console.log(`userId=${authResult.user.id}`);
  console.log(`companyId=${companyResult.company.id}`);
  console.log(`profileRole=${profile.role}`);
  console.log(`profileCompanyRole=${profile.company_role ?? "unknown"}`);
  console.log("nextAction=SMOKE_OPERATIONS_EMAIL과 SMOKE_OPERATIONS_PASSWORD를 같은 값으로 설정하고 smoke:production을 실행하세요.");
}

await main();
