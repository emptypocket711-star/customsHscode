"use server";

import { revalidatePath } from "next/cache";
import { parseMarketplaceNotificationReadFormData } from "@/features/dashboard/marketplace-notification-read-action";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { markMarketplaceNotificationDeliveryRead } from "@/server/repositories/marketplace-notification-deliveries.repository";

export async function markMarketplaceNotificationReadAction(formData: FormData) {
  const { deliveryId } = parseMarketplaceNotificationReadFormData(formData);
  const supabase = await createSupabaseServerClient();
  await markMarketplaceNotificationDeliveryRead(supabase, deliveryId);
  revalidatePath("/dashboard");
}
