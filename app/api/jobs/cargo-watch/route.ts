import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceRoleClient, hasSupabaseServiceRoleEnv } from "@/lib/supabase/service-role";
import {
  buildCustomsCargoProgressQuery,
  fetchCustomsCargoProgressSnapshot,
  hasCustomsOpenApiEnv,
  parseCustomsCargoProgressXml
} from "@/server/integrations/customs/customs-api";
import { sendTransactionalEmail } from "@/server/notifications/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CargoWatchRow = {
  id: string;
  cargo_management_no: string | null;
  master_bl_no: string | null;
  house_bl_no: string | null;
  bl_year: string | null;
  target_status: string;
  notify_email: string;
  poll_interval_seconds: number;
};

function isAuthorized(request: NextRequest) {
  const secret = process.env.JOB_WORKER_SECRET || process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";

  const authorization = request.headers.get("authorization");
  const workerSecret = request.headers.get("x-job-worker-secret");
  const querySecret = request.nextUrl.searchParams.get("secret");

  return authorization === `Bearer ${secret}` || workerSecret === secret || querySecret === secret;
}

function statusMatched(input: { targetStatus: string; currentStatus: string; eventStatuses: string[] }) {
  const target = input.targetStatus.trim();
  if (!target) return false;

  const candidates = [input.currentStatus, ...input.eventStatuses]
    .map((value) => value.trim())
    .filter(Boolean);

  return candidates.some((value) => value === target || value.includes(target));
}

async function processCargoWatches(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!hasSupabaseServiceRoleEnv()) {
    return NextResponse.json({ error: "Supabase service role environment variables are not configured." }, { status: 500 });
  }

  if (!hasCustomsOpenApiEnv("cargo_progress")) {
    return NextResponse.json({ error: "API001 cargo progress environment variables are not configured." }, { status: 500 });
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("cargo_watch_requests")
    .select("id,cargo_management_no,master_bl_no,house_bl_no,bl_year,target_status,notify_email,poll_interval_seconds")
    .eq("status", "active")
    .lte("next_check_at", new Date().toISOString())
    .order("next_check_at", { ascending: true })
    .limit(25);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as CargoWatchRow[];
  let checked = 0;
  let matched = 0;
  let notified = 0;
  let failed = 0;

  for (const row of rows) {
    checked += 1;
    const nextCheckAt = new Date(Date.now() + Math.max(row.poll_interval_seconds || 60, 60) * 1000).toISOString();

    try {
      const snapshot = await fetchCustomsCargoProgressSnapshot(
        buildCustomsCargoProgressQuery({
          cargoManagementNo: row.cargo_management_no ?? undefined,
          masterBlNo: row.master_bl_no ?? undefined,
          houseBlNo: row.house_bl_no ?? undefined,
          blYear: row.bl_year ?? undefined
        }),
        { timeoutMs: 15000 }
      );
      const result = parseCustomsCargoProgressXml(snapshot.rawText);
      const currentStatus = result?.summary.progressStatus || result?.events[0]?.status || "";
      const eventStatuses = result?.events.map((event) => event.status).filter(Boolean) ?? [];
      const isMatched = statusMatched({
        targetStatus: row.target_status,
        currentStatus,
        eventStatuses
      });

      if (!isMatched) {
        await supabase
          .from("cargo_watch_requests")
          .update({
            last_status: currentStatus || null,
            last_checked_at: new Date().toISOString(),
            next_check_at: nextCheckAt,
            last_error: null,
            source_name: snapshot.sourceName,
            source_url: snapshot.sourceUrl,
            source_version: snapshot.sourceVersion,
            retrieved_at: snapshot.retrievedAt,
            checksum: snapshot.checksum,
            updated_at: new Date().toISOString()
          })
          .eq("id", row.id);
        continue;
      }

      matched += 1;
      const lookupValue = row.cargo_management_no || row.house_bl_no || row.master_bl_no || "등록 화물";
      const mailResult = await sendTransactionalEmail({
        to: row.notify_email,
        subject: `[HS Finder] ${lookupValue} ${row.target_status} 상태 알림`,
        text: [
          "등록하신 적하목록 감시 대상이 지정한 상태에 도달했습니다.",
          "",
          `조회값: ${lookupValue}`,
          `목표 상태: ${row.target_status}`,
          `현재 상태: ${currentStatus || row.target_status}`,
          "",
          "통관 준비가 필요한 건인지 확인해 주세요."
        ].join("\n")
      });

      if (mailResult.sent) notified += 1;

      await supabase
        .from("cargo_watch_requests")
        .update({
          status: "matched",
          last_status: currentStatus || row.target_status,
          last_checked_at: new Date().toISOString(),
          matched_at: new Date().toISOString(),
          notified_at: mailResult.sent ? new Date().toISOString() : null,
          last_error: mailResult.sent ? null : mailResult.message,
          source_name: snapshot.sourceName,
          source_url: snapshot.sourceUrl,
          source_version: snapshot.sourceVersion,
          retrieved_at: snapshot.retrievedAt,
          checksum: snapshot.checksum,
          updated_at: new Date().toISOString()
        })
        .eq("id", row.id);
    } catch (error) {
      failed += 1;
      await supabase
        .from("cargo_watch_requests")
        .update({
          last_checked_at: new Date().toISOString(),
          next_check_at: nextCheckAt,
          last_error: error instanceof Error ? error.message : "화물 감시 작업 중 오류가 발생했습니다.",
          updated_at: new Date().toISOString()
        })
        .eq("id", row.id);
    }
  }

  return NextResponse.json({ checked, matched, notified, failed });
}

export async function GET(request: NextRequest) {
  return processCargoWatches(request);
}

export async function POST(request: NextRequest) {
  return processCargoWatches(request);
}
