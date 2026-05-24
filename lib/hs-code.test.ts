import { describe, expect, it } from "vitest";
import { formatHsCode, normalizeHsCode } from "@/lib/hs-code";

describe("hs code formatting", () => {
  it("normalizes punctuation and formats Korean HSK display notation", () => {
    expect(normalizeHsCode("3401.30-0000")).toBe("3401300000");
    expect(formatHsCode("3401300000")).toBe("3401.30-0000");
    expect(formatHsCode("340130")).toBe("3401.30");
    expect(formatHsCode("3401")).toBe("3401");
  });
});
