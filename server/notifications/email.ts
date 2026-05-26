export type TransactionalEmailResult =
  | { sent: true; providerId?: string }
  | { sent: false; reason: "not_configured" | "request_failed"; message: string };

export function hasTransactionalEmailEnv() {
  return Boolean(process.env.RESEND_API_KEY && process.env.NOTIFICATION_FROM_EMAIL);
}

export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<TransactionalEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;

  if (!apiKey || !from) {
    return {
      sent: false,
      reason: "not_configured",
      message: "RESEND_API_KEY 또는 NOTIFICATION_FROM_EMAIL이 설정되지 않았습니다."
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text
    })
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      sent: false,
      reason: "request_failed",
      message: typeof body?.message === "string" ? body.message : "메일 발송 요청이 실패했습니다."
    };
  }

  return {
    sent: true,
    providerId: typeof body?.id === "string" ? body.id : undefined
  };
}
