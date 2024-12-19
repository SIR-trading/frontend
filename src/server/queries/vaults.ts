import { graphqlClient } from "@/lib/graphqlClient";
import type { TAddressString, VaultFieldFragment } from "@/lib/types";
import { gql } from "graphql-request";
const vaults = (
  filterCollateral: boolean,
  filterDebt: boolean,
  filterLeverage: boolean,
  filterLastId: boolean,
) => {
  // I have to make where clase optional
  // very stupid to not have optional values default
  // Optional `where` clause fields
  const whereClauses = [];
  if (filterCollateral) whereClauses.push("collateralToken: $collateralToken");
  if (filterDebt) whereClauses.push("debtToken: $debtToken");
  if (filterLeverage) whereClauses.push("leverageTier: $leverageTier");
  if (filterLastId) whereClauses.push("id_gt: $lastId");
  console.log(whereClauses, "WHERE CLAUSES");
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
    apeDecimals
    apeCollateral
    teaCollateral
    id
  }

  query VaultQuery($collateralToken: String, $debtToken: String, $leverageTier: Int, $lastId: String ) {
    vaults(
     
      first: 8
      orderBy: totalValue
      orderDirection: desc
      ${whereClause}
    ) {
      ...VaultFields
    }
  }
`;
};
const userApePositionsQuery = gql`
  query getUserApePositions($user: Bytes) {
    userPositions(where: { user: $user }) {
      user
      vaultId
      APE
      balance
      debtToken
      debtSymbol
      positionDecimals
      collateralToken
      collateralSymbol
      leverageTier
    }
  }
`;

const userTeaPositionsQuery = gql`
  query getUserTeaPositions($user: Bytes) {
    userPositionTeas(where: { user: $user }) {
      user
      vaultId
      balance
      positionDecimals
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
  filterLastId,
}: {
  filterLeverage?: string;
  filterDebtToken?: string;
  filterCollateralToken?: string;
  filterLastId?: string;
}) => {
  const result = await graphqlClient.request(
    vaults(
      Boolean(filterCollateralToken),
      Boolean(filterDebtToken),
      Boolean(filterLeverage),
      Boolean(filterLastId),
    ),
    {
      collateralToken: filterCollateralToken,
      debtToken: filterDebtToken,
      leverageTier: filterLeverage ? parseInt(filterLeverage) : undefined,
      lastId: filterLastId,
    },
  );
  console.log(result, "VAULTS");
  return result as { vaults: VaultFieldFragment[] };
};

export type TUserPosition = {
  id: string;
  balance: bigint;
  positionDecimals: number;
  user: TAddressString;
  collateralSymbol: string;
  debtSymbol: string;
  collateralToken: TAddressString;
  debtToken: TAddressString;
  leverageTier: string;
  vaultId: string;
};
export type TUserApePosition = TUserPosition & { APE: TAddressString };
export type userPositionsQueryTea = {
  userPositionTeas: TUserPosition[];
};
export type userPositionsQueryApe = { userPositions: TUserApePosition[] };
