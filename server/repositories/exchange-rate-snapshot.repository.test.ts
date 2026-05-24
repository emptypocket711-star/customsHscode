import { describe, expect, it, vi } from "vitest";
import {
  recordExchangeRateSourceSnapshot,
  recordExchangeRateSourceSnapshotRpcName
} from "@/server/repositories/exchange-rate-snapshot.repository";

describe("exchange rate snapshot repository", () => {
  it("records API012 snapshot metadata through the constrained rpc", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "00000000-0000-0000-0000-000000000012", error: null });
    const snapshotId = await recordExchangeRateSourceSnapshot({ rpc } as never, {
      effectiveFrom: "2026-05-24",
      snapshot: {
        sourceName: "관세청 관세환율 정보",
        sourceUrl: "https://example.test/exchange?crkyCn=%5Bredacted%5D",
        sourceVersion: "myc-openapi-api012-v1.0",
        retrievedAt: "2026-05-24T00:00:00.000Z",
        checksum: "checksum",
        contentType: "application/xml",
        rawText: "<xml />"
      }
    });

    expect(snapshotId).toBe("00000000-0000-0000-0000-000000000012");
    expect(rpc).toHaveBeenCalledWith(recordExchangeRateSourceSnapshotRpcName, {
      p_source_name: "관세청 관세환율 정보",
      p_source_url: "https://example.test/exchange?crkyCn=%5Bredacted%5D",
      p_source_version: "myc-openapi-api012-v1.0",
      p_effective_from: "2026-05-24",
      p_retrieved_at: "2026-05-24T00:00:00.000Z",
      p_checksum: "checksum"
    });
  });
});
