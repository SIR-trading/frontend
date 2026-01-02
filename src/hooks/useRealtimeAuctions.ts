import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import { api } from '@/trpc/react';
import { env } from '@/env';

// Types for WebSocket events
interface BidReceivedEvent {
  bidder: string;
  token: string;
  previousBid: string;
  newBid: string;
  txHash: string;
  blockNumber: number;
}

interface AuctionStartedEvent {
  token: string;
  feesToBeAuctioned: string;
  txHash: string;
  blockNumber: number;
}

interface AuctionSettledEvent {
  winner: string;
  beneficiary: string;
  token: string;
  reward: string;
  txHash: string;
  blockNumber: number;
}

interface UseRealtimeAuctionsReturn {
  connected: boolean;
  lastBid: BidReceivedEvent | null;
  lastAuctionStarted: AuctionStartedEvent | null;
  lastAuctionSettled: AuctionSettledEvent | null;
}

const WEBSOCKET_URL = env.NEXT_PUBLIC_WEBSOCKET_URL;

/**
 * Hook for real-time auction updates via WebSocket
 */
export function useRealtimeAuctions(): UseRealtimeAuctionsReturn {
  const [connected, setConnected] = useState(false);
  const [lastBid, setLastBid] = useState<BidReceivedEvent | null>(null);
  const [lastAuctionStarted, setLastAuctionStarted] = useState<AuctionStartedEvent | null>(null);
  const [lastAuctionSettled, setLastAuctionSettled] = useState<AuctionSettledEvent | null>(null);

  const utils = api.useUtils();

  useEffect(() => {
    // Skip if WebSocket URL not configured
    if (!WEBSOCKET_URL) {
      return;
    }

    const socket: Socket = io(WEBSOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('[WS] Connected to real-time server');
      setConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[WS] Disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      // Silent failure - app continues working without real-time updates
      console.log('[WS] Connection unavailable:', err.message);
      setConnected(false);
    });

    // Handle bid received events
    socket.on('bidReceived', (data: BidReceivedEvent) => {
      console.log('[WS] Bid received:', data);
      setLastBid(data);
      // Invalidate auction queries to refresh data
      void utils.auction.getOngoingAuctions.invalidate();
    });

    // Handle auction started events
    socket.on('auctionStarted', (data: AuctionStartedEvent) => {
      console.log('[WS] Auction started:', data);
      setLastAuctionStarted(data);
      void utils.auction.getallAuctions.invalidate();
      void utils.auction.getOngoingAuctions.invalidate(); // New auction appears in Active tab
      void utils.vault.getTotalCollateralFeesInVault.invalidate();
    });

    // Handle auction settled events
    socket.on('auctionSettled', (data: AuctionSettledEvent) => {
      console.log('[WS] Auction settled:', data);
      setLastAuctionSettled(data);
      void utils.auction.getOngoingAuctions.invalidate();
      void utils.auction.getExpiredAuctions.invalidate();
    });

    // Handle recent events on connect
    socket.on('recentEvents', (events: Array<{ type: string; data: unknown }>) => {
      console.log('[WS] Received recent events:', events.length);
    });

    return () => {
      socket.disconnect();
    };
  }, [utils]);

  return {
    connected,
    lastBid,
    lastAuctionStarted,
    lastAuctionSettled,
  };
}

/**
 * Simpler hook that just provides connection status and triggers refetch on events
 * Use this in the auction page to get live updates
 */
export function useAuctionLiveUpdates() {
  const { connected, lastBid } = useRealtimeAuctions();

  return {
    isLive: connected,
    // The lastBid changing will trigger re-renders in components using this hook
    lastBidTimestamp: lastBid ? Date.now() : null,
  };
}
