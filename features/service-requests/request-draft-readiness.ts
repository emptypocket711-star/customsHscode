export type DraftReadinessItem = {
  helper?: string;
  label: string;
  required?: boolean;
  value?: boolean | number | string | null;
};

export type DraftReadinessSummary = {
  missingRecommended: DraftReadinessItem[];
  missingRequired: DraftReadinessItem[];
  recommendedCount: number;
  requiredCount: number;
  satisfiedRecommendedCount: number;
  satisfiedRequiredCount: number;
};

export function hasDraftValue(value: DraftReadinessItem["value"]) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) && value > 0;
  return Boolean(value?.trim());
}

export function summarizeDraftReadiness(items: DraftReadinessItem[]): DraftReadinessSummary {
  const requiredItems = items.filter((item) => item.required);
  const recommendedItems = items.filter((item) => !item.required);
  const missingRequired = requiredItems.filter((item) => !hasDraftValue(item.value));
  const missingRecommended = recommendedItems.filter((item) => !hasDraftValue(item.value));

  return {
    missingRecommended,
    missingRequired,
    recommendedCount: recommendedItems.length,
    requiredCount: requiredItems.length,
    satisfiedRecommendedCount: recommendedItems.length - missingRecommended.length,
    satisfiedRequiredCount: requiredItems.length - missingRequired.length
  };
}
