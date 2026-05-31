#!/usr/bin/env node

const allowedJobs = new Set(["cargo-watch", "exchange-rates", "hs-lookup-snapshots", "trade-news", "run", "operations-retention", "operations-issues", "operations-issues-rehearsal"]);
const jobName = process.argv[2];

if (!jobName || !allowedJobs.has(jobName)) {
  console.error("Usage: node scripts/run_protected_job.mjs <cargo-watch|exchange-rates|hs-lookup-snapshots|trade-news|run|operations-retention|operations-issues|operations-issues-rehearsal>");
  process.exit(1);
}

const baseUrl = process.env.OPERATIONS_BASE_URL || "https://hsfinder.co.kr";
const secret = process.env.JOB_WORKER_SECRET || process.env.CRON_SECRET;

if (!secret) {
  console.error("JOB_WORKER_SECRET or CRON_SECRET is required in the local shell environment.");
  console.error("Example: JOB_WORKER_SECRET='...' npm run ops:job:trade-news");
  process.exit(1);
}

const url = new URL(`/api/jobs/${jobName}`, baseUrl);
const startedAt = Date.now();

const response = await fetch(url, {
  method: jobName === "run" ? "POST" : "GET",
  headers: {
    Authorization: `Bearer ${secret}`,
    "User-Agent": "hsfinder-ops-job-runner/1.0"
  }
});

const contentType = response.headers.get("content-type") ?? "";
const body = contentType.includes("application/json")
  ? await response.json().catch(() => null)
  : await response.text();

console.log(JSON.stringify({
  job: jobName,
  url: url.toString(),
  status: response.status,
  ok: response.ok,
  durationMs: Date.now() - startedAt,
  body
}, null, 2));

if (!response.ok) {
  process.exit(1);
}
