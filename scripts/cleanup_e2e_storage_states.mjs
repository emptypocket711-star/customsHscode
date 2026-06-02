#!/usr/bin/env node

import { readdir, rm } from "node:fs/promises";
import path from "node:path";

const stateDir = process.env.E2E_STORAGE_STATE_DIR || "tmp/e2e-auth";
const apply = process.argv.includes("--apply");

const allowedPrefixes = [
  "completion-preview-",
  "local-developer",
  "marketplace-notification-",
  "marketplace-transaction-"
];

function isAllowedStorageState(fileName) {
  return fileName.endsWith(".json") && allowedPrefixes.some((prefix) => fileName.startsWith(prefix));
}

async function main() {
  const files = await readdir(stateDir).catch(() => []);
  const targets = files.filter(isAllowedStorageState).sort();

  console.log("E2E storage state cleanup");
  console.log(`stateDir=${stateDir}`);
  console.log(`mode=${apply ? "apply" : "dry-run"}`);

  if (!targets.length) {
    console.log("targetCount=0");
    console.log("result=ready");
    return;
  }

  for (const fileName of targets) {
    const filePath = path.join(stateDir, fileName);
    console.log(`${apply ? "delete" : "would-delete"} ${filePath}`);
    if (apply) await rm(filePath, { force: true });
  }

  console.log(`targetCount=${targets.length}`);
  console.log("result=ready");
}

await main().catch((error) => {
  console.error(`result=fail message=${error instanceof Error ? error.message : "unknown"}`);
  process.exitCode = 1;
});
