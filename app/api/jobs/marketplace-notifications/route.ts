import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceRoleClient, hasSupabaseServiceRoleEnv } from "@/lib/supabase/service-role";
import { createMarketplaceNotificationProvider } from "@/server/jobs/marketplace-notification-provider";
import { getMarketplaceNotificationSendReadiness } from "@/server/jobs/marketplace-notification-send-readiness";
import { runMarketplaceNotificationWorker } from "@/server/jobs/marketplace-notification-worker.service";

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

function parseBoolean(value: string | null) {
  return value === "1" || value === "true";
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

function isSendRequested(request: NextRequest) {
  return parseBoolean(request.nextUrl.searchParams.get("send"));
}

async function handleMarketplaceNotifications(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const sendReadiness = getMarketplaceNotificationSendReadiness({
      MARKETPLACE_NOTIFICATIONS_PROVIDER: process.env.MARKETPLACE_NOTIFICATIONS_PROVIDER,
      MARKETPLACE_NOTIFICATIONS_SEND_ENABLED: process.env.MARKETPLACE_NOTIFICATIONS_SEND_ENABLED,
      NOTIFICATION_FROM_EMAIL: process.env.NOTIFICATION_FROM_EMAIL,
      RESEND_API_KEY: process.env.RESEND_API_KEY
    });
    const sendRequested = isSendRequested(request);

    if (sendRequested) {
      if (!sendReadiness.ready) {
        return NextResponse.json(
          { error: "Marketplace notification sending is not ready.", sendReadiness },
          { status: 400 }
        );
      }

    }

    if (!hasSupabaseServiceRoleEnv()) {
      return NextResponse.json(
        { error: "Supabase service role environment variables are not configured.", sendReadiness },
        { status: 500 }
      );
    }

    const supabase = createSupabaseServiceRoleClient();
    const sender = sendRequested
      ? createMarketplaceNotificationProvider(process.env.MARKETPLACE_NOTIFICATIONS_PROVIDER, { supabase })
      : null;

    if (sendRequested && !sender) {
      return NextResponse.json(
        { error: "Marketplace notification provider is not supported.", sendReadiness },
        { status: 400 }
      );
    }

    const result = await runMarketplaceNotificationWorker(supabase, {
      dryRun: parseBoolean(request.nextUrl.searchParams.get("dryRun")),
      limit: parsePositiveInteger(request, "limit"),
      reminderWindowHours: parsePositiveInteger(request, "reminderWindowHours"),
      sender: sender ?? undefined
    });

    return NextResponse.json({ ...result, sendReadiness });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Marketplace notification worker failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  return handleMarketplaceNotifications(request);
}

export async function POST(request: NextRequest) {
  return handleMarketplaceNotifications(request);
}
