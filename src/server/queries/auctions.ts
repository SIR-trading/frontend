import { AUCTION_DURATION } from "@/components/auction/__constants";
import { graphqlClient } from "@/lib/graphqlClient";
import type { AuctionFieldFragment } from "@/lib/types";
import { gql } from "graphql-request";

type TAuctionType = "ongoing" | "expired" | undefined;

const auctions = (type: TAuctionType, first = 100, skip = 0) => {
  const currentTime = Math.floor(Date.now() / 1000);
  const expectedCurrentTime = currentTime - AUCTION_DURATION;

  // For expired auctions, use offset-based pagination (skip)
  if (type === "expired") {
    return gql`
      #graphql

      query ExpiredAuctionsQuery {
        auctions(
          where: {startTime_lt: ${expectedCurrentTime}}
          orderBy: startTime
          orderDirection: desc
          skip: ${skip}
          first: ${first}
        ) {
          id
          token {
            id
            symbol
            decimals
          }
          amount
          highestBid
          highestBidder
          startTime
          isClaimed
        }
      }
    `;
  }

  // For ongoing and all auctions, query Auction entity
  const whereClause =
    type === "ongoing"
      ? `where: {startTime_gte: ${expectedCurrentTime}}`
      : "";

  return gql`
    #graphql

    fragment AuctionFields on Auction {
      id
      token {
        id
        symbol
        decimals
      }
      amount
      highestBid
      highestBidder
      startTime
      isClaimed
    }

    query AuctionQuery($user: Bytes, $skip: Int) {
      auctions (
         orderBy: startTime
         orderDirection: desc
         skip: $skip
         first: ${first}
         ${whereClause}
      ) {
        ...AuctionFields
        isParticipant: participants(where: { user: $user }) @include(if: true) {
          bid
        }
      }
    }
  `;
};

export const getAuctions = async (
  user?: string,
  type?: TAuctionType,
  skip = 0,
  first = 100,
) => {
  const result = await graphqlClient.request(auctions(type, first, skip), {
    user,
    skip,
  });

  // For expired auctions, format to match expected structure
  if (type === "expired") {
    interface ExpiredAuctionsResult {
      auctions?: Array<{
        id: string;
        token: {
          id: string;
          symbol: string | null;
          decimals: number;
        };
        amount: string;
        highestBid: string;
        highestBidder: string;
        startTime: string;
        isClaimed: boolean;
      }>;
    }

    const typedResult = result as ExpiredAuctionsResult;
    const expiredAuctions = typedResult.auctions ?? [];

    // Format expired auctions with empty participant array
    const formattedExpired = expiredAuctions.map((auction) => ({
      ...auction,
      isParticipant: [], // No participant data needed - only showing winner
    }));

    return {
      auctions: formattedExpired as AuctionFieldFragment[],
    };
  }

  return result as {
    auctions: AuctionFieldFragment[];
  };
};

// Query auction stats (total count)
export const getAuctionStats = async () => {
  const query = gql`
    query AuctionStatsQuery {
      auctionStats(id: "stats") {
        totalAuctions
      }
    }
  `;

  const result = await graphqlClient.request(query);

  interface AuctionStatsResult {
    auctionStats?: {
      totalAuctions: string;
    } | null;
  }

  const typedResult = result as AuctionStatsResult;
  return {
    totalAuctions: typedResult.auctionStats?.totalAuctions
      ? parseInt(typedResult.auctionStats.totalAuctions)
      : 0,
  };
};

// Query ongoing auctions count
export const getOngoingAuctionsCount = async () => {
  const currentTime = Math.floor(Date.now() / 1000);
  const expectedCurrentTime = currentTime - AUCTION_DURATION;

  const query = gql`
    query OngoingAuctionsCountQuery {
      auctions(
        where: {startTime_gte: ${expectedCurrentTime}}
      ) {
        id
      }
    }
  `;

  const result = await graphqlClient.request(query);

  interface OngoingResult {
    auctions?: Array<{ id: string }>;
  }

  const typedResult = result as OngoingResult;
  return typedResult.auctions?.length ?? 0;
};

// Query expired auctions count directly (more reliable than stats entity)
export const getExpiredAuctionsCount = async () => {
  const currentTime = Math.floor(Date.now() / 1000);
  const expectedCurrentTime = currentTime - AUCTION_DURATION;

  const query = gql`
    query ExpiredAuctionsCountQuery {
      auctions(
        where: {startTime_lt: ${expectedCurrentTime}}
        first: 1000
      ) {
        id
      }
    }
  `;

  const result = await graphqlClient.request(query);

  interface ExpiredResult {
    auctions?: Array<{ id: string }>;
  }

  const typedResult = result as ExpiredResult;
  return typedResult.auctions?.length ?? 0;
};
