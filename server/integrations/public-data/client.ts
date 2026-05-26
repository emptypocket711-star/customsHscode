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

export type PublicDataFetchFailureCategory =
  | "timeout"
  | "dns"
  | "tls"
  | "outbound_port"
  | "network"
  | "unknown";

export class PublicDataFetchError extends Error {
  category: PublicDataFetchFailureCategory;
  endpointHost: string;
  endpointPort: string;
  causeCode?: string;
  causeMessage?: string;

  constructor(input: {
    category: PublicDataFetchFailureCategory;
    endpointHost: string;
    endpointPort: string;
    causeCode?: string;
    causeMessage?: string;
  }) {
    super("공공데이터 API 네트워크 호출에 실패했습니다.");
    this.name = "PublicDataFetchError";
    this.category = input.category;
    this.endpointHost = input.endpointHost;
    this.endpointPort = input.endpointPort;
    this.causeCode = input.causeCode;
    this.causeMessage = input.causeMessage;
  }
}

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

function errorCause(error: unknown) {
  if (!error || typeof error !== "object") return undefined;
  return "cause" in error ? (error as { cause?: unknown }).cause : undefined;
}

function errorCode(error: unknown) {
  if (!error || typeof error !== "object") return undefined;
  const code = "code" in error ? (error as { code?: unknown }).code : undefined;
  return typeof code === "string" ? code : undefined;
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : undefined;
}

function classifyFetchFailure(error: unknown, url: URL): PublicDataFetchFailureCategory {
  const cause = errorCause(error);
  const code = errorCode(cause) ?? errorCode(error);
  const message = `${errorMessage(error) ?? ""} ${errorMessage(cause) ?? ""}`.toLowerCase();

  if (error instanceof DOMException && error.name === "TimeoutError") return "timeout";
  if (message.includes("timeout") || code === "UND_ERR_CONNECT_TIMEOUT" || code === "ETIMEDOUT") return "timeout";
  if (code === "ENOTFOUND" || code === "EAI_AGAIN" || message.includes("dns")) return "dns";
  if (code?.includes("CERT") || code?.includes("TLS") || message.includes("certificate") || message.includes("tls")) return "tls";
  if (url.port && (code === "ECONNREFUSED" || code === "ECONNRESET" || code === "UND_ERR_SOCKET")) return "outbound_port";
  if (message.includes("fetch failed") || code) return "network";
  return "unknown";
}

export async function fetchPublicDataSnapshot(
  config: PublicDataRequestConfig & {
    sourceName: string;
    sourceVersion: string;
  }
): Promise<PublicDataSnapshot> {
  const url = buildPublicDataUrl(config);
  const timeoutMs = config.timeoutMs ?? Number(process.env.PUBLIC_DATA_REQUEST_TIMEOUT_MS || 10000);
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json, application/xml, text/xml;q=0.9, */*;q=0.8"
      },
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (error) {
    const cause = errorCause(error);
    throw new PublicDataFetchError({
      category: classifyFetchFailure(error, url),
      endpointHost: url.hostname,
      endpointPort: url.port || (url.protocol === "https:" ? "443" : "80"),
      causeCode: errorCode(cause) ?? errorCode(error),
      causeMessage: errorMessage(cause) ?? errorMessage(error)
    });
  }
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
