import { AUCTION_DURATION } from "@/components/auction/__constants";
import { graphqlClient } from "@/lib/graphqlClient";
import type { AuctionFieldFragment } from "@/lib/types";
import { gql } from "graphql-request";

type TAuctionType = "ongoing" | "expired" | undefined;

const auctions = (type: TAuctionType, first = 100) => {
  const currentTime = Math.floor(Date.now() / 1000);
  const expectedCurrentTime = currentTime - AUCTION_DURATION;
  
  // For expired auctions, query both Auction (recently expired) and AuctionsHistory (older)
  if (type === "expired") {
    return gql`
      #graphql

      query ExpiredAuctionsQuery($user: Bytes, $skip: Int) {
        # Get expired auctions still in Auction entity (not yet moved to history)
        auctions(
          where: {startTime_lt: ${expectedCurrentTime}}
          orderBy: startTime
          orderDirection: desc
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
        
        # Get auctions from AuctionsHistory entity
        auctionsHistories(
          orderBy: startTime
          orderDirection: desc
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
  skip?: number,
  first = 100,
) => {
  const result = await graphqlClient.request(auctions(type, first), {
    user,
    skip,
  });

  // For expired auctions, merge results from both Auction and AuctionsHistory
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
      auctionsHistories?: Array<{
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
      }>;
    }
    
    const typedResult = result as ExpiredAuctionsResult;
    const expiredAuctions = typedResult.auctions ?? [];
    const historicalAuctions = typedResult.auctionsHistories ?? [];
    
    // Format historical auctions to match Auction structure
    const formattedHistorical = historicalAuctions.map((history) => ({
      ...history,
      isClaimed: true, // Historical auctions are considered completed
      isParticipant: [], // No participant data needed - only showing winner
    }));
    
    // Format expired auctions from Auction entity
    const formattedExpired = expiredAuctions.map((auction) => ({
      ...auction,
      isParticipant: [], // No participant data needed - only showing winner
    }));
    
    // Merge both arrays and sort by startTime desc
    const allExpiredAuctions = [...formattedExpired, ...formattedHistorical]
      .sort((a, b) => parseInt(b.startTime) - parseInt(a.startTime))
      .slice(skip ?? 0, (skip ?? 0) + first);
    
    return {
      auctions: allExpiredAuctions as AuctionFieldFragment[],
    };
  }

  return result as {
    auctions: AuctionFieldFragment[];
  };
};
