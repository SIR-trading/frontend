import { graphqlClient } from "@/lib/graphqlClient";
import type { TAddressString, VaultFieldFragment } from "@/lib/types";
import { gql } from "graphql-request";
const vaults = (
  filterCollateral: boolean,
  filterDebt: boolean,
  filterLeverage: boolean,
  first = 1000, // Increased default limit to fetch all vaults
  sortbyVaultId = false,
) => {
  // I have to make where clase optional
  // very stupid to not have optional values default
  // Optional `where` clause fields
  const whereClauses = [];
  if (filterCollateral) whereClauses.push("collateralToken_: {id: $collateralToken}");
  if (filterDebt) whereClauses.push("debtToken_: {id: $debtToken}");
  if (filterLeverage) whereClauses.push("leverageTier: $leverageTier");
  // if (filterLastId) whereClauses.push("id_gt: $lastId");
  return gql`
  #graphql

  fragment VaultFields on Vault {
    id
    exists
    leverageTier
    teaSupply
    totalValue
    totalValueUsd
    lockedLiquidity
    tax
    rate
    reserveApes
    reserveLPers
    collateralToken {
      id
      symbol
      decimals
    }
    debtToken {
      id
      symbol
      decimals
    }
    ape {
      id
      symbol
      decimals
    }
  }

  query VaultQuery($collateralToken: Bytes, $skip: Int, $debtToken: Bytes, $leverageTier: Int ) {
    vaults(
      where: { exists: true ${whereClauses.length > 0 ? ", " + whereClauses.join(", ") : ""} }
      first: ${first}
      skip: $skip
      orderBy: ${sortbyVaultId ? "id" : "totalValueUsd"}
      orderDirection: ${sortbyVaultId ? "asc" : "desc"}
    ) {
      ...VaultFields
    }
  }
`;
};
const userApePositionsQuery = gql`
  query getUserApePositions($user: Bytes) {
    apePositions(where: { user: $user }) {
      id
      user
      balance
      collateralTotal
      dollarTotal
      debtTokenTotal
      vault {
        id
        leverageTier
        collateralToken {
          id
          symbol
          decimals
        }
        debtToken {
          id
          symbol
          decimals
        }
        ape {
          id
          symbol
          decimals
        }
      }
    }
  }
`;

const userTeaPositionsQuery = gql`
  query getUserTeaPositions($user: Bytes) {
    teaPositions(where: { user: $user }) {
      id
      user
      balance
      collateralTotal
      dollarTotal
      debtTokenTotal
      vault {
        id
        leverageTier
        collateralToken {
          id
          symbol
          decimals
        }
        debtToken {
          id
          symbol
          decimals
        }
      }
    }
  }
`;
export const executeGetUserTeaPositions = async ({
  user,
}: {
  user: TAddressString;
}) => {
  const result = await graphqlClient.request(userTeaPositionsQuery, { user });
  return result as userPositionsQueryTea;
};

export const executeGetUserApePositions = async ({
  user,
}: {
  user: TAddressString;
}) => {
  const result = await graphqlClient.request(userApePositionsQuery, { user });
  return result as userPositionsQueryApe;
};

export const executeVaultsQuery = async ({
  filterLeverage,
  filterDebtToken,
  filterCollateralToken,
  skip,
  first,
  sortbyVaultId,
}: {
  filterLeverage?: string;
  filterDebtToken?: string;
  filterCollateralToken?: string;
  skip?: number;
  first?: number;
  sortbyVaultId?: boolean;
}) => {
  const result = await graphqlClient.request(
    vaults(
      Boolean(filterCollateralToken),
      Boolean(filterDebtToken),
      Boolean(filterLeverage),
      first,
      sortbyVaultId,
    ),
    {
      collateralToken: filterCollateralToken,
      debtToken: filterDebtToken,
      leverageTier: filterLeverage ? parseInt(filterLeverage) : undefined,
      skip,
    },
  );
  return result as { vaults: VaultFieldFragment[] };
};

// Base type from subgraph
export type TUserPositionBase = {
  id: string;
  balance: bigint;
  user: TAddressString;
  collateralTotal: string;
  dollarTotal: string;
  debtTokenTotal: string;
  vault: {
    id: string;
    leverageTier: number;
    collateralToken: {
      id: TAddressString;
      symbol: string;
      decimals: number;
    };
    debtToken: {
      id: TAddressString;
      symbol: string;
      decimals: number;
    };
    ape?: {
      id: TAddressString;
      symbol: string;
      decimals: number;
    };
  };
};

// Type with flattened properties for UI components
export type TUserPosition = TUserPositionBase & {
  // Flattened properties for backwards compatibility
  vaultId: string;
  leverageTier: string;
  collateralToken: TAddressString;
  collateralSymbol: string;
  decimals: number;
  debtToken: TAddressString;
  debtSymbol: string;
};
export type TUserApePosition = TUserPosition & {
  vault: {
    id: string;
    leverageTier: number;
    collateralToken: {
      id: TAddressString;
      symbol: string;
      decimals: number;
    };
    debtToken: {
      id: TAddressString;
      symbol: string;
      decimals: number;
    };
    ape: {
      id: TAddressString;
      symbol: string;
      decimals: number;
    };
  };
};
export type userPositionsQueryTea = {
  teaPositions: TUserPositionBase[];
};
export type userPositionsQueryApe = { apePositions: (TUserPositionBase & {
  vault: {
    id: string;
    leverageTier: number;
    collateralToken: {
      id: TAddressString;
      symbol: string;
      decimals: number;
    };
    debtToken: {
      id: TAddressString;
      symbol: string;
      decimals: number;
    };
    ape: {
      id: TAddressString;
      symbol: string;
      decimals: number;
    };
  };
})[] };
