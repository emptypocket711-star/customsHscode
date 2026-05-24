import { describe, expect, it } from "vitest";
import { dutyEstimatorHskCodeError, normalizeDutyEstimatorHskCode } from "@/features/duty-estimator/hsk-validation";

describe("duty estimator HSK validation", () => {
  it("normalizes formatted HSK codes to 10 digits", () => {
    expect(normalizeDutyEstimatorHskCode("3401.30-0000")).toBe("3401300000");
  });

  it("requires a full 10 digit HSK code", () => {
    expect(dutyEstimatorHskCodeError("")).toBe("예상 납세액 계산에는 HS CODE 10자리를 입력해 주세요.");
    expect(dutyEstimatorHskCodeError("340130")).toBe("예상 납세액 계산은 HS CODE 10자리 기준으로만 가능합니다.");
    expect(dutyEstimatorHskCodeError("3401.30-0000")).toBeNull();
  });
});
