import { readFile } from "node:fs/promises";

export const completionPreviewEnvFile = ".env.local";

export function parseEnvFile(text) {
  const entries = new Map();

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const delimiterIndex = line.indexOf("=");
    if (delimiterIndex < 1) continue;

    const key = line.slice(0, delimiterIndex).trim();
    let value = line.slice(delimiterIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    entries.set(key, value);
  }

  return entries;
}

export async function loadEnvFile(filePath = completionPreviewEnvFile) {
  try {
    return {
      entries: parseEnvFile(await readFile(filePath, "utf8")),
      exists: true
    };
  } catch {
    return {
      entries: new Map(),
      exists: false
    };
  }
}

export function envValue(localEnv, key) {
  return process.env[key] || localEnv.entries.get(key);
}

export function mergedEnv(localEnv, overrides = {}) {
  return {
    ...Object.fromEntries(localEnv.entries),
    ...process.env,
    ...overrides
  };
}

export function safeOrigin(value) {
  if (!value) return "missing";

  try {
    return new URL(value).origin;
  } catch {
    return "invalid-url";
  }
}

export function isLocalUrl(value) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return ["localhost", "127.0.0.1"].includes(url.hostname);
  } catch {
    return false;
  }
}

export function isRemoteE2EAllowed(scope) {
  const scopedKey = scope ? `E2E_ALLOW_REMOTE_${scope}` : "";
  return process.env.E2E_ALLOW_REMOTE === "true" || (scopedKey ? process.env[scopedKey] === "true" : false);
}

export function isLocalOrAllowedRemoteUrl(value, scope) {
  return isLocalUrl(value) || isRemoteE2EAllowed(scope);
}

export function remoteE2ERequirement(scope) {
  const scopedKey = scope ? `E2E_ALLOW_REMOTE_${scope}` : "E2E_ALLOW_REMOTE";
  return `remote 실행은 ${scopedKey}=true를 명시해야 합니다.`;
}

export function vercelProtectionHeaders() {
  const protectionBypassSecret =
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET ||
    process.env.VERCEL_PROTECTION_BYPASS_SECRET;

  return protectionBypassSecret
    ? { "x-vercel-protection-bypass": protectionBypassSecret }
    : {};
}

export function playwrightContextOptions(options = {}) {
  const headers = vercelProtectionHeaders();
  if (Object.keys(headers).length === 0) return options;

  return {
    ...options,
    extraHTTPHeaders: {
      ...(options.extraHTTPHeaders || {}),
      ...headers
    }
  };
}

export async function fetchWithTimeout(url, timeoutMs, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        ...(init.headers || {}),
        ...vercelProtectionHeaders()
      },
      redirect: "manual",
      signal: controller.signal
    });
    return {
      ok: response.status >= 200 && response.status < 500,
      status: response.status
    };
  } catch (error) {
    return {
      ok: false,
      status: error instanceof Error ? error.name : "fetch-error"
    };
  } finally {
    clearTimeout(timer);
  }
}
