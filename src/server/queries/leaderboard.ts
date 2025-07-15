import { gql } from "graphql-request";
import type { ClosedApePositionFragment } from "@/lib/types";
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

  query ClosedApePositionsQuery($oneMonthAgo: Int) {
    closedApePositions(where: { timestamp_gte: $oneMonthAgo }) {
      ...ClosedApePositionFields
    }
  }
`;

export const getClosedApePositions = async () => {
  const timestamp = Math.floor(Date.now() / 1000); // Convert to seconds
  const oneWeekAgo = timestamp - 7 * 24 * 60 * 60;
  const result = await graphqlClient.request(closedApePositionsQuery, {
    oneMonthAgo: oneWeekAgo,
  });

  return result as {
    closedApePositions: ClosedApePositionFragment[];
  };
};
