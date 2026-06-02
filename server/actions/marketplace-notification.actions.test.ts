import { describe, expect, it } from "vitest";
import { parseMarketplaceNotificationReadFormData } from "@/features/dashboard/marketplace-notification-read-action";

describe("marketplace notification actions", () => {
  it("parses the delivery id for read actions", () => {
    const formData = new FormData();
    formData.set("deliveryId", "delivery-1");

    expect(parseMarketplaceNotificationReadFormData(formData)).toEqual({
      deliveryId: "delivery-1"
    });
  });

  it("rejects read actions without a delivery id", () => {
    expect(() => parseMarketplaceNotificationReadFormData(new FormData())).toThrow("읽음 처리할 알림");
  });
});
