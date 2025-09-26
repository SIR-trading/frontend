"use client";
import { api } from "@/trpc/react";

export function useActiveAuctions() {
  try {
    const { data: ongoingAuctions } = api.auction.getOngoingAuctions.useQuery();

    const hasActiveAuctions = ongoingAuctions && ongoingAuctions.length > 0;

    return {
      hasActiveAuctions,
      activeAuctionCount: ongoingAuctions?.length ?? 0
    };
  } catch (error) {
    // Return default values if context is not available
    console.warn("useActiveAuctions: Unable to fetch auction data", error);
    return {
      hasActiveAuctions: false,
      activeAuctionCount: 0
    };
  }
}