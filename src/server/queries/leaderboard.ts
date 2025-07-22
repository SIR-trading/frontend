import { gql } from "graphql-request";
import type {
  ClosedApePositionFragment,
  CurrentApePositionFragment,
} from "@/lib/types";
import { graphqlClient } from "@/lib/graphqlClient";

const closedApePositionsQuery = gql`
  #graphql

  fragment ClosedApePositionFields on ClosedApePosition {
    collateralDeposited
    collateralWithdrawn
    dollarDeposited
    dollarWithdrawn
    user
    vaultId
    timestamp
    decimal
  }

  query ClosedApePositionsQuery($oneWeekAgo: Int) {
    closedApePositions(where: { timestamp_gte: $oneWeekAgo }) {
      ...ClosedApePositionFields
    }
  }
`;
const currentApePositionsQuery = gql`
  #graphql
  fragment CurrentApePositionFields on ApePosition {
    vaultId
    user
    collateralTotal
    dollarTotal
    apeBalance: balance
    apeAddress: ape
    leverageTier
    apeDecimals: decimals
    collateralToken
  }
  query CurrentApePositionsQuery {
    apePositions {
      ...CurrentApePositionFields
    }
  }
`;

export const getClosedApePositions = async () => {
  const timestamp = Math.floor(Date.now() / 1000); // Convert to seconds
  const oneWeekAgo = timestamp - 7 * 24 * 60 * 60;
  const result = await graphqlClient.request(closedApePositionsQuery, {
    oneWeekAgo: oneWeekAgo,
  });

  return result as {
    closedApePositions: ClosedApePositionFragment[];
  };
};

export const getCurrentApePositions = async () => {
  const result = await graphqlClient.request(currentApePositionsQuery);

  return result as {
    apePositions: CurrentApePositionFragment[];
  };
};
