import { gql } from "graphql-request";
import type { ClosedApePositionFragment } from "@/lib/types";
import { graphqlClient } from "@/lib/graphqlClient";

const closedApePositionsQuery = () => {
  return gql`
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

    query ClosedApePositionsQuery($user: Bytes) {
      closedApePositions {
        ...ClosedApePositionFields
      }
    }
  `;
};

export const getClosedApePositions = async () => {
  const result = await graphqlClient.request(closedApePositionsQuery());

  return result as {
    closedApePositions: ClosedApePositionFragment[];
  };
};
