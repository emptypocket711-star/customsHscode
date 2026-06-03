import { afterEach, describe, expect, it } from "vitest";
import {
  envValue,
  isLocalOrAllowedRemoteUrl,
  isLocalUrl,
  isRemoteE2EAllowed,
  mergedEnv,
  parseEnvFile,
  playwrightContextOptions,
  safeOrigin
} from "./completion_preview_e2e_env.mjs";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("completion preview e2e env helpers", () => {
  it("parses simple .env files without exposing comments or quote wrappers", () => {
    const parsed = parseEnvFile(`
# comment
SUPABASE_URL="http://127.0.0.1:54321"
E2E_TEST_PASSWORD='local-password'
EMPTY=
INVALID_LINE
`);

    expect(parsed.get("SUPABASE_URL")).toBe("http://127.0.0.1:54321");
    expect(parsed.get("E2E_TEST_PASSWORD")).toBe("local-password");
    expect(parsed.get("EMPTY")).toBe("");
    expect(parsed.has("INVALID_LINE")).toBe(false);
  });

  it("treats only localhost and 127.0.0.1 URLs as local", () => {
    expect(isLocalUrl("http://localhost:3100")).toBe(true);
    expect(isLocalUrl("http://127.0.0.1:54321")).toBe(true);
    expect(isLocalUrl("https://example.supabase.co")).toBe(false);
    expect(isLocalUrl("not-a-url")).toBe(false);
    expect(isLocalUrl(undefined)).toBe(false);
  });

  it("requires an explicit remote E2E opt-in for non-local URLs", () => {
    expect(isRemoteE2EAllowed("MARKETPLACE_TRANSACTION")).toBe(false);
    expect(isLocalOrAllowedRemoteUrl("https://preview.example", "MARKETPLACE_TRANSACTION")).toBe(false);

    process.env.E2E_ALLOW_REMOTE_MARKETPLACE_TRANSACTION = "true";

    expect(isRemoteE2EAllowed("MARKETPLACE_TRANSACTION")).toBe(true);
    expect(isLocalOrAllowedRemoteUrl("https://preview.example", "MARKETPLACE_TRANSACTION")).toBe(true);
  });

  it("adds Vercel protection headers to Playwright context options without printing the secret", () => {
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET = "bypass-secret";

    expect(playwrightContextOptions({ storageState: "state.json" })).toEqual({
      extraHTTPHeaders: {
        "x-vercel-protection-bypass": "bypass-secret"
      },
      storageState: "state.json"
    });
  });

  it("returns only URL origins for safe diagnostic output", () => {
    expect(safeOrigin("http://localhost:3100/login?token=secret")).toBe("http://localhost:3100");
    expect(safeOrigin("invalid")).toBe("invalid-url");
    expect(safeOrigin(undefined)).toBe("missing");
  });

  it("prefers process env over .env.local entries", () => {
    process.env.SUPABASE_URL = "http://localhost:54321";
    const localEnv = {
      entries: new Map([["SUPABASE_URL", "https://remote.example"]]),
      exists: true
    };

    expect(envValue(localEnv, "SUPABASE_URL")).toBe("http://localhost:54321");
  });

  it("merges file env, process env, and explicit overrides in that order", () => {
    process.env.E2E_BASE_URL = "http://localhost:3000";
    const localEnv = {
      entries: new Map([
        ["E2E_BASE_URL", "https://remote.example"],
        ["E2E_TEST_PASSWORD", "from-file"]
      ]),
      exists: true
    };

    expect(mergedEnv(localEnv, { E2E_BASE_URL: "http://localhost:3100" })).toMatchObject({
      E2E_BASE_URL: "http://localhost:3100",
      E2E_TEST_PASSWORD: "from-file"
    });
  });
});
