import { graphqlClient } from "@/lib/graphqlClient";
import { gql } from "graphql-request";

import { z } from "zod";

const DividendsPaidSchema = z.object({
  ethAmount: z.string(),
  timestamp: z.string(),
  stakedAmount: z.string(),
  sirUsdPrice: z.string(),
});

const GetDividendsPaidSchema = z.object({
  dividends_collection: z.array(DividendsPaidSchema),
});

export { GetDividendsPaidSchema };

const greaterThanTimestampDividendsPaid = gql`
  query getDividendsPaid($timestamp: BigInt!) {
    dividends_collection(where: { timestamp_gt: $timestamp }) {
      ethAmount
      timestamp
      stakedAmount
      sirUsdPrice
    }
  }
`;
const lastestDividendsPaid = gql`
  query getDividendsPaid {
    dividends_collection(orderBy: timestamp, orderDirection: desc, first: 1) {
      ethAmount
      timestamp
      stakedAmount
      sirUsdPrice
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
    return parsed.data.dividends_collection;
  } else {
    console.log(result);
    console.log(parsed.error);
    throw new Error(
      "Failed to parse dividends paid events (executeGetDividendGreatherThan)",
    );
  }
};

export const executeGetLastestDividendsPaid = async () => {
  const result = await graphqlClient.request(lastestDividendsPaid);
  const parsed = GetDividendsPaidSchema.safeParse(result);
  if (parsed.success) {
    return parsed.data.dividends_collection;
  } else {
    console.log(parsed.error);
    throw new Error(
      "Failed to parse dividends paid events (executeGetLastestDividendsPaid)",
    );
  }
};
