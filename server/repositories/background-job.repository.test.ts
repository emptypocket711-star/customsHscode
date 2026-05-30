import { describe, expect, it } from "vitest";
import {
  claimBackgroundJobsRpcName,
  createDocumentExtractionJobPayload,
  createHsBatchLookupJobPayload,
  isBackgroundQueueEnabled,
  summarizeBackgroundJobOperations,
  type BackgroundJobOperationsItem
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
});
