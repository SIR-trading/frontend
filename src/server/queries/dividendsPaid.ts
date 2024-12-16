import { graphqlClient } from "@/lib/graphqlClient";
import { gql } from "graphql-request";

const query = gql`
  query getDividendsPaid {
    dividends(id: "0") {
      ethAmount
      stakedAmount
    }
  }
`;

export const executeGetDividendsPaid = async () => {
  const result = await graphqlClient.request(query);
  console.log(result, "DIVIDENDS PAID");
  return result;
};
