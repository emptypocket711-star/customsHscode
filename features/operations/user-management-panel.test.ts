import { describe, expect, it } from "vitest";
import { buildManagedUserDetailCues } from "@/features/operations/user-management-panel";

describe("user management detail cues", () => {
  it("prioritizes incomplete onboarding and IP limit warnings", () => {
    const cues = buildManagedUserDetailCues({
      accountType: "company",
      allowedIpCount: 1,
      companyName: "테스트상사",
      lastSignInAt: "2026-06-01T00:00:00.000Z",
      onboardingCompletedAt: null,
      role: "client",
      usedLoginIps: ["127.0.0.1", "127.0.0.2"]
    });

    expect(cues.map((cue) => cue.label)).toEqual([
      "가입 추가정보 미완료",
      "허용 IP 초과 2/1"
    ]);
    expect(cues.every((cue) => cue.tone === "warning")).toBe(true);
  });

  it("shows a calm default cue for ordinary completed users", () => {
    expect(buildManagedUserDetailCues({
      accountType: "personal",
      allowedIpCount: 1,
      companyName: "개인 공간",
      lastSignInAt: "2026-06-01T00:00:00.000Z",
      onboardingCompletedAt: "2026-06-01T00:00:00.000Z",
      role: "client",
      usedLoginIps: ["127.0.0.1"]
    })).toEqual([{ label: "평소 확인만 필요", tone: "neutral" }]);
  });
});
