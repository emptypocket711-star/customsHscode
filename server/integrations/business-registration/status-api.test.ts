import { afterEach, describe, expect, it, vi } from "vitest";
import { checkBusinessRegistrationStatus } from "@/server/integrations/business-registration/status-api";

describe("business registration status api", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("accepts valid format when external api key is not configured", async () => {
    vi.stubEnv("BUSINESS_REGISTRATION_STATUS_SERVICE_KEY", "");
    vi.stubEnv("PUBLIC_DATA_SERVICE_KEY", "");

    await expect(checkBusinessRegistrationStatus("123-45-67890")).resolves.toMatchObject({
      businessNo: "1234567890",
      configured: false,
      validFormat: true
    });
  });

  it("rejects invalid business number format before api calls", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(checkBusinessRegistrationStatus("123")).resolves.toMatchObject({
      businessNo: "123",
      validFormat: false
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("maps active business status from public data response", async () => {
    vi.stubEnv("BUSINESS_REGISTRATION_STATUS_SERVICE_KEY", "service-key");
    vi.stubEnv("BUSINESS_REGISTRATION_STATUS_LIVE_ENABLED", "true");
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            b_no: "1234567890",
            b_stt: "계속사업자",
            b_stt_cd: "01",
            tax_type: "부가가치세 일반과세자"
          }
        ]
      })
    } as Response);

    await expect(checkBusinessRegistrationStatus("1234567890")).resolves.toMatchObject({
      active: true,
      businessNo: "1234567890",
      configured: true,
      rawStatus: "계속사업자 / 부가가치세 일반과세자",
      validFormat: true
    });
  });

  it("keeps launch signup format-only even if a public data key exists", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    vi.stubEnv("BUSINESS_REGISTRATION_STATUS_SERVICE_KEY", "service-key");
    vi.stubEnv("BUSINESS_REGISTRATION_STATUS_LIVE_ENABLED", "");

    await expect(checkBusinessRegistrationStatus("1234567890")).resolves.toMatchObject({
      businessNo: "1234567890",
      configured: false,
      validFormat: true
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
