#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const requiredChecks = [
  {
    name: "company marketplace columns",
    select: "id,name,verification_status,trust_score",
    table: "companies"
  },
  {
    name: "company party types",
    select: "company_id,party_type",
    table: "company_party_types"
  },
  {
    name: "partner preferences",
    select: "company_id,service_type,notification_enabled,digest_enabled",
    table: "partner_service_preferences"
  },
  {
    name: "service requests",
    select: "id,request_type,status",
    table: "service_requests"
  },
  {
    name: "service request partner matches",
    select: "id,partner_company_id,interest_status",
    table: "service_request_partner_matches"
  },
  {
    name: "service bids",
    select: "id,request_id,status",
    table: "service_bids"
  },
  {
    name: "marketplace notification deliveries",
    select: "id,partner_company_id,status",
    table: "marketplace_notification_deliveries"
  }
];

async function loadEnvFile(filePath = ".env.local") {
  const content = await readFile(filePath, "utf8").catch(() => "");
  const values = new Map();

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    values.set(match[1], match[2].trim().replace(/^['"]|['"]$/g, ""));
  }

  return values;
}

function envValue(values, key) {
  return process.env[key] || values.get(key) || "";
}

function safeOrigin(value) {
  try {
    return new URL(value).origin;
  } catch {
    return "missing";
  }
}

async function main() {
  const env = await loadEnvFile();
  const supabaseUrl = envValue(env, "SUPABASE_URL") || envValue(env, "NEXT_PUBLIC_SUPABASE_URL");
  const supabaseKey = envValue(env, "SUPABASE_SERVICE_ROLE_KEY") || envValue(env, "NEXT_PUBLIC_SUPABASE_ANON_KEY");

  console.log("Marketplace schema visibility check");
  console.log(`supabaseOrigin=${safeOrigin(supabaseUrl)}`);
  console.log("secretValues=not-printed");

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL 또는 key가 없어 schema visibility를 확인할 수 없습니다.");
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  const results = [];

  for (const check of requiredChecks) {
    const { error } = await supabase.from(check.table).select(check.select).limit(1);
    results.push({
      ...check,
      error,
      ok: !error
    });
  }

  for (const result of results) {
    if (result.ok) {
      console.log(`ok ${result.name} table=${result.table}`);
    } else {
      console.log(
        `fail ${result.name} table=${result.table} code=${result.error?.code ?? "unknown"} message=${result.error?.message ?? "unknown"}`
      );
    }
  }

  const failed = results.filter((result) => !result.ok);
  if (failed.length > 0) {
    console.log("result=blocked");
    console.log("nextAction=marketplace 역할·요청 화면 positive path는 marketplace migration이 적용된 local Supabase 또는 review DB에서 확인해야 합니다.");
    process.exitCode = 1;
    return;
  }

  console.log("result=ready");
}

await main().catch((error) => {
  console.error(`result=fail message=${error instanceof Error ? error.message : "unknown"}`);
  process.exitCode = 1;
});
