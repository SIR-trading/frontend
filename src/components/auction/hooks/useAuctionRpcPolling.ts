import { useEffect, useRef, useState, useCallback } from "react";
import { usePublicClient, useAccount } from "wagmi";
import type { Address } from "viem";
import { SirContract } from "@/contracts/sir";
import type { AuctionFieldFragment } from "@/lib/types";
import { compareAddress } from "@/lib/utils";

interface AuctionData {
  bidder: Address;
  bid: bigint;
  startTime: number;
}

interface AuctionUpdate {
  token: Address;
  auction: AuctionData;
  isNewBid: boolean;
  timestamp: number;
}

interface UseAuctionRpcPollingOptions {
  tokens: Address[];
  enabled?: boolean;
  initialInterval?: number;
  maxInterval?: number;
  onNewBid?: (update: AuctionUpdate) => void;
}

export function useAuctionRpcPolling({
  tokens,
  enabled = true,
  initialInterval = 5000,
  maxInterval = 30000,
  onNewBid,
}: UseAuctionRpcPollingOptions) {
  const publicClient = usePublicClient();
  const { address } = useAccount();

  const [auctionUpdates, setAuctionUpdates] = useState<Map<Address, AuctionUpdate>>(new Map());
  const [isPolling, setIsPolling] = useState(false);
  const [pollingError, setPollingError] = useState<Error | null>(null);
  const [currentInterval, setCurrentInterval] = useState(initialInterval);

  const lastKnownBids = useRef<Map<Address, { bidder: Address; bid: bigint }>>(new Map());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const errorCountRef = useRef(0);
  const lastPollTime = useRef<number>(0);

  const pollAuctions = useCallback(async () => {
    if (!publicClient || !enabled || tokens.length === 0) return;

    const now = Date.now();
    if (now - lastPollTime.current < 1000) {
      return;
    }
    lastPollTime.current = now;

    setIsPolling(true);

    try {
      const auctionCalls = tokens.map(token => ({
        address: SirContract.address,
        abi: SirContract.abi,
        functionName: "auctions",
        args: [token],
      }));

      const results = await publicClient.multicall({
        contracts: auctionCalls,
      });

      const updates = new Map<Address, AuctionUpdate>();

      results.forEach((result, index) => {
        if (result.status === "success" && result.result) {
          const token = tokens[index];
          if (!token) return;

          const auctionResult = result.result as unknown as {
            bidder: Address;
            bid: bigint;
            startTime: bigint;
          };

          const auction: AuctionData = {
            bidder: auctionResult.bidder,
            bid: auctionResult.bid,
            startTime: Number(auctionResult.startTime),
          };

          const lastKnown = lastKnownBids.current.get(token);
          let isNewBid = false;

          // Check if bid changed (new bidder or new amount)
          const bidChanged = !lastKnown ||
                           !compareAddress(lastKnown.bidder, auction.bidder) ||
                           lastKnown.bid !== auction.bid;

          if (bidChanged) {
            // Pulse only if: there was a previous bid AND (no wallet connected OR bidder is not us)
            isNewBid = !!(lastKnown && (!address || !compareAddress(auction.bidder, address)));

            lastKnownBids.current.set(token, {
              bidder: auction.bidder,
              bid: auction.bid,
            });
          }

          const update: AuctionUpdate = {
            token,
            auction,
            isNewBid,
            timestamp: now,
          };

          updates.set(token, update);

          if (isNewBid && onNewBid) {
            onNewBid(update);
          }
        }
      });

      setAuctionUpdates(updates);
      setPollingError(null);

      if (errorCountRef.current > 0) {
        errorCountRef.current = 0;
        setCurrentInterval(initialInterval);
      }

    } catch (error) {
      console.error("Error polling auctions:", error);
      setPollingError(error as Error);

      errorCountRef.current++;
      const newInterval = Math.min(
        initialInterval * Math.pow(2, errorCountRef.current),
        maxInterval
      );
      setCurrentInterval(newInterval);

    } finally {
      setIsPolling(false);
    }
  }, [publicClient, enabled, tokens, address, initialInterval, maxInterval, onNewBid]);

  const reset = useCallback(() => {
    lastKnownBids.current.clear();
    setAuctionUpdates(new Map());
    errorCountRef.current = 0;
    setCurrentInterval(initialInterval);
    setPollingError(null);
  }, [initialInterval]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    void pollAuctions();

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      void pollAuctions();
    }, currentInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, currentInterval, pollAuctions]);

  const mergeWithServerData = useCallback((
    serverAuctions: AuctionFieldFragment[]
  ): { merged: AuctionFieldFragment[]; newBidsDetected: Address[] } => {
    const newBidsDetected: Address[] = [];

    const merged = serverAuctions.map(serverAuction => {
      const token = serverAuction.token as Address;
      const rpcUpdate = auctionUpdates.get(token);
      const lastKnown = lastKnownBids.current.get(token);

      // Determine which data is newer
      let finalBidder: string;
      let finalBid: string;
      let shouldPulse = false;

      if (!rpcUpdate?.auction) {
        // No RPC data, use server data
        finalBidder = serverAuction.highestBidder;
        finalBid = serverAuction.highestBid;
      } else {
        const rpcBid = rpcUpdate.auction.bid;
        const serverBid = BigInt(serverAuction.highestBid);

        if (rpcBid > serverBid) {
          // RPC data is newer
          finalBidder = rpcUpdate.auction.bidder;
          finalBid = rpcBid.toString();
          shouldPulse = !address || !compareAddress(finalBidder, address);
        } else {
          // Server data is newer or equal
          finalBidder = serverAuction.highestBidder;
          finalBid = serverAuction.highestBid;

          // Check if this is a new bid we haven't seen
          if (!lastKnown || lastKnown.bid < serverBid) {
            shouldPulse = !address || !compareAddress(finalBidder, address);
          }
        }
      }

      // Update last known and trigger pulse if needed
      if (!lastKnown || lastKnown.bid !== BigInt(finalBid) || !compareAddress(lastKnown.bidder, finalBidder)) {
        if (shouldPulse && lastKnown) {  // Only pulse if there was a previous bid
          newBidsDetected.push(token);
        }
        lastKnownBids.current.set(token, {
          bidder: finalBidder as Address,
          bid: BigInt(finalBid),
        });
      }

      return {
        ...serverAuction,
        highestBid: finalBid,
        highestBidder: finalBidder,
      };
    });

    return { merged, newBidsDetected };
  }, [auctionUpdates, address]);

  return {
    auctionUpdates,
    isPolling,
    pollingError,
    currentInterval,
    mergeWithServerData,
    reset,
  };
}