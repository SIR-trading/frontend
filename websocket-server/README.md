# SIR WebSocket Server

Real-time WebSocket server for SIR auction events. Watches blockchain events via Viem and broadcasts to connected clients via Socket.IO.

## Events Watched

- `AuctionStarted` - New auction begins
- `BidReceived` - New bid placed on auction
- `AuctionedTokensSentToWinner` - Auction settled
- `DividendsPaid` - Dividends distributed to stakers

## Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Edit .env with your values
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ALCHEMY_WSS_URL` | WebSocket URL from Alchemy (e.g., `wss://eth-mainnet.g.alchemy.com/v2/YOUR_KEY`) |
| `SIR_CONTRACT_ADDRESS` | SIR contract address to watch |
| `FRONTEND_URLS` | Comma-separated list of allowed CORS origins |
| `PORT` | Server port (default: 8080) |

## Development

```bash
pnpm dev
```

## Production

```bash
pnpm build
pnpm start
```

## Railway Deployment

1. Create a new project on Railway
2. Connect this repository
3. Set environment variables in Railway dashboard
4. Deploy

The server exposes a `/health` endpoint for health checks.

## Frontend Integration

```typescript
import { useRealtimeAuctions } from '@/hooks/useRealtimeAuctions';

function AuctionPage() {
  const { connected, lastBid, error } = useRealtimeAuctions();

  return (
    <div>
      {connected && <span className="live-indicator">LIVE</span>}
      {/* Auctions will auto-update when bids come in */}
    </div>
  );
}
```

## Socket.IO Events Emitted

| Event | Description | Payload |
|-------|-------------|---------|
| `bidReceived` | New bid on auction | `{ bidder, token, previousBid, newBid, txHash, blockNumber }` |
| `auctionStarted` | New auction started | `{ token, feesToBeAuctioned, txHash, blockNumber }` |
| `auctionSettled` | Auction winner claimed | `{ winner, beneficiary, token, reward, txHash, blockNumber }` |
| `dividendsPaid` | Dividends distributed | `{ amountETH, amountStakedSIR, txHash, blockNumber }` |
| `recentEvents` | Sent on connect | Array of last 10 events |
