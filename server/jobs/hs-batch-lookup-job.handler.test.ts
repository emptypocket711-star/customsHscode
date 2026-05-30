import { describe, expect, it, vi } from "vitest";
import type { BackgroundJobRecord } from "@/server/repositories/background-job.repository";

const { runHsBatchLookupRowsMock } = vi.hoisted(() => ({
  runHsBatchLookupRowsMock: vi.fn()
}));

vi.mock("@/server/actions/hs-batch.actions", () => ({
  runHsBatchLookupRows: runHsBatchLookupRowsMock
}));

import { createHsBatchLookupJobHandler } from "./hs-batch-lookup-job.handler";

function mockJob(payload: Record<string, unknown>): BackgroundJobRecord {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    company_id: "00000000-0000-0000-0000-000000000002",
    created_by: "00000000-0000-0000-0000-000000000003",
    job_type: "hs_batch_lookup",
    status: "queued",
    priority: 80,
    payload,
    result: {},
    error_message: null,
    attempts: 0,
    max_attempts: 2,
    available_at: "2026-05-30T00:00:00Z",
    created_at: "2026-05-30T00:00:00Z",
    updated_at: "2026-05-30T00:00:00Z"
  };
}

describe("createHsBatchLookupJobHandler", () => {
  it("runs queued HS batch rows and stores source-locked preliminary results", async () => {
    runHsBatchLookupRowsMock.mockResolvedValueOnce({
      summary: { total: 1, success: 1, warning: 0, error: 0 },
      results: [
        {
          rowNumber: 1,
          status: "success",
          message: "조회기준일 2026-05-30 기준 예비 조회"
        }
      ]
    });

    const handler = createHsBatchLookupJobHandler();
    const result = await handler(mockJob({
      kind: "hs_batch_lookup",
      basisDate: "2026-05-30",
      destinationCountry: "CHN",
      rows: [
        { rowNumber: 1, hskCode: "3304991000", productName: "기초화장품", memo: "" }
      ]
    }));

    expect(runHsBatchLookupRowsMock).toHaveBeenCalledWith({
      basisDate: "2026-05-30",
      destinationCountry: "CHN",
      rows: [
        { rowNumber: 1, hskCode: "3304991000", productName: "기초화장품", memo: "" }
      ]
    });
    expect(result.result).toMatchObject({
      kind: "hs_batch_lookup",
      basisDate: "2026-05-30",
      destinationCountry: "CHN",
      rowCount: 1,
      summary: { total: 1, success: 1, warning: 0, error: 0 }
    });
    expect(JSON.stringify(result.result)).toContain("예비 조회");
  });

  it("rejects jobs without company scope", async () => {
    const handler = createHsBatchLookupJobHandler();
    const job = mockJob({ kind: "hs_batch_lookup", basisDate: "2026-05-30", rows: [] });
    job.company_id = null;

    await expect(handler(job)).rejects.toThrow("company_id");
  });
});
