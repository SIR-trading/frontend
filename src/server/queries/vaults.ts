import { graphqlClient } from "@/lib/graphqlClient";
import type { TAddressString, TVaults } from "@/lib/types";
import { gql } from "graphql-request";
const vaults = gql`
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
  }

  query VaultQuery {
    vaults(orderDirection: desc, orderBy: totalValue) {
      ...VaultFields
    }
  }
`;

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

export const executeVaultsQuery = async () => {
  const result = await graphqlClient.request(vaults);
  console.log(result, "RESULT");
  return result as TVaults;
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
