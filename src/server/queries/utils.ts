import { graphqlClient } from "@/lib/graphqlClient";
import { blockNumberSchema } from "@/lib/schemas";
import { gql } from "graphql-request";

const blockNumber = gql`
  query GetBlockNumber {
    _meta {
      block {
        number
      }
    }
  }
`;
export const executeGetBlockNumber = async () => {
  const result = await graphqlClient.request(blockNumber);
  const safe = blockNumberSchema.safeParse(result);
  if (safe.success) {
    return safe.data;
  } else {
    return;
  }
};
