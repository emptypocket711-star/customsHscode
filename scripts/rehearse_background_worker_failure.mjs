#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) return;

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function requireEnv(key) {
  const value = process.env[key]?.trim();
  if (!value) throw new Error(`${key} is required.`);
  return value;
}

async function main() {
  loadDotEnv(".env.local");

  const baseUrl = process.env.OPERATIONS_BASE_URL || "https://hsfinder.co.kr";
  const secret = process.env.JOB_WORKER_SECRET || process.env.CRON_SECRET;
  if (!secret) throw new Error("JOB_WORKER_SECRET or CRON_SECRET is required.");

  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
  const workerId = `failure-rehearsal-${Date.now()}`;
  let jobId = "";

  try {
    const { data, error } = await supabase
      .from("background_jobs")
      .insert({
        job_type: "hs_batch_lookup",
        status: "queued",
        priority: 1,
        max_attempts: 1,
        payload: {
          kind: "hs_batch_lookup_failure_rehearsal",
          note: "Intentional invalid payload for worker failure alert rehearsal."
        }
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    jobId = String(data.id);

    const response = await fetch(new URL("/api/jobs/run", baseUrl), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "x-worker-id": workerId,
        "User-Agent": "hsfinder-background-failure-rehearsal/1.0"
      }
    });
    const body = await response.json().catch(() => null);

    const { data: job, error: jobError } = await supabase
      .from("background_jobs")
      .select("status,attempts,error_message")
      .eq("id", jobId)
      .single();
    if (jobError) throw new Error(jobError.message);

    const { data: runRows, error: runError } = await supabase
      .from("background_job_runs")
      .select("status,claimed_count,succeeded_count,failed_count,error_message,created_at")
      .eq("worker_id", workerId)
      .order("created_at", { ascending: false })
      .limit(1);
    if (runError) throw new Error(runError.message);
    const run = runRows?.[0] ?? null;
    const matchingOutcome = Array.isArray(body?.outcomes)
      ? body.outcomes.find((outcome) => outcome.jobId === jobId)
      : null;
    const alert = body?.alert ?? null;
    const ok = response.ok
      && body?.claimed === 1
      && matchingOutcome?.status === "failed"
      && job?.status === "dead"
      && run?.status === "failed"
      && run?.failed_count === 1
      && alert?.sent === true;

    console.log(JSON.stringify({
      ok,
      jobId,
      workerId,
      routeStatus: response.status,
      claimed: body?.claimed ?? null,
      outcomeStatus: matchingOutcome?.status ?? null,
      jobStatus: job?.status ?? null,
      jobAttempts: job?.attempts ?? null,
      runStatus: run?.status ?? null,
      runFailedCount: run?.failed_count ?? null,
      alert
    }, null, 2));

    if (!ok) process.exitCode = 1;
  } finally {
    if (jobId) {
      await supabase.from("background_jobs").delete().eq("id", jobId);
    }
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exit(1);
});
