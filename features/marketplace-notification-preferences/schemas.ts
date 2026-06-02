import { z } from "zod";

export const marketplaceEmailNotificationPreferencesSchema = z.object({
  deadlineReminder: z.boolean().default(false),
  initial: z.boolean().default(false)
});

export type MarketplaceEmailNotificationPreferencesInput = z.infer<
  typeof marketplaceEmailNotificationPreferencesSchema
>;

export type MarketplaceEmailNotificationPreferencesActionState = {
  message?: string;
  status: "error" | "idle" | "success";
};

function booleanValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export function parseMarketplaceEmailNotificationPreferencesFormData(formData: FormData) {
  return marketplaceEmailNotificationPreferencesSchema.parse({
    deadlineReminder: booleanValue(formData, "deadlineReminder"),
    initial: booleanValue(formData, "initial")
  });
}
