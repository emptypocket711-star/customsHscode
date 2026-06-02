export const marketplaceTransactionFixture: {
  bids: {
    clearance: {
      id: string;
      totalAmount: number;
    };
    freight: {
      id: string;
      totalAmount: number;
    };
  };
  companies: Record<"broker" | "forwarder" | "requester", {
    id: string;
    name: string;
    partyType: string;
  }>;
  envKeys: {
    clearanceBidId: string;
    clearanceRequestId: string;
    freightBidId: string;
    freightRequestId: string;
  };
  mutation: {
    bids: {
      clearance: {
        id: string;
        totalAmount: number;
      };
      freight: {
        id: string;
        totalAmount: number;
      };
    };
    envKeys: {
      clearanceBidId: string;
      clearanceRequestId: string;
      freightBidId: string;
      freightRequestId: string;
    };
    requests: {
      clearance: {
        hskCode: string;
        id: string;
        title: string;
      };
      freight: {
        id: string;
        title: string;
      };
    };
  };
  requests: {
    clearance: {
      hskCode: string;
      id: string;
      title: string;
    };
    freight: {
      id: string;
      title: string;
    };
  };
  storageStates: Record<"broker" | "forwarder" | "requester", string>;
  users: Record<"broker" | "forwarder" | "requester", {
    email: string;
    id: string;
  }>;
};

export function marketplaceTransactionEnvExports(fixture?: typeof marketplaceTransactionFixture): string[];
export function marketplaceTransactionMutationEnvExports(fixture?: typeof marketplaceTransactionFixture): string[];
