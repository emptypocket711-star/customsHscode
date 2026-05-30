import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceRoleClient, hasSupabaseServiceRoleEnv } from "@/lib/supabase/service-role";
import { syncLookupQualityIssueEvents } from "@/server/operations/lookup-quality-issue-sync.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const secret = process.env.JOB_WORKER_SECRET || process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";

  const authorization = request.headers.get("authorization");
  const workerSecret = request.headers.get("x-job-worker-secret");
  const querySecret = request.nextUrl.searchParams.get("secret");

  return authorization === `Bearer ${secret}` || workerSecret === secret || querySecret === secret;
}

function parsePositiveInteger(request: NextRequest, key: string) {
  const value = request.nextUrl.searchParams.get(key);
  if (!value) return undefined;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`${key} must be at least 1.`);
  }

  return Math.floor(parsed);
}

async function handleOperationsIssues(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!hasSupabaseServiceRoleEnv()) {
    return NextResponse.json(
      { error: "Supabase service role environment variables are not configured." },
      { status: 500 }
    );
  }

  try {
    const telemetryLimit = parsePositiveInteger(request, "telemetryLimit");
    const threshold = parsePositiveInteger(request, "threshold");
    const result = await syncLookupQualityIssueEvents(createSupabaseServiceRoleClient(), {
      telemetryLimit,
      threshold
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Operations issue sync failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  return handleOperationsIssues(request);
}

export async function POST(request: NextRequest) {
  return handleOperationsIssues(request);
}
