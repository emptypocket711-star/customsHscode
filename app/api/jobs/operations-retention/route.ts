import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceRoleClient, hasSupabaseServiceRoleEnv } from "@/lib/supabase/service-role";
import { cleanupOperationsAlertEvents } from "@/server/operations/operations-retention.service";

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

function parseRetentionDays(request: NextRequest) {
  const value = request.nextUrl.searchParams.get("retentionDays");
  if (!value) return undefined;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error("retentionDays must be at least 1.");
  }

  return Math.floor(parsed);
}

async function handleRetention(request: NextRequest) {
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
    const retentionDays = parseRetentionDays(request);
    const result = await cleanupOperationsAlertEvents(createSupabaseServiceRoleClient(), { retentionDays });
    return NextResponse.json({
      kind: "operations_retention",
      operationsAlertEvents: result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Operations retention cleanup failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  return handleRetention(request);
}

export async function POST(request: NextRequest) {
  return handleRetention(request);
}
