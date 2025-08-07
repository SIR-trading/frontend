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

  query ClosedApePositionsQuery($startTimestamp: Int) {
    closedApePositions(where: { timestamp_gte: $startTimestamp }) {
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
  // Get the first day of the current month at 00:00:00 UTC
  const now = new Date();
  const firstDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const firstDayTimestamp = Math.floor(firstDayOfMonth.getTime() / 1000); // Convert to seconds
  
  const result = await graphqlClient.request(closedApePositionsQuery, {
    startTimestamp: firstDayTimestamp,
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
