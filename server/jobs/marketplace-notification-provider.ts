import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  MarketplaceNotificationSendInput,
  MarketplaceNotificationSender
} from "@/server/jobs/marketplace-notification-worker.service";
import { listMarketplaceNotificationRecipientsForPartner } from "@/server/jobs/marketplace-notification-recipients";
import { sendTransactionalEmail } from "@/server/notifications/email";

export const marketplaceNotificationProviderNames = ["internal_dry_run", "transactional_email"] as const;
export type MarketplaceNotificationProviderName = typeof marketplaceNotificationProviderNames[number];

function notificationKindLabel(kind: MarketplaceNotificationSendInput["target"]["notificationKind"]) {
  if (kind === "deadline_reminder") return "마감 임박";
  return "신규 요청";
}

function requestTypeLabel(type: MarketplaceNotificationSendInput["target"]["requestType"]) {
  return type === "freight" ? "운송 견적" : "통관 의뢰";
}

function buildMarketplaceNotificationEmail(input: MarketplaceNotificationSendInput) {
  return {
    subject: `[HS FINDER] ${requestTypeLabel(input.target.requestType)} 알림: ${notificationKindLabel(input.target.notificationKind)}`,
    text: [
      "HS FINDER 플랫폼 요청 알림입니다.",
      "",
      `요청 유형: ${requestTypeLabel(input.target.requestType)}`,
      `알림 유형: ${notificationKindLabel(input.target.notificationKind)}`,
      `알림 사유: ${input.target.reason}`,
      "",
      "대시보드에서 요청 상세, 질문, 견적 제출 가능 여부를 확인해 주세요.",
      "",
      "이 메일에는 견적 금액, 서류명, 질문/답변 원문, 개인정보를 포함하지 않습니다."
    ].join("\n")
  };
}

export function createMarketplaceNotificationProvider(
  provider: string | undefined,
  options: { supabase?: SupabaseClient } = {}
): MarketplaceNotificationSender | null {
  if (provider === "internal_dry_run") {
    return async (input: MarketplaceNotificationSendInput) => ({
      providerId: `internal_dry_run:${input.target.notificationKind}:${input.deliveryId}`
    });
  }

  if (provider === "transactional_email" && options.supabase) {
    return async (input: MarketplaceNotificationSendInput) => {
      const recipients = await listMarketplaceNotificationRecipientsForPartner(
        options.supabase as SupabaseClient,
        input.target.partnerCompanyId,
        {
          limit: 1,
          requireEmailOptInForKind: input.target.notificationKind
        }
      );
      const recipient = recipients[0];
      if (!recipient) throw new Error("recipient_missing");

      const email = buildMarketplaceNotificationEmail(input);
      const result = await sendTransactionalEmail({
        subject: email.subject,
        text: email.text,
        to: recipient.email
      });

      if (!result.sent) throw new Error(result.message);
      return { providerId: result.providerId ?? `transactional_email:${input.deliveryId}` };
    };
  }

  return null;
}
