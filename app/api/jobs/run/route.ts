import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceRoleClient, hasSupabaseServiceRoleEnv } from "@/lib/supabase/service-role";
import { createDocumentExtractionJobHandler } from "@/server/jobs/document-extraction-job.handler";
import { createHsBatchLookupJobHandler } from "@/server/jobs/hs-batch-lookup-job.handler";
import { runBackgroundJobBatch } from "@/server/jobs/background-worker.service";
import { recordBackgroundJobRun } from "@/server/repositories/background-job.repository";

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

async function handleRun(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!hasSupabaseServiceRoleEnv()) {
    return NextResponse.json(
      { error: "Supabase service role environment variables are not configured." },
      { status: 500 }
    );
  }

  const supabase = createSupabaseServiceRoleClient();
  const workerId = request.headers.get("x-worker-id") ?? `api-worker-${process.pid}`;
  const startedAt = Date.now();

  try {
    const result = await runBackgroundJobBatch(supabase, {
      workerId,
      limit: 10,
      jobTypes: ["document_extraction", "hs_batch_lookup"],
      handlers: {
        document_extraction: createDocumentExtractionJobHandler(supabase),
        hs_batch_lookup: createHsBatchLookupJobHandler()
      }
    });

    const succeededCount = result.outcomes.filter((outcome) => outcome.status === "succeeded").length;
    const failedCount = result.outcomes.filter((outcome) => outcome.status === "failed").length;
    await recordBackgroundJobRun(supabase, {
      workerId,
      status: failedCount > 0 ? "failed" : "succeeded",
      claimedCount: result.claimed,
      succeededCount,
      failedCount,
      durationMs: Date.now() - startedAt,
      errorMessage: failedCount > 0 ? "One or more background jobs failed." : null,
      result: result as unknown as Record<string, unknown>
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Background worker failed";
    await recordBackgroundJobRun(supabase, {
      workerId,
      status: "failed",
      claimedCount: 0,
      succeededCount: 0,
      failedCount: 0,
      durationMs: Date.now() - startedAt,
      errorMessage: message,
      result: { error: message }
    }).catch(() => undefined);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleRun(request);
}

export async function POST(request: NextRequest) {
  return handleRun(request);
}
