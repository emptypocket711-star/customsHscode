import { describe, expect, it } from "vitest";
import {
  marketplaceNotificationEnvExports,
  marketplaceTransactionEnvExports,
  marketplaceTransactionFixture,
  marketplaceTransactionMutationEnvExports,
  marketplaceTransactionZeroMatchEnvExports
} from "@/tests/fixtures/marketplace-transaction.fixture";

describe("marketplace transaction fixture", () => {
  it("defines stable requester, forwarder, and broker identities", () => {
    expect(Object.keys(marketplaceTransactionFixture.users).sort()).toEqual([
      "broker",
      "forwarder",
      "requester"
    ]);
    expect(marketplaceTransactionFixture.users.requester.email).toContain("requester@example.test");
    expect(marketplaceTransactionFixture.companies.forwarder.partyType).toBe("forwarder");
    expect(marketplaceTransactionFixture.companies.broker.partyType).toBe("customs_broker");
  });

  it("defines both freight and clearance request/bid ids for e2e env exports", () => {
    const exports = marketplaceTransactionEnvExports();

    expect(exports).toContain(`export E2E_MARKETPLACE_FREIGHT_REQUEST_ID=${marketplaceTransactionFixture.requests.freight.id}`);
    expect(exports).toContain(`export E2E_MARKETPLACE_FREIGHT_BID_ID=${marketplaceTransactionFixture.bids.freight.id}`);
    expect(exports).toContain(`export E2E_MARKETPLACE_CLEARANCE_REQUEST_ID=${marketplaceTransactionFixture.requests.clearance.id}`);
    expect(exports).toContain(`export E2E_MARKETPLACE_CLEARANCE_BID_ID=${marketplaceTransactionFixture.bids.clearance.id}`);
  });

  it("defines separate mutation ids and env exports", () => {
    const staticIds = [
      marketplaceTransactionFixture.requests.freight.id,
      marketplaceTransactionFixture.requests.clearance.id,
      marketplaceTransactionFixture.bids.freight.id,
      marketplaceTransactionFixture.bids.clearance.id
    ];
    const mutationIds = [
      marketplaceTransactionFixture.mutation.requests.freight.id,
      marketplaceTransactionFixture.mutation.requests.clearance.id,
      marketplaceTransactionFixture.mutation.bids.freight.id,
      marketplaceTransactionFixture.mutation.bids.clearance.id
    ];

    expect(new Set([...staticIds, ...mutationIds]).size).toBe(staticIds.length + mutationIds.length);
    expect(marketplaceTransactionMutationEnvExports()).toContain(
      `export E2E_MARKETPLACE_MUTATION_FREIGHT_REQUEST_ID=${marketplaceTransactionFixture.mutation.requests.freight.id}`
    );
    expect(marketplaceTransactionMutationEnvExports()).toContain(
      `export E2E_MARKETPLACE_MUTATION_CLEARANCE_BID_ID=${marketplaceTransactionFixture.mutation.bids.clearance.id}`
    );
  });

  it("defines separate zero-match request ids and env exports", () => {
    const usedIds = [
      marketplaceTransactionFixture.requests.freight.id,
      marketplaceTransactionFixture.requests.clearance.id,
      marketplaceTransactionFixture.mutation.requests.freight.id,
      marketplaceTransactionFixture.mutation.requests.clearance.id,
      marketplaceTransactionFixture.zeroMatch.requests.freight.id
    ];

    expect(new Set(usedIds).size).toBe(usedIds.length);
    expect(marketplaceTransactionZeroMatchEnvExports()).toContain(
      `export E2E_MARKETPLACE_ZERO_MATCH_FREIGHT_REQUEST_ID=${marketplaceTransactionFixture.zeroMatch.requests.freight.id}`
    );
  });

  it("defines a stable in-app notification fixture for dashboard e2e", () => {
    expect(marketplaceTransactionFixture.notification.delivery.id).not.toBe(marketplaceTransactionFixture.requests.freight.id);
    expect(marketplaceNotificationEnvExports()).toEqual([
      `export E2E_MARKETPLACE_NOTIFICATION_REQUEST_ID=${marketplaceTransactionFixture.requests.freight.id}`,
      `export E2E_MARKETPLACE_NOTIFICATION_DELIVERY_ID=${marketplaceTransactionFixture.notification.delivery.id}`,
      `export E2E_MARKETPLACE_NOTIFICATION_PARTNER_STATE_FILE=${marketplaceTransactionFixture.storageStates.forwarder}`
    ]);
  });

  it("keeps fixture labels synthetic and non-sensitive", () => {
    const serialized = JSON.stringify(marketplaceTransactionFixture);

    expect(serialized).toContain("E2E");
    for (const forbidden of ["invoice", "packing", "fileName", "question", "answer", "message"]) {
      expect(serialized.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });
});
