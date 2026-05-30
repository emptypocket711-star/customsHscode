import { describe, expect, it, vi } from "vitest";
import {
  claimBackgroundJobsRpcName,
  createDocumentExtractionJobPayload,
  createHsBatchLookupJobPayload,
  isBackgroundQueueEnabled,
  listRecentHsBatchLookupJobs,
  summarizeBackgroundJobRuns,
  summarizeBackgroundJobOperations,
  summarizeOperationsAlertEvents,
  type BackgroundJobRunItem,
  type BackgroundJobOperationsItem,
  type OperationsAlertEventItem
} from "@/server/repositories/background-job.repository";

describe("background job repository helpers", () => {
  it("creates document extraction payload without storing raw document text", () => {
    const payload = createDocumentExtractionJobPayload({
      documentId: "00000000-0000-0000-0000-000000000001",
      requestId: "00000000-0000-0000-0000-000000000002",
      storageBucket: "case-documents",
      storagePath: "company/request/file.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      fileName: "invoice.xlsx"
    });

    expect(payload).toMatchObject({
      kind: "uploaded_document",
      documentId: "00000000-0000-0000-0000-000000000001",
      storageBucket: "case-documents"
    });
    expect(JSON.stringify(payload)).not.toContain("Unit Price");
    expect(JSON.stringify(payload)).not.toContain("rawText");
  });

  it("uses the constrained claim RPC", () => {
    expect(claimBackgroundJobsRpcName).toBe("claim_background_jobs");
  });

  it("creates HS batch lookup payload without raw document text", () => {
    const payload = createHsBatchLookupJobPayload({
      basisDate: "2026-05-30",
      destinationCountry: "CHN",
      rows: [
        { rowNumber: 1, hskCode: "3304991000", productName: "기초화장품", memo: "샘플" }
      ]
    });

    expect(payload).toMatchObject({
      kind: "hs_batch_lookup",
      basisDate: "2026-05-30",
      destinationCountry: "CHN",
      rows: [
        { rowNumber: 1, hskCode: "3304991000", productName: "기초화장품", memo: "샘플" }
      ]
    });
    expect(JSON.stringify(payload)).not.toContain("rawText");
    expect(JSON.stringify(payload)).not.toContain("Unit Price");
  });

  it("keeps the background queue opt-in until a worker is deployed", () => {
    const original = process.env.BACKGROUND_JOBS_ENABLED;
    process.env.BACKGROUND_JOBS_ENABLED = "";
    expect(isBackgroundQueueEnabled()).toBe(false);
    process.env.BACKGROUND_JOBS_ENABLED = "true";
    expect(isBackgroundQueueEnabled()).toBe(true);
    process.env.BACKGROUND_JOBS_ENABLED = original;
  });

  it("summarizes failed and retry-waiting jobs for operations", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const past = new Date(Date.now() - 60_000).toISOString();
    const base = {
      id: "00000000-0000-0000-0000-000000000001",
      jobType: "document_extraction",
      attempts: 0,
      maxAttempts: 3,
      errorMessage: null,
      createdAt: past,
      updatedAt: past
    } satisfies Omit<BackgroundJobOperationsItem, "status" | "availableAt">;

    expect(summarizeBackgroundJobOperations([
      { ...base, id: "00000000-0000-0000-0000-000000000001", status: "queued", availableAt: past },
      { ...base, id: "00000000-0000-0000-0000-000000000002", status: "running", availableAt: past },
      { ...base, id: "00000000-0000-0000-0000-000000000003", status: "failed", attempts: 1, availableAt: future },
      { ...base, id: "00000000-0000-0000-0000-000000000004", status: "dead", attempts: 3, availableAt: past }
    ])).toMatchObject({
      total: 4,
      queued: 1,
      running: 1,
      failed: 1,
      retryWaiting: 1,
      dead: 1
    });
  });

  it("summarizes background worker run history", () => {
    const base = {
      id: "00000000-0000-0000-0000-000000000101",
      workerId: "api-worker-test",
      route: "/api/jobs/run",
      durationMs: 1200,
      errorMessage: null,
      createdAt: "2026-05-30T00:02:00Z"
    } satisfies Omit<BackgroundJobRunItem, "status" | "claimedCount" | "succeededCount" | "failedCount">;

    expect(summarizeBackgroundJobRuns([
      { ...base, status: "succeeded", claimedCount: 2, succeededCount: 2, failedCount: 0 },
      {
        ...base,
        id: "00000000-0000-0000-0000-000000000102",
        status: "failed",
        claimedCount: 1,
        succeededCount: 0,
        failedCount: 1,
        errorMessage: "One or more background jobs failed.",
        createdAt: "2026-05-30T00:01:00Z"
      }
    ])).toEqual({
      total: 2,
      succeededRuns: 1,
      failedRuns: 1,
      claimedJobs: 3,
      succeededJobs: 2,
      failedJobs: 1,
      latestRunAt: "2026-05-30T00:02:00Z",
      latestStatus: "succeeded"
    });
  });

  it("summarizes operations alert events for dedupe visibility", () => {
    const base = {
      id: "00000000-0000-0000-0000-000000000201",
      alertType: "background_job_failure",
      alertKey: "background_job_failure:jobs:test",
      recipient: "ops@example.test",
      providerId: null,
      reason: null,
      message: null,
      createdAt: "2026-05-30T00:03:00Z"
    } satisfies Omit<OperationsAlertEventItem, "status">;

    expect(summarizeOperationsAlertEvents([
      { ...base, status: "sent", providerId: "email-1" },
      {
        ...base,
        id: "00000000-0000-0000-0000-000000000202",
        status: "skipped",
        reason: "throttled",
        createdAt: "2026-05-30T00:02:00Z"
      },
      {
        ...base,
        id: "00000000-0000-0000-0000-000000000203",
        status: "failed",
        reason: "provider_error",
        createdAt: "2026-05-30T00:01:00Z"
      }
    ])).toEqual({
      total: 3,
      sent: 1,
      skipped: 1,
      failed: 1,
      latestAlertAt: "2026-05-30T00:03:00Z",
      latestStatus: "sent"
    });
  });

  it("lists recent HS batch lookup jobs with downloadable result metadata", async () => {
    const builder = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn()
    };
    builder.select.mockReturnValue(builder);
    builder.eq.mockReturnValue(builder);
    builder.order.mockReturnValue(builder);
    builder.limit.mockResolvedValue({
      data: [
        {
          id: "00000000-0000-0000-0000-000000000010",
          status: "succeeded",
          payload: {
            kind: "hs_batch_lookup",
            basisDate: "2026-05-30",
            destinationCountry: "CHN",
            rows: [{ rowNumber: 1, hskCode: "3304991000", productName: "기초화장품", memo: "" }]
          },
          result: {
            kind: "hs_batch_lookup",
            basisDate: "2026-05-30",
            destinationCountry: "CHN",
            rowCount: 1,
            summary: { total: 1, success: 1, warning: 0, error: 0 },
            results: [
              {
                rowNumber: 1,
                inputHskCode: "3304991000",
                status: "success",
                message: "조회기준일 2026-05-30 기준 예비 조회"
              }
            ]
          },
          error_message: null,
          created_at: "2026-05-30T00:00:00Z",
          updated_at: "2026-05-30T00:01:00Z"
        }
      ],
      error: null
    });
    const supabase = { from: vi.fn(() => builder) };

    const jobs = await listRecentHsBatchLookupJobs(supabase as never, 8);

    expect(supabase.from).toHaveBeenCalledWith("background_jobs");
    expect(builder.eq).toHaveBeenCalledWith("job_type", "hs_batch_lookup");
    expect(builder.limit).toHaveBeenCalledWith(8);
    expect(jobs).toMatchObject([
      {
        jobId: "00000000-0000-0000-0000-000000000010",
        status: "succeeded",
        rowCount: 1,
        basisDate: "2026-05-30",
        destinationCountry: "CHN",
        summary: { total: 1, success: 1, warning: 0, error: 0 },
        results: [
          {
            rowNumber: 1,
            inputHskCode: "3304991000",
            status: "success",
            message: "조회기준일 2026-05-30 기준 예비 조회"
          }
        ],
        errorMessage: null,
        createdAt: "2026-05-30T00:00:00Z",
        updatedAt: "2026-05-30T00:01:00Z"
      }
    ]);
    expect(jobs[0]?.results?.[0]?.basicTariff).toBe("-");
  });
});
