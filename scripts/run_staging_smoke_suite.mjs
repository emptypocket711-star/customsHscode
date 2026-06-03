#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { safeOrigin } from "./completion_preview_e2e_env.mjs";
import { marketplaceTransactionFixture } from "../tests/fixtures/marketplace-transaction.fixture.mjs";

const baseUrl = process.argv[2] || process.env.STAGING_SMOKE_BASE_URL || process.env.E2E_BASE_URL;

const steps = [
  {
    label: "health-db",
    command: "npm",
    args: ["run", "health:db"],
    purpose: "Preview DB schema, RLS objects, and RPC drift are checked before browser flows run.",
    failureHint:
      "Check DATABASE_URL and unapplied Supabase migrations first. Re-run health:db with -- --json if the missing table/function list is too long."
  },
  {
    label: "marketplace-schema",
    command: "npm",
    args: ["run", "smoke:marketplace-schema"],
    purpose: "Marketplace tables and RPCs required by requester, partner, and completion flows are visible.",
    failureHint:
      "Apply pending marketplace migrations to Preview, then confirm source/version tables and completion RPCs exist."
  },
  {
    label: "marketplace-fixture-seed",
    command: "node",
    args: ["scripts/seed_marketplace_transaction_fixture.mjs"],
    purpose: "Requester, forwarder, and broker fixture accounts are refreshed before role guard and E2E flows.",
    failureHint:
      "Check SUPABASE_SERVICE_ROLE_KEY, E2E_TEST_PASSWORD, and remote marketplace E2E allow-list env."
  },
  {
    label: "route-smoke",
    command: "npm",
    args: ["run", "smoke:production", "--", baseUrl],
    purpose: "Public and authenticated route bodies respond on the selected Preview deployment with the requester fixture account.",
    failureHint:
      "Check Preview URL, Vercel protection bypass, fixture seed status, smoke login credentials, and whether the deployment is still building."
  },
  {
    label: "operations-guard",
    command: "npm",
    args: ["run", "smoke:operations:guard", "--", baseUrl],
    purpose: "Non-developer accounts cannot read developer-only operations page bodies.",
    failureHint:
      "Inspect role/profile seed data and operations route guards. This is an access-control failure until proven otherwise."
  },
  {
    label: "marketplace-transaction",
    command: "npm",
    args: ["run", "e2e:marketplace-transaction:staging", "--", baseUrl],
    purpose: "Requester and partner marketplace request, bid, selection, completion, and feedback mutations work in Preview.",
    failureHint:
      "Check fixture seed output, role storage states under tmp/e2e-auth-staging, and marketplace RPC/table policy errors."
  },
  {
    label: "completion-report",
    command: "npm",
    args: ["run", "e2e:completion-preview:staging", "--", baseUrl],
    purpose: "Completion report preview, redaction, draft submit, dual acknowledgement, and developer review gate work.",
    failureHint:
      "Check completion report fixture rows, acknowledgement RPC state, and whether both requester and selected partner sessions were created."
  },
  {
    label: "notification-dashboard",
    command: "npm",
    args: ["run", "e2e:marketplace-notification:staging", "--", baseUrl],
    purpose: "Partner dashboard in-app notification delivery, request link, anchor, and read mark work.",
    failureHint:
      "Check notification preferences, delivery rows, partner session state, and dashboard selector changes."
  },
  {
    label: "notification-worker",
    command: "npm",
    args: ["run", "ops:marketplace-notifications:rehearse-staging", "--", baseUrl],
    purpose: "Protected worker route calculates targets, blocks unready sends, and claims in-app deliveries without external sends.",
    failureHint:
      "Check JOB_WORKER_SECRET/CRON_SECRET, Vercel bypass headers, notification provider readiness env, and worker route auth."
  }
];

function loadShipperAccountDefaults() {
  const fixturePassword = process.env.E2E_TEST_PASSWORD || "";
  if (fixturePassword) {
    return {
      E2E_TEST_PASSWORD: fixturePassword,
      SMOKE_LOGIN_EMAIL: process.env.SMOKE_LOGIN_EMAIL || marketplaceTransactionFixture.users.requester.email,
      SMOKE_LOGIN_PASSWORD: process.env.SMOKE_LOGIN_PASSWORD || fixturePassword
    };
  }

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

function formatDuration(startedAt) {
  const ms = Date.now() - startedAt;
  const seconds = Math.round(ms / 100) / 10;
  return `${seconds}s`;
}

function printStepSummary(results) {
  console.log("suiteStepSummary");
  for (const result of results) {
    const parts = [
      `step=${result.label}`,
      `status=${result.status}`,
      `duration=${result.duration}`,
      `purpose="${result.purpose}"`
    ];
    if (result.exitCode !== undefined) {
      parts.push(`exitCode=${result.exitCode}`);
    }
    if (result.signal) {
      parts.push(`signal=${result.signal}`);
    }
    console.log(parts.join(" "));
  }
}

function printFailureDetails(step, result, completedResults) {
  console.error("suiteFailureDetails");
  console.error(`failedStep=${step.label}`);
  console.error(`failedCommand=${step.command} ${step.args.join(" ")}`);
  console.error(`exitCode=${result.status ?? "unknown"}`);
  if (result.signal) console.error(`signal=${result.signal}`);
  console.error(`nextAction=${step.failureHint}`);

  const lastPassed = completedResults.filter((entry) => entry.status === "ok").at(-1);
  console.error(`lastPassedStep=${lastPassed?.label ?? "none"}`);
}

function runStep(step, env) {
  const startedAt = Date.now();
  console.log(`step=${step.label}`);
  console.log(`stepPurpose=${step.purpose}`);
  const result = spawnSync(step.command, step.args, {
    env,
    stdio: "inherit"
  });

  return {
    duration: formatDuration(startedAt),
    exitCode: result.status ?? undefined,
    label: step.label,
    purpose: step.purpose,
    signal: result.signal ?? undefined,
    status: result.status === 0 ? "ok" : "failed",
    raw: result
  };
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
    E2E_ALLOW_REMOTE_MARKETPLACE_TRANSACTION: "true",
    OPERATIONS_GUARD_ACCOUNT_SOURCE: "marketplace_fixture",
    SMOKE_REQUIRE_AUTHENTICATED: "true"
  };

  console.log("HS Finder staging smoke suite");
  console.log(`baseUrlOrigin=${safeOrigin(baseUrl)}`);
  console.log("secretValues=not-printed");

  const results = [];
  for (const step of steps) {
    const result = runStep(step, env);
    results.push(result);
    console.log(`stepResult=${step.label} status=${result.status} duration=${result.duration}`);

    if (result.status !== "ok") {
      printStepSummary(results);
      printFailureDetails(step, result.raw, results);
      process.exitCode = 1;
      return;
    }
  }

  printStepSummary(results);
  console.log("result=ok");
}

try {
  main();
} catch (error) {
  console.error("HS Finder staging smoke suite failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
