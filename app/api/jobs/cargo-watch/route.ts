import { NextResponse, type NextRequest } from "next/server";
import { buildCargoWatchEmailText, cargoWatchStatusDisplay } from "@/lib/cargo-watch-status";
import { createSupabaseServiceRoleClient, hasSupabaseServiceRoleEnv } from "@/lib/supabase/service-role";
import {
  buildCustomsCargoProgressQuery,
  fetchCustomsCargoProgressSnapshot,
  hasCustomsOpenApiEnv,
  parseCustomsCargoProgressXml
} from "@/server/integrations/customs/customs-api";
import { sendTransactionalEmail } from "@/server/notifications/email";
import {
  buildCargoStatusCandidates,
  loadCargoShedInfoByCode,
  statusMatched
} from "@/server/services/cargo-status-classifier";

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

function normalizeCargoWatchValue(value: string | null | undefined) {
  return (value ?? "").trim().toUpperCase();
}

function cargoWatchIdentity(row: {
  cargo_management_no?: string | null;
  master_bl_no?: string | null;
  house_bl_no?: string | null;
  bl_year?: string | null;
  target_status?: string | null;
  notify_email?: string | null;
}) {
  return [
    normalizeCargoWatchValue(row.cargo_management_no),
    normalizeCargoWatchValue(row.master_bl_no),
    normalizeCargoWatchValue(row.house_bl_no),
    normalizeCargoWatchValue(row.bl_year),
    normalizeCargoWatchValue(row.target_status),
    normalizeCargoWatchValue(row.notify_email).toLowerCase()
  ].join("|");
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.JOB_WORKER_SECRET || process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";

  const authorization = request.headers.get("authorization");
  const workerSecret = request.headers.get("x-job-worker-secret");
  const querySecret = request.nextUrl.searchParams.get("secret");

  return authorization === `Bearer ${secret}` || workerSecret === secret || querySecret === secret;
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
  const notifiedKeys = new Set<string>();

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
      const shedInfoByCode = result ? await loadCargoShedInfoByCode(supabase, result.events) : new Map();
      const statusCandidates = result
        ? buildCargoStatusCandidates(result, shedInfoByCode)
        : { currentStatus: "", displayCurrentStatus: "", eventStatuses: [] };
      const isMatched = statusMatched({
        targetStatus: row.target_status,
        currentStatus: statusCandidates.currentStatus,
        eventStatuses: statusCandidates.eventStatuses
      });

      if (!isMatched) {
        await supabase
          .from("cargo_watch_requests")
          .update({
            last_status: statusCandidates.displayCurrentStatus || statusCandidates.currentStatus || null,
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
      const rowWatchKey = cargoWatchIdentity(row);
      if (notifiedKeys.has(rowWatchKey)) {
        await supabase
          .from("cargo_watch_requests")
          .update({
            status: "matched",
            last_status: statusCandidates.displayCurrentStatus || statusCandidates.currentStatus || row.target_status,
            last_checked_at: new Date().toISOString(),
            matched_at: new Date().toISOString(),
            notified_at: new Date().toISOString(),
            next_check_at: null,
            last_error: "동일 감시 조건의 중복 등록 건으로 메일 발송을 생략했습니다.",
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

      const lookupValue = row.cargo_management_no || row.house_bl_no || row.master_bl_no || "등록 화물";
      const targetStatusLabel = cargoWatchStatusDisplay(row.target_status);
      const mailResult = await sendTransactionalEmail({
        to: row.notify_email,
        subject: `[HS Finder] ${lookupValue} ${targetStatusLabel} 상태 알림`,
        text: buildCargoWatchEmailText({
          lookupValue,
          targetStatus: row.target_status,
          currentStatus: statusCandidates.displayCurrentStatus || statusCandidates.currentStatus || row.target_status
        })
      });

      if (mailResult.sent) {
        notified += 1;
        notifiedKeys.add(rowWatchKey);
      } else {
        failed += 1;
      }

      await supabase
        .from("cargo_watch_requests")
        .update({
          status: mailResult.sent ? "matched" : "active",
          last_status: statusCandidates.displayCurrentStatus || statusCandidates.currentStatus || row.target_status,
          last_checked_at: new Date().toISOString(),
          matched_at: mailResult.sent ? new Date().toISOString() : null,
          notified_at: mailResult.sent ? new Date().toISOString() : null,
          next_check_at: mailResult.sent ? null : nextCheckAt,
          last_error: mailResult.sent ? null : `목표 상태 도달 확인, 메일 발송 실패: ${mailResult.message}`,
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
