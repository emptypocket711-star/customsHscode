import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveRequestLocale, resolveUserLocale } from "@/lib/i18n/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const mocks = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  cookieSet: vi.fn(),
  headerGet: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  hasSupabaseEnv: vi.fn()
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: mocks.cookieGet,
    set: mocks.cookieSet
  })),
  headers: vi.fn(async () => ({
    get: mocks.headerGet
  }))
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
  hasSupabaseEnv: mocks.hasSupabaseEnv
}));

function profileClient(preferredLocale: string | null) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({
            data: { preferred_locale: preferredLocale }
          }))
        }))
      }))
    }))
  };
}

describe("i18n server locale resolution", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("uses locale cookie before accept-language", async () => {
    mocks.cookieGet.mockReturnValue({ value: "en-US" });
    mocks.headerGet.mockReturnValue("ko-KR,ko;q=0.9");

    await expect(resolveRequestLocale()).resolves.toBe("en-US");
  });

  it("uses locale cookie before profile preference for immediate switching", async () => {
    mocks.cookieGet.mockReturnValue({ value: "zh-CN" });
    mocks.hasSupabaseEnv.mockReturnValue(true);

    await expect(resolveUserLocale("user-1")).resolves.toBe("zh-CN");
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("uses profile preference when no locale cookie exists", async () => {
    mocks.cookieGet.mockReturnValue(undefined);
    mocks.headerGet.mockReturnValue("ko-KR,ko;q=0.9");
    mocks.hasSupabaseEnv.mockReturnValue(true);
    mocks.createSupabaseServerClient.mockResolvedValue(profileClient("en-US"));

    await expect(resolveUserLocale("user-1")).resolves.toBe("en-US");
  });

  it("falls back to accept-language when profile has no preference", async () => {
    mocks.cookieGet.mockReturnValue(undefined);
    mocks.headerGet.mockReturnValue("zh-CN,zh;q=0.9");
    mocks.hasSupabaseEnv.mockReturnValue(true);
    mocks.createSupabaseServerClient.mockResolvedValue(profileClient(null));

    await expect(resolveUserLocale("user-1")).resolves.toBe("zh-CN");
  });
});
