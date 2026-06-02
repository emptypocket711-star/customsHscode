export const marketplaceTransactionFixture = {
  bids: {
    clearance: {
      id: "75000000-0000-4000-8000-000000000004",
      totalAmount: 330000
    },
    freight: {
      id: "75000000-0000-4000-8000-000000000003",
      totalAmount: 1250000
    }
  },
  companies: {
    broker: {
      id: "75000000-0000-4000-8000-000000000012",
      name: "E2E 관세사무소",
      partyType: "customs_broker"
    },
    forwarder: {
      id: "75000000-0000-4000-8000-000000000011",
      name: "E2E 포워딩",
      partyType: "forwarder"
    },
    requester: {
      id: "75000000-0000-4000-8000-000000000010",
      name: "E2E 수출입화주",
      partyType: "domestic_shipper"
    }
  },
  envKeys: {
    clearanceBidId: "E2E_MARKETPLACE_CLEARANCE_BID_ID",
    clearanceRequestId: "E2E_MARKETPLACE_CLEARANCE_REQUEST_ID",
    freightBidId: "E2E_MARKETPLACE_FREIGHT_BID_ID",
    freightRequestId: "E2E_MARKETPLACE_FREIGHT_REQUEST_ID"
  },
  mutation: {
    bids: {
      clearance: {
        id: "75000000-0000-4000-8000-000000000104",
        totalAmount: 440000
      },
      freight: {
        id: "75000000-0000-4000-8000-000000000103",
        totalAmount: 1450000
      }
    },
    envKeys: {
      clearanceBidId: "E2E_MARKETPLACE_MUTATION_CLEARANCE_BID_ID",
      clearanceRequestId: "E2E_MARKETPLACE_MUTATION_CLEARANCE_REQUEST_ID",
      freightBidId: "E2E_MARKETPLACE_MUTATION_FREIGHT_BID_ID",
      freightRequestId: "E2E_MARKETPLACE_MUTATION_FREIGHT_REQUEST_ID"
    },
    requests: {
      clearance: {
        hskCode: "3926909000",
        id: "75000000-0000-4000-8000-000000000102",
        title: "E2E 통관 의뢰 mutation"
      },
      freight: {
        id: "75000000-0000-4000-8000-000000000101",
        title: "E2E 운송 견적 요청 mutation"
      }
    }
  },
  notification: {
    delivery: {
      id: "75000000-0000-4000-8000-000000000301"
    },
    envKeys: {
      deliveryId: "E2E_MARKETPLACE_NOTIFICATION_DELIVERY_ID",
      partnerStateFile: "E2E_MARKETPLACE_NOTIFICATION_PARTNER_STATE_FILE",
      requestId: "E2E_MARKETPLACE_NOTIFICATION_REQUEST_ID"
    }
  },
  requests: {
    clearance: {
      hskCode: "3926909000",
      id: "75000000-0000-4000-8000-000000000002",
      title: "E2E 통관 의뢰"
    },
    freight: {
      id: "75000000-0000-4000-8000-000000000001",
      title: "E2E 운송 견적 요청"
    }
  },
  storageStates: {
    broker: "marketplace-transaction-broker.json",
    forwarder: "marketplace-transaction-forwarder.json",
    requester: "marketplace-transaction-requester.json"
  },
  users: {
    broker: {
      email: "marketplace-transaction-broker@example.test",
      id: "75000000-0000-4000-8000-000000000022"
    },
    forwarder: {
      email: "marketplace-transaction-forwarder@example.test",
      id: "75000000-0000-4000-8000-000000000021"
    },
    requester: {
      email: "marketplace-transaction-requester@example.test",
      id: "75000000-0000-4000-8000-000000000020"
    }
  },
  zeroMatch: {
    envKeys: {
      freightRequestId: "E2E_MARKETPLACE_ZERO_MATCH_FREIGHT_REQUEST_ID"
    },
    requests: {
      freight: {
        id: "75000000-0000-4000-8000-000000000201",
        title: "E2E 운송 견적 요청 노출 0건"
      }
    }
  }
};

export function marketplaceTransactionEnvExports(fixture = marketplaceTransactionFixture) {
  return [
    `export ${fixture.envKeys.freightRequestId}=${fixture.requests.freight.id}`,
    `export ${fixture.envKeys.freightBidId}=${fixture.bids.freight.id}`,
    `export ${fixture.envKeys.clearanceRequestId}=${fixture.requests.clearance.id}`,
    `export ${fixture.envKeys.clearanceBidId}=${fixture.bids.clearance.id}`
  ];
}

export function marketplaceTransactionMutationEnvExports(fixture = marketplaceTransactionFixture) {
  return [
    `export ${fixture.mutation.envKeys.freightRequestId}=${fixture.mutation.requests.freight.id}`,
    `export ${fixture.mutation.envKeys.freightBidId}=${fixture.mutation.bids.freight.id}`,
    `export ${fixture.mutation.envKeys.clearanceRequestId}=${fixture.mutation.requests.clearance.id}`,
    `export ${fixture.mutation.envKeys.clearanceBidId}=${fixture.mutation.bids.clearance.id}`
  ];
}

export function marketplaceTransactionZeroMatchEnvExports(fixture = marketplaceTransactionFixture) {
  return [
    `export ${fixture.zeroMatch.envKeys.freightRequestId}=${fixture.zeroMatch.requests.freight.id}`
  ];
}

export function marketplaceNotificationEnvExports(fixture = marketplaceTransactionFixture) {
  return [
    `export ${fixture.notification.envKeys.requestId}=${fixture.requests.freight.id}`,
    `export ${fixture.notification.envKeys.deliveryId}=${fixture.notification.delivery.id}`,
    `export ${fixture.notification.envKeys.partnerStateFile}=${fixture.storageStates.forwarder}`
  ];
}
