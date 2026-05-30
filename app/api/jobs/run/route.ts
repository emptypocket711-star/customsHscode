import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceRoleClient, hasSupabaseServiceRoleEnv } from "@/lib/supabase/service-role";
import { createDocumentExtractionJobHandler } from "@/server/jobs/document-extraction-job.handler";
import { createHsBatchLookupJobHandler } from "@/server/jobs/hs-batch-lookup-job.handler";
import { runBackgroundJobBatch } from "@/server/jobs/background-worker.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const secret = process.env.JOB_WORKER_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";

  const authorization = request.headers.get("authorization");
  const workerSecret = request.headers.get("x-job-worker-secret");
  return authorization === `Bearer ${secret}` || workerSecret === secret;
}

export async function POST(request: NextRequest) {
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
  const result = await runBackgroundJobBatch(supabase, {
    workerId,
    limit: 10,
    jobTypes: ["document_extraction", "hs_batch_lookup"],
    handlers: {
      document_extraction: createDocumentExtractionJobHandler(supabase),
      hs_batch_lookup: createHsBatchLookupJobHandler()
    }
  });

  return NextResponse.json(result);
}
