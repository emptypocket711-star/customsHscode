#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const baseUrl = process.env.LOCAL_REVIEW_BASE_URL || "http://127.0.0.1:3100";

function safeOrigin(value) {
  try {
    return new URL(value).origin;
  } catch {
    return "invalid-url";
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      ...options.env
    }
  });

  return {
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim(),
    status: result.status ?? 1
  };
}

async function checkLoginPage() {
  const response = await fetch(new URL("/login", baseUrl), { signal: AbortSignal.timeout(5000) });
  const text = await response.text();
  return {
    envError: text.includes("Supabase 환경 변수가 없어 로그인할 수 없습니다."),
    ok: response.ok,
    status: response.status
  };
}

function printCommandOutput(label, result) {
  console.log(`--- ${label} ---`);
  if (result.output) console.log(result.output);
  console.log(`exitCode=${result.status}`);
}

async function main() {
  console.log("Local review status");
  console.log(`baseUrlOrigin=${safeOrigin(baseUrl)}`);
  console.log("secretValues=not-printed");

  const loginPage = await checkLoginPage().catch((error) => ({
    envError: false,
    error: error instanceof Error ? error.message : "unknown",
    ok: false,
    status: 0
  }));

  console.log(`loginPage=${loginPage.ok ? "ok" : "fail"} status=${loginPage.status} envError=${loginPage.envError}`);
  if ("error" in loginPage) console.log(`loginPageError=${loginPage.error}`);

  const loginSmoke = run("npm", ["run", "smoke:local-login"], {
    env: {
      LOCAL_LOGIN_SMOKE_ALL: "1",
      LOCAL_LOGIN_SMOKE_BASE_URL: baseUrl
    }
  });
  printCommandOutput("login smoke", loginSmoke);

  const schemaSmoke = run("npm", ["run", "smoke:marketplace-schema"]);
  printCommandOutput("marketplace schema smoke", schemaSmoke);

  const loginReady = loginPage.ok && !loginPage.envError && loginSmoke.status === 0;
  const schemaReady = schemaSmoke.status === 0;

  console.log("--- summary ---");
  console.log(`localLogin=${loginReady ? "ready" : "blocked"}`);
  console.log(`marketplacePositivePath=${schemaReady ? "ready" : "blocked"}`);
  console.log(
    schemaReady
      ? "nextAction=role별 marketplace 요청·입찰 positive path를 실행할 수 있습니다."
      : "nextAction=로그인/일반 화면은 확인 가능하고, marketplace 요청·입찰 positive path는 migration 적용된 local/review DB가 필요합니다."
  );

  if (!loginReady) process.exitCode = 1;
}

await main().catch((error) => {
  console.error(`result=fail message=${error instanceof Error ? error.message : "unknown"}`);
  process.exitCode = 1;
});
