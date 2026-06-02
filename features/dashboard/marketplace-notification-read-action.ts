export function parseMarketplaceNotificationReadFormData(formData: FormData) {
  const deliveryId = String(formData.get("deliveryId") ?? "").trim();
  if (!deliveryId) {
    throw new Error("읽음 처리할 알림을 확인할 수 없습니다.");
  }

  return { deliveryId };
}
