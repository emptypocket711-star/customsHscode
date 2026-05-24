import { describe, expect, it, vi } from "vitest";
import { getBackgroundJobRetryAt } from "@/server/jobs/background-worker.service";

describe("background worker service", () => {
  it("uses bounded quadratic retry delays", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-24T00:00:00.000Z"));

    expect(getBackgroundJobRetryAt(1)).toBe("2026-05-24T00:00:30.000Z");
    expect(getBackgroundJobRetryAt(2)).toBe("2026-05-24T00:02:00.000Z");
    expect(getBackgroundJobRetryAt(99)).toBe("2026-05-24T00:15:00.000Z");

    vi.useRealTimers();
  });
});
