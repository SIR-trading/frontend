import { env } from "@/env";
import { z } from "zod";
function formatTimestamp(unixTimestamp: number) {
  const date = new Date(unixTimestamp * 1000); // Convert seconds to milliseconds
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}
/**
 * getCoinUsdPriceOnDate
 * @param timestamp - unix timestamp
 * @param id - this id is not an address, its coingecko slug id for coin/token
 */
export async function getCoinUsdPriceOnDate({
  timestamp,
  id,
}: {
  timestamp: number;
  id: string;
}) {
  const formattedDate = formatTimestamp(timestamp);
  const url = `https://api.coingecko.com/api/v3/coins/${id}/history?date=${formattedDate}&localization=false`;

  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-cg-demo-api-key": env.COINGECKO_API,
    },
  };

  const resp = await fetch(url, options)
    .then((res) => res.json())
    .then((json: unknown) => json)
    .catch((err) => console.error(err));
  const parse = CryptoSchema.safeParse(resp);
  if (parse.success) {
    const data = parse.data;
    return data.market_data.current_price.usd;
  } else {
    console.error("Error parsing CyprtoSchema");
    console.log(parse.error);
  }
  return undefined;
}
const ImageSchema = z.object({
  thumb: z.string().url(),
  small: z.string().url(),
});

const MarketDataSchema = z.object({
  current_price: z.record(z.number()),
  market_cap: z.record(z.number()),
  total_volume: z.record(z.number()),
});

const CommunityDataSchema = z.object({
  facebook_likes: z.number().nullable(),
  twitter_followers: z.number().nullable(),
  reddit_average_posts_48h: z.number(),
  reddit_average_comments_48h: z.number(),
  reddit_subscribers: z.number().nullable(),
  reddit_accounts_active_48h: z.number(),
});

const CodeAdditionsDeletionsSchema = z.object({
  additions: z.number().nullable(),
  deletions: z.number().nullable(),
});

const DeveloperDataSchema = z.object({
  forks: z.number().nullable(),
  stars: z.number().nullable(),
  subscribers: z.number().nullable(),
  total_issues: z.number().nullable(),
  closed_issues: z.number().nullable(),
  pull_requests_merged: z.number().nullable(),
  pull_request_contributors: z.number().nullable(),
  code_additions_deletions_4_weeks: CodeAdditionsDeletionsSchema,
  commit_count_4_weeks: z.number().nullable(),
});

const PublicInterestStatsSchema = z.object({
  alexa_rank: z.number().nullable(),
  bing_matches: z.number().nullable(),
});

const CryptoSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  image: ImageSchema,
  market_data: MarketDataSchema,
  community_data: CommunityDataSchema,
  developer_data: DeveloperDataSchema,
  public_interest_stats: PublicInterestStatsSchema,
});
