import { describe, expect, it } from "vitest";
import {
  summarizeContainerReceiptFailureEvents,
  type ContainerReceiptFailureEventItem
} from "@/server/repositories/container-receipt-failure-event.repository";

function event(overrides: Partial<ContainerReceiptFailureEventItem>): ContainerReceiptFailureEventItem {
  return {
    createdAt: "2026-05-31T00:00:00.000Z",
    failureCode: "terminal_loading_not_settled",
    id: crypto.randomUUID(),
    message: null,
    metadata: {},
    terminalCode: "hjit",
    userId: null,
    ...overrides
  };
}

describe("container receipt failure event repository helpers", () => {
  it("summarizes repeated failures into action-needed status", () => {
    const summary = summarizeContainerReceiptFailureEvents([
      event({ createdAt: "2026-05-31T00:01:00.000Z" }),
      event({ createdAt: "2026-05-31T00:02:00.000Z" }),
      event({ createdAt: "2026-05-31T00:03:00.000Z" }),
      event({
        createdAt: "2026-05-31T00:04:00.000Z",
        failureCode: "terminal_container_not_confirmed",
        terminalCode: "snct"
      })
    ]);

    expect(summary.status).toBe("action_needed");
    expect(summary.repeatedBucketCount).toBe(1);
    expect(summary.latestAt).toBe("2026-05-31T00:04:00.000Z");
    expect(summary.topBuckets[0]).toEqual({
      failureCode: "terminal_loading_not_settled",
      latestAt: "2026-05-31T00:03:00.000Z",
      terminalCode: "hjit",
      total: 3
    });
  });

  it("keeps a small number of failures in watch status", () => {
    expect(summarizeContainerReceiptFailureEvents([event({})]).status).toBe("watch");
    expect(summarizeContainerReceiptFailureEvents([]).status).toBe("normal");
  });
});
