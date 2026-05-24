import { createHash } from "node:crypto";

export type PublicDataRequestConfig = {
  endpointUrl: string;
  serviceKey: string;
  serviceKeyParamName?: string;
  params?: Record<string, string | number | null | undefined>;
  timeoutMs?: number;
};

export type PublicDataSnapshot = {
  sourceName: string;
  sourceUrl: string;
  sourceVersion: string;
  retrievedAt: string;
  checksum: string;
  contentType: string | null;
  rawText: string;
};

export function hasPublicDataApiEnv(endpointEnvName: string) {
  return Boolean((process.env.CUSTOMS_API_SERVICE_KEY || process.env.PUBLIC_DATA_SERVICE_KEY) && process.env[endpointEnvName]);
}

export function buildPublicDataUrl(config: PublicDataRequestConfig) {
  const url = new URL(config.endpointUrl);
  url.searchParams.set(config.serviceKeyParamName ?? "serviceKey", config.serviceKey);

  for (const [key, value] of Object.entries(config.params ?? {})) {
    if (value !== null && value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

export function redactServiceKey(url: URL) {
  const redacted = new URL(url.toString());
  for (const key of ["serviceKey", "crkyCn"]) {
    if (redacted.searchParams.has(key)) {
      redacted.searchParams.set(key, "[redacted]");
    }
  }

  return redacted.toString();
}

export function checksumText(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function fetchPublicDataSnapshot(
  config: PublicDataRequestConfig & {
    sourceName: string;
    sourceVersion: string;
  }
): Promise<PublicDataSnapshot> {
  const url = buildPublicDataUrl(config);
  const timeoutMs = config.timeoutMs ?? Number(process.env.PUBLIC_DATA_REQUEST_TIMEOUT_MS || 10000);
  const response = await fetch(url, {
    headers: {
      Accept: "application/json, application/xml, text/xml;q=0.9, */*;q=0.8"
    },
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs)
  });
  const rawText = await response.text();

  if (!response.ok) {
    throw new Error(`공공데이터 API 호출 실패: ${response.status} ${response.statusText}`);
  }

  return {
    sourceName: config.sourceName,
    sourceUrl: redactServiceKey(url),
    sourceVersion: config.sourceVersion,
    retrievedAt: new Date().toISOString(),
    checksum: checksumText(rawText),
    contentType: response.headers.get("content-type"),
    rawText
  };
}
