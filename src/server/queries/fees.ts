import { graphqlClient } from "@/lib/graphqlClient";
import { gql } from "graphql-request";

export interface Fee {
  id: string;
  vaultId: string;
  timestamp: string;
  lpApy: string;
}

export interface FeesQueryResult {
  fees: Fee[];
}

const feesQuery = gql`
  query getVaultFees($vaultId: Bytes!, $timestampThreshold: BigInt!) {
    fees(
      where: {
        vaultId: $vaultId,
        timestamp_gte: $timestampThreshold
      }
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      vaultId
      timestamp
      lpApy
    }
  }
`;

export const executeGetVaultFees = async ({
  vaultId,
  timestampThreshold,
}: {
  vaultId: string;
  timestampThreshold: string;
}) => {
  const result = await graphqlClient.request(feesQuery, {
    vaultId,
    timestampThreshold,
  });

  const typedResult = result as FeesQueryResult;

  return typedResult;
};
