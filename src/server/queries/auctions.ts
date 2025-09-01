import { AUCTION_DURATION } from "@/components/auction/__constants";
import { graphqlClient } from "@/lib/graphqlClient";
import type { AuctionFieldFragment } from "@/lib/types";
import { gql } from "graphql-request";

type TAuctionType = "ongoing" | "expired" | undefined;

const auctions = (type: TAuctionType, first = 100) => {
  const currentTime = Math.floor(Date.now() / 1000);
  const expectedCurrentTime = currentTime - AUCTION_DURATION;
  const whereClause =
    type === "ongoing"
      ? `where: {startTime_gte: ${expectedCurrentTime}}`
      : type === "expired"
        ? `where: {startTime_lt: ${expectedCurrentTime}}`
        : "";
  return gql`
    #graphql

    fragment AuctionFields on Auction {
      id
      token
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

export const getOngoingAuctions = async (
  user?: string,
  type?: TAuctionType,
  skip?: number,
  first = 100,
) => {
  const result = await graphqlClient.request(auctions(type, first), {
    user,
    skip,
  });

  return result as {
    auctions: AuctionFieldFragment[];
  };
};
