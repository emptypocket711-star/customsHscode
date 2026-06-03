import { describe, expect, it } from "vitest";
import {
  createStagingSmokeSteps,
  loadShipperAccountDefaults
} from "./run_staging_smoke_suite.mjs";
import { marketplaceTransactionFixture } from "@/tests/fixtures/marketplace-transaction.fixture";

describe("staging smoke suite", () => {
  it("seeds marketplace fixtures before authenticated route smoke", () => {
    const steps = createStagingSmokeSteps("https://preview.example");
    const labels = steps.map((step) => step.label);

    expect(labels.indexOf("marketplace-fixture-seed")).toBeLessThan(labels.indexOf("route-smoke"));
    expect(labels.indexOf("marketplace-fixture-seed")).toBeLessThan(labels.indexOf("marketplace-rls-negative"));
    expect(labels.indexOf("operations-developer-prepare")).toBeLessThan(labels.indexOf("route-smoke"));
    expect(labels.indexOf("marketplace-transaction")).toBeLessThan(labels.indexOf("partner-preference-anchor"));
    expect(labels.indexOf("marketplace-transaction")).toBeLessThan(labels.indexOf("marketplace-route-performance"));
    expect(steps.find((step) => step.label === "route-smoke")?.args).toEqual([
      "run",
      "smoke:production",
      "--",
      "https://preview.example"
    ]);
  });

  it("uses the requester fixture account for route smoke when only the fixture password is provided", () => {
    expect(loadShipperAccountDefaults({ E2E_TEST_PASSWORD: "fixture-password" })).toEqual({
      E2E_TEST_PASSWORD: "fixture-password",
      SMOKE_LOGIN_EMAIL: marketplaceTransactionFixture.users.requester.email,
      SMOKE_LOGIN_PASSWORD: "fixture-password"
    });
  });

  it("keeps explicit smoke credentials when operators override them", () => {
    expect(loadShipperAccountDefaults({
      E2E_TEST_PASSWORD: "fixture-password",
      SMOKE_LOGIN_EMAIL: "operator@example.test",
      SMOKE_LOGIN_PASSWORD: "operator-password"
    })).toEqual({
      E2E_TEST_PASSWORD: "fixture-password",
      SMOKE_LOGIN_EMAIL: "operator@example.test",
      SMOKE_LOGIN_PASSWORD: "operator-password"
    });
  });
});
