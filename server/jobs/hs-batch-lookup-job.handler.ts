import { hsBatchInputRowSchema } from "@/features/hs-batch/schemas";
import { runHsBatchLookupRows } from "@/server/actions/hs-batch.actions";
import type { BackgroundJobHandler } from "@/server/jobs/background-worker.service";
import type { BackgroundJobRecord } from "@/server/repositories/background-job.repository";

function parseHsBatchLookupPayload(job: BackgroundJobRecord) {
  const payload = job.payload;
  if (payload.kind !== "hs_batch_lookup") {
    throw new Error("Invalid HS batch lookup job payload kind");
  }

  const basisDate = typeof payload.basisDate === "string" ? payload.basisDate : "";
  const destinationCountry = typeof payload.destinationCountry === "string" ? payload.destinationCountry : "ALL";
  const rows = hsBatchInputRowSchema.array().max(300).safeParse(payload.rows);

  if (!basisDate || !rows.success) {
    throw new Error("Invalid HS batch lookup job payload");
  }

  return {
    basisDate,
    destinationCountry,
    rows: rows.data
  };
}

export function createHsBatchLookupJobHandler(): BackgroundJobHandler {
  return async (job) => {
    if (!job.company_id) {
      throw new Error("HS batch lookup job must have company_id");
    }

    const payload = parseHsBatchLookupPayload(job);
    const { results, summary } = await runHsBatchLookupRows(payload);

    return {
      result: {
        kind: "hs_batch_lookup",
        basisDate: payload.basisDate,
        destinationCountry: payload.destinationCountry,
        rowCount: payload.rows.length,
        summary,
        results
      }
    };
  };
}
