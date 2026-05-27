import { createHash } from "node:crypto";
import { createServer } from "node:http";

const PORT = Number(process.env.PORT || 8787);
const API001_ENDPOINT = process.env.CUSTOMS_API_CARGO_PROGRESS_URL
  || "https://unipass.customs.go.kr:38010/ext/rest/cargCsclPrgsInfoQry/retrieveCargCsclPrgsInfo";
const API012_ENDPOINT = process.env.CUSTOMS_API_EXCHANGE_RATE_URL
  || "https://unipass.customs.go.kr:38010/ext/rest/trifFxrtInfoQry/retrieveTrifFxrtInfo";
const API001_KEY = process.env.CUSTOMS_API_CARGO_PROGRESS_SERVICE_KEY;
const API012_KEY = process.env.CUSTOMS_API_EXCHANGE_RATE_SERVICE_KEY || process.env.CUSTOMS_API_SERVICE_KEY;
const CARGO_RELAY_TOKEN = process.env.CUSTOMS_API_CARGO_PROGRESS_RELAY_TOKEN;
const EXCHANGE_RELAY_TOKEN = process.env.CUSTOMS_API_EXCHANGE_RATE_RELAY_TOKEN || CARGO_RELAY_TOKEN;
const TIMEOUT_MS = Number(process.env.PUBLIC_DATA_REQUEST_TIMEOUT_MS || 15000);

function jsonResponse(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 20_000) {
        reject(new Error("request body too large"));
        request.destroy();
      }
    });
    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function isAuthorized(request, token) {
  if (!token) return process.env.NODE_ENV !== "production";
  return request.headers.authorization === `Bearer ${token}`;
}

function buildApi001Url(params) {
  const url = new URL(API001_ENDPOINT);
  url.searchParams.set("crkyCn", API001_KEY);

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== null && value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

function buildApi012Url(params) {
  const url = new URL(API012_ENDPOINT);
  url.searchParams.set("crkyCn", API012_KEY);

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== null && value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

function redactApiKey(url) {
  const redacted = new URL(url.toString());
  redacted.searchParams.set("crkyCn", "[redacted]");
  return redacted.toString();
}

function checksumText(value) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeError(error) {
  const cause = error && typeof error === "object" && "cause" in error ? error.cause : undefined;
  const code = cause && typeof cause === "object" && "code" in cause ? cause.code : undefined;
  const message = error instanceof Error ? error.message : String(error);
  const causeMessage = cause instanceof Error ? cause.message : undefined;
  return [code, causeMessage, message].filter(Boolean).join(" / ");
}

async function handleCargoProgress(request, response) {
  if (!isAuthorized(request, CARGO_RELAY_TOKEN)) {
    jsonResponse(response, 401, { error: "unauthorized" });
    return;
  }

  if (!API001_KEY) {
    jsonResponse(response, 500, { error: "CUSTOMS_API_CARGO_PROGRESS_SERVICE_KEY is not configured." });
    return;
  }

  const payload = await readJsonBody(request);
  const apiUrl = buildApi001Url(payload.params ?? payload);

  let apiResponse;
  try {
    apiResponse = await fetch(apiUrl, {
      headers: {
        accept: "application/xml, text/xml;q=0.9, */*;q=0.8"
      },
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
  } catch (error) {
    jsonResponse(response, 502, {
      error: "api001_fetch_failed",
      detail: normalizeError(error),
      endpoint: `${apiUrl.hostname}:${apiUrl.port || "443"}`
    });
    return;
  }

  const rawText = await apiResponse.text();
  if (!apiResponse.ok) {
    jsonResponse(response, 502, {
      error: "api001_bad_response",
      status: apiResponse.status,
      statusText: apiResponse.statusText,
      rawText: rawText.slice(0, 1000),
      sourceUrl: redactApiKey(apiUrl)
    });
    return;
  }

  jsonResponse(response, 200, {
    rawText,
    sourceUrl: redactApiKey(apiUrl),
    retrievedAt: new Date().toISOString(),
    checksum: checksumText(rawText)
  });
}

async function handleExchangeRate(request, response) {
  if (!isAuthorized(request, EXCHANGE_RELAY_TOKEN)) {
    jsonResponse(response, 401, { error: "unauthorized" });
    return;
  }

  if (!API012_KEY) {
    jsonResponse(response, 500, { error: "CUSTOMS_API_EXCHANGE_RATE_SERVICE_KEY is not configured." });
    return;
  }

  const payload = await readJsonBody(request);
  const apiUrl = buildApi012Url(payload.params ?? payload);

  let apiResponse;
  try {
    apiResponse = await fetch(apiUrl, {
      headers: {
        accept: "application/xml, text/xml;q=0.9, */*;q=0.8"
      },
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
  } catch (error) {
    jsonResponse(response, 502, {
      error: "api012_fetch_failed",
      detail: normalizeError(error),
      endpoint: `${apiUrl.hostname}:${apiUrl.port || "443"}`
    });
    return;
  }

  const rawText = await apiResponse.text();
  if (!apiResponse.ok) {
    jsonResponse(response, 502, {
      error: "api012_bad_response",
      status: apiResponse.status,
      statusText: apiResponse.statusText,
      rawText: rawText.slice(0, 1000),
      sourceUrl: redactApiKey(apiUrl)
    });
    return;
  }

  jsonResponse(response, 200, {
    rawText,
    sourceUrl: redactApiKey(apiUrl),
    retrievedAt: new Date().toISOString(),
    checksum: checksumText(rawText)
  });
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === "GET" && request.url === "/health") {
      jsonResponse(response, 200, { ok: true });
      return;
    }

    if (request.method === "POST" && new URL(request.url ?? "/", "http://localhost").pathname === "/cargo-progress") {
      await handleCargoProgress(request, response);
      return;
    }

    if (request.method === "POST" && new URL(request.url ?? "/", "http://localhost").pathname === "/exchange-rate") {
      await handleExchangeRate(request, response);
      return;
    }

    jsonResponse(response, 404, { error: "not_found" });
  } catch (error) {
    jsonResponse(response, 500, {
      error: "relay_error",
      detail: error instanceof Error ? error.message : "unknown error"
    });
  }
});

server.listen(PORT, () => {
  console.log(`API001 cargo progress relay listening on :${PORT}`);
});
