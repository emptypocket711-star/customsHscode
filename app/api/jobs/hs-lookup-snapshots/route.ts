import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceRoleClient, hasSupabaseServiceRoleEnv } from "@/lib/supabase/service-role";

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

async function handleRefresh(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!hasSupabaseServiceRoleEnv()) {
    return NextResponse.json({ error: "Supabase service role environment variables are not configured." }, { status: 500 });
  }

  const startedAt = Date.now();
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.rpc("refresh_hs_lookup_snapshots");

  if (error) {
    return NextResponse.json({
      error: error.message,
      durationMs: Date.now() - startedAt
    }, { status: 500 });
  }

  const { data: coverage } = await supabase
    .from("hsk_lookup_snapshot")
    .select("snapshot_basis_date")
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    refreshed: true,
    snapshotBasisDate: coverage?.snapshot_basis_date ?? null,
    durationMs: Date.now() - startedAt
  });
}

export async function GET(request: NextRequest) {
  return handleRefresh(request);
}

export async function POST(request: NextRequest) {
  return handleRefresh(request);
}
