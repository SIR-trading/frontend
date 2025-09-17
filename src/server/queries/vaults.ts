import { graphqlClient } from "@/lib/graphqlClient";
import type { TAddressString, VaultFieldFragment } from "@/lib/types";
import { gql } from "graphql-request";
const vaults = (
  filterCollateral: boolean,
  filterDebt: boolean,
  filterLeverage: boolean,
  first = 10,
  sortbyVaultId = false,
) => {
  // I have to make where clase optional
  // very stupid to not have optional values default
  // Optional `where` clause fields
  const whereClauses = [];
  if (filterCollateral) whereClauses.push("collateralToken: $collateralToken");
  if (filterDebt) whereClauses.push("debtToken: $debtToken");
  if (filterLeverage) whereClauses.push("leverageTier: $leverageTier");
  // if (filterLastId) whereClauses.push("id_gt: $lastId");
  const whereClause =
    whereClauses.length > 0 ? `where: { ${whereClauses.join(", ")} }` : "";
  return gql`
  #graphql

  fragment VaultFields on Vault {
    debtToken
    apeDecimals
    debtSymbol
    collateralToken
    collateralSymbol
    vaultId
    leverageTier
    totalTea
    totalValue
    lockedLiquidity
    apeAddress
    taxAmount
    rate
    apeDecimals
    apeCollateral
    teaCollateral
    id
    exists
  }

  query VaultQuery($collateralToken: String, $skip: Int, $debtToken: String, $leverageTier: Int ) {
    vaults(
      where: { exists: true ${whereClauses.length > 0 ? ", " + whereClauses.join(", ") : ""} }
      first: ${first}
      skip: $skip
      orderBy: ${sortbyVaultId ? "vaultId" : "totalValueUsd"}
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
      user
      vaultId
      ape
      balance
      debtToken
      debtSymbol
      decimals
      collateralToken
      collateralSymbol
      leverageTier
    }
  }
`;

const userTeaPositionsQuery = gql`
  query getUserTeaPositions($user: Bytes) {
    teaPositions(where: { user: $user }) {
      user
      vaultId
      balance
      decimals
      debtToken
      debtSymbol
      collateralToken
      collateralSymbol
      leverageTier
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

export type TUserPosition = {
  id: string;
  balance: bigint;
  decimals: number;
  user: TAddressString;
  collateralSymbol: string;
  debtSymbol: string;
  collateralToken: TAddressString;
  debtToken: TAddressString;
  leverageTier: string;
  vaultId: string;
};
export type TUserApePosition = TUserPosition & { ape: TAddressString };
export type userPositionsQueryTea = {
  teaPositions: TUserPosition[];
};
export type userPositionsQueryApe = { apePositions: TUserApePosition[] };
