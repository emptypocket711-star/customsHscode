import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseServiceRoleEnv } from "@/lib/supabase/service-role";
import { refreshTradeNewsCache } from "@/server/services/trade-news-ingestion.service";

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

  const result = await refreshTradeNewsCache();
  return NextResponse.json(result);
}

export async function GET(request: NextRequest) {
  return handleRefresh(request);
}

export async function POST(request: NextRequest) {
  return handleRefresh(request);
}
