import { describe, expect, it } from "vitest";
import { hsAncestorCodes } from "@/lib/hs-hierarchy";

describe("HS hierarchy helpers", () => {
  it("includes intermediate Korean HSK family prefixes", () => {
    expect(hsAncestorCodes("1704.90-2090")).toEqual(["17", "1704", "170490", "17049020", "1704902090"]);
  });
});
