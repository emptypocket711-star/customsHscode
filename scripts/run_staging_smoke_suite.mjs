#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { safeOrigin } from "./completion_preview_e2e_env.mjs";

const baseUrl = process.argv[2] || process.env.STAGING_SMOKE_BASE_URL || process.env.E2E_BASE_URL;

function loadShipperAccountDefaults() {
  if (!existsSync("tmp/test-accounts.json")) return {};

  try {
    const payload = JSON.parse(readFileSync("tmp/test-accounts.json", "utf8"));
    const accounts = Array.isArray(payload.accounts) ? payload.accounts : Object.values(payload.accounts || {});
    const shipper = accounts.find((account) => account?.role === "shipper");
    if (!shipper?.email || !shipper?.password) return {};

    return {
      E2E_TEST_PASSWORD: process.env.E2E_TEST_PASSWORD || shipper.password,
      SMOKE_LOGIN_EMAIL: process.env.SMOKE_LOGIN_EMAIL || shipper.email,
      SMOKE_LOGIN_PASSWORD: process.env.SMOKE_LOGIN_PASSWORD || shipper.password
    };
  } catch {
    return {};
  }
}

function runStep(label, command, args, env) {
  console.log(`step=${label}`);
  const result = spawnSync(command, args, {
    env,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    throw new Error(`${label} failed`);
  }
}

function main() {
  if (!baseUrl) {
    console.error("Usage: npm run smoke:staging:suite -- https://your-preview-url.vercel.app");
    process.exitCode = 1;
    return;
  }

  const env = {
    ...process.env,
    ...loadShipperAccountDefaults(),
    SMOKE_REQUIRE_AUTHENTICATED: "true"
  };

  console.log("HS Finder staging smoke suite");
  console.log(`baseUrlOrigin=${safeOrigin(baseUrl)}`);
  console.log("secretValues=not-printed");

  runStep("health-db", "npm", ["run", "health:db"], env);
  runStep("marketplace-schema", "npm", ["run", "smoke:marketplace-schema"], env);
  runStep("route-smoke", "npm", ["run", "smoke:production", "--", baseUrl], env);
  runStep("operations-guard", "npm", ["run", "smoke:operations:guard", "--", baseUrl], env);
  runStep("marketplace-transaction", "npm", ["run", "e2e:marketplace-transaction:staging", "--", baseUrl], env);
  runStep("completion-report", "npm", ["run", "e2e:completion-preview:staging", "--", baseUrl], env);
  runStep("notification-dashboard", "npm", ["run", "e2e:marketplace-notification:staging", "--", baseUrl], env);
  runStep("notification-worker", "npm", ["run", "ops:marketplace-notifications:rehearse-staging", "--", baseUrl], env);

  console.log("result=ok");
}

try {
  main();
} catch (error) {
  console.error("HS Finder staging smoke suite failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
