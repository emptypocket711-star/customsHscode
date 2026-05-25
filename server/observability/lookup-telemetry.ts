const sensitiveFieldPattern = /(query|product|name|text|email|phone|address|raw|input|prompt|content|document|invoice|password|token|key)/i;

export type LookupTelemetryPayload = Record<string, string | number | boolean | null | undefined>;

export function lookupTelemetryEnabled() {
  return process.env.LOOKUP_TELEMETRY_ENABLED === "1" || process.env.LOOKUP_TELEMETRY_ENABLED === "true";
}

export function sanitizeLookupTelemetryPayload(payload: LookupTelemetryPayload) {
  return Object.fromEntries(
    Object.entries(payload)
      .filter(([key, value]) => value !== undefined && !sensitiveFieldPattern.test(key))
      .map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 120) : value])
  );
}

export function logLookupTelemetry(event: string, payload: LookupTelemetryPayload = {}) {
  if (!lookupTelemetryEnabled()) return;
  console.info("[lookup-telemetry]", event, sanitizeLookupTelemetryPayload(payload));
}

export function productInputShape(input: {
  productName?: string;
  productUsage?: string | null;
  material?: string | null;
  composition?: string | null;
  functions?: string | null;
  modelName?: string | null;
}) {
  const productName = input.productName?.trim() ?? "";
  const tokenCount = productName ? productName.split(/\s+/).filter(Boolean).length : 0;
  const hasDigits = /\d/.test(productName);
  const hasHangul = /[가-힣]/.test(productName);
  const hasLatin = /[a-z]/i.test(productName);
  const hasCjk = /[\u3400-\u9fff]/.test(productName);
  const hasCyrillic = /[\u0400-\u04ff]/.test(productName);

  return {
    productNameLength: productName.length,
    tokenCount,
    hasDigits,
    hasHangul,
    hasLatin,
    hasCjk,
    hasCyrillic,
    hasUsage: Boolean(input.productUsage?.trim()),
    hasMaterial: Boolean(input.material?.trim()),
    hasComposition: Boolean(input.composition?.trim()),
    hasFunctions: Boolean(input.functions?.trim()),
    hasModelName: Boolean(input.modelName?.trim())
  };
}

