import { graphqlClient } from "@/lib/graphqlClient";
import type { TAddressString, TVaults } from "@/lib/types";
import { gql } from "graphql-request";
const vaults = gql`
  #graphql

  fragment VaultFields on Vault {
    debtToken
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
    apeCollateral
    teaCollateral
  }

  query VaultQuery {
    vaults {
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
  return result as TVaults;
};

export type TUserPosition = {
  id: string;
  balance: bigint;
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
