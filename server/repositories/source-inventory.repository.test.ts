import { describe, expect, it } from "vitest";
import {
  getLegalSourceVersionInventoryRpcName,
  mapSourceInventoryRow
} from "@/server/repositories/source-inventory.repository";

describe("source inventory repository helpers", () => {
  it("uses the source inventory rpc", () => {
    expect(getLegalSourceVersionInventoryRpcName).toBe("get_legal_source_version_inventory");
  });

  it("maps rpc rows into UI inventory items", () => {
    expect(mapSourceInventoryRow({
      target_table: "hs_master",
      source_name: "관세청 HS부호",
      source_version: "customs-hs-20260101",
      status: "staged",
      row_count: "12469",
      latest_retrieved_at: "2026-05-22T10:42:00+00:00",
      latest_published_at: null
    })).toEqual({
      targetTable: "hs_master",
      sourceName: "관세청 HS부호",
      sourceVersion: "customs-hs-20260101",
      status: "staged",
      rowCount: 12469,
      latestRetrievedAt: "2026-05-22T10:42:00+00:00",
      latestPublishedAt: null
    });
  });
});
