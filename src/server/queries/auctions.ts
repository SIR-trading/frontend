import { AUCTION_DURATION } from "@/components/auction/__constants";
import { graphqlClient } from "@/lib/graphqlClient";
import type { AuctionFieldFragment } from "@/lib/types";
import { gql } from "graphql-request";

type TAuctionType = "ongoing" | "expired" | undefined;

const auctions = (type: TAuctionType) => {
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
    }

    query AuctionQuery($user: Bytes) {
      auctions (
         orderBy: startTime
         orderDirection: asc
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
) => {
  const result = await graphqlClient.request(auctions(type), {
    user,
  });

  return result as {
    auctions: AuctionFieldFragment[];
  };
};
