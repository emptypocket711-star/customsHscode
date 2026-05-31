import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseServiceRoleEnv } from "@/lib/supabase/service-role";
import { hasCustomsOpenApiEnv } from "@/server/integrations/customs/customs-api";
import { logProtectedJobEvent } from "@/server/observability/protected-job-events";
import { refreshCustomsExchangeRateCache } from "@/server/services/exchange-rate-cache.service";

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
  const startedAt = Date.now();
  const route = "/api/jobs/exchange-rates";
  const jobName = "exchange-rates";

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!hasSupabaseServiceRoleEnv()) {
    await logProtectedJobEvent({
      durationMs: Date.now() - startedAt,
      jobName,
      message: "Supabase service role environment variables are not configured.",
      route,
      status: "failed"
    });
    return NextResponse.json({ error: "Supabase service role environment variables are not configured." }, { status: 500 });
  }

  if (!hasCustomsOpenApiEnv("exchange_rate")) {
    await logProtectedJobEvent({
      durationMs: Date.now() - startedAt,
      jobName,
      message: "API012 exchange-rate environment variables are not configured.",
      route,
      status: "failed"
    });
    return NextResponse.json({ error: "API012 exchange-rate environment variables are not configured." }, { status: 500 });
  }

  const basisDate = request.nextUrl.searchParams.get("basisDate") || undefined;
  try {
    const result = await refreshCustomsExchangeRateCache(basisDate);
    await logProtectedJobEvent({
      durationMs: Date.now() - startedAt,
      jobName,
      metadata: {
        basisDate: result.basisDate,
        resultCount: result.results.length,
        upserted: result.results.reduce((sum, item) => sum + item.upserted, 0)
      },
      route,
      status: "succeeded"
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "API012 exchange-rate refresh failed.";
    await logProtectedJobEvent({
      durationMs: Date.now() - startedAt,
      jobName,
      message,
      route,
      status: "failed"
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleRefresh(request);
}

export async function POST(request: NextRequest) {
  return handleRefresh(request);
}
