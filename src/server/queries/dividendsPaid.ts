import { graphqlClient } from "@/lib/graphqlClient";
import { gql } from "graphql-request";

import { z } from "zod";

const DividendsPaidSchema = z.object({
  ethAmount: z.string(),
  timestamp: z.string(),
  stakedAmount: z.string(),
  sirEthPrice: z.string().nullable(),
});

const GetDividendsPaidSchema = z.object({
  dividends: z.array(DividendsPaidSchema),
});

export { GetDividendsPaidSchema };

const greaterThanTimestampDividendsPaid = gql`
  query getDividendsPaid($timestamp: BigInt!) {
    dividends(where: { timestamp_gt: $timestamp }) {
      ethAmount
      timestamp
      stakedAmount
      sirEthPrice
    }
  }
`;

export const executeGetDividendGreaterThan = async ({
  timestamp,
}: {
  timestamp: number;
}) => {
  const result = await graphqlClient.request(
    greaterThanTimestampDividendsPaid,
    {
      timestamp,
    },
  );

  const parsed = GetDividendsPaidSchema.safeParse(result);
  if (parsed.success) {
    return parsed.data.dividends;
  } else {
    console.log(result);
    console.log(parsed.error);
    throw new Error(
      "Failed to parse dividends paid events (executeGetDividendGreatherThan)",
    );
  }
};
