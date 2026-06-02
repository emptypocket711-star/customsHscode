import { describe, expect, it } from "vitest";
import { parseMarketplaceEmailNotificationPreferencesFormData } from "@/features/marketplace-notification-preferences/schemas";

describe("marketplace notification preference actions", () => {
  it("parses checked email preference boxes", () => {
    const formData = new FormData();
    formData.set("initial", "on");

    expect(parseMarketplaceEmailNotificationPreferencesFormData(formData)).toEqual({
      deadlineReminder: false,
      initial: true
    });
  });
});
