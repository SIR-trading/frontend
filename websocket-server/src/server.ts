import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createPublicClient, webSocket, type Address, parseAbiItem } from 'viem';

// Environment variables
const PORT = process.env.PORT ?? 8080;
const WSS_URL = process.env.ALCHEMY_WSS_URL;
const SIR_CONTRACT = process.env.SIR_CONTRACT_ADDRESS as Address;
const FRONTEND_URLS = process.env.FRONTEND_URLS?.split(',') ?? ['http://localhost:3000'];

if (!WSS_URL) {
  console.error('ALCHEMY_WSS_URL environment variable is required');
  process.exit(1);
}

if (!SIR_CONTRACT) {
  console.error('SIR_CONTRACT_ADDRESS environment variable is required');
  process.exit(1);
}

// SIR Contract Events ABI
const EVENTS = {
  AuctionStarted: parseAbiItem('event AuctionStarted(address indexed token, uint256 feesToBeAuctioned)'),
  BidReceived: parseAbiItem('event BidReceived(address indexed bidder, address indexed token, uint96 previousBid, uint96 newBid)'),
  AuctionedTokensSentToWinner: parseAbiItem('event AuctionedTokensSentToWinner(address indexed winner, address indexed beneficiary, address indexed token, uint256 reward)'),
  DividendsPaid: parseAbiItem('event DividendsPaid(uint96 amountETH, uint80 amountStakedSIR)'),
  Staked: parseAbiItem('event Staked(address indexed staker, uint80 amount)'),
  Unstaked: parseAbiItem('event Unstaked(address indexed staker, uint80 amount)'),
};

// Express app setup
const app = express();
app.use(cors({ origin: FRONTEND_URLS }));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    connections: io.engine.clientsCount,
    uptime: process.uptime(),
    watching: !!client,
  });
});

// Create HTTP server and Socket.IO
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URLS,
    methods: ['GET', 'POST'],
  },
  pingInterval: 25000,
  pingTimeout: 60000,
});

// In-memory cache for recent events (for reconnecting clients)
interface CachedEvent {
  id: string;
  type: string;
  timestamp: number;
  data: Record<string, unknown>;
}

const recentEvents: CachedEvent[] = [];
const MAX_CACHED_EVENTS = 50;

function addEvent(event: CachedEvent) {
  // Avoid duplicates
  if (recentEvents.some(e => e.id === event.id)) return;

  recentEvents.unshift(event);
  if (recentEvents.length > MAX_CACHED_EVENTS) {
    recentEvents.pop();
  }

  // Broadcast to all connected clients
  io.emit(event.type, event.data);
  console.log(`[Event] ${event.type}:`, event.data);
}

// Viem client for watching blockchain events
let client: ReturnType<typeof createPublicClient> | null = null;
const unwatchFunctions: (() => void)[] = [];

async function setupEventWatchers() {
  console.log('[Viem] Connecting to WebSocket...');

  client = createPublicClient({
    transport: webSocket(WSS_URL, {
      reconnect: {
        attempts: 10,
        delay: 1000,
      },
      keepAlive: {
        interval: 30_000,
      },
    }),
  });

  // Watch AuctionStarted events
  const unwatchAuctionStarted = client.watchContractEvent({
    address: SIR_CONTRACT,
    abi: [EVENTS.AuctionStarted],
    eventName: 'AuctionStarted',
    onLogs: (logs) => {
      logs.forEach((log) => {
        const event: CachedEvent = {
          id: `${log.transactionHash}-${log.logIndex}`,
          type: 'auctionStarted',
          timestamp: Date.now(),
          data: {
            token: log.args.token,
            feesToBeAuctioned: log.args.feesToBeAuctioned?.toString(),
            txHash: log.transactionHash,
            blockNumber: Number(log.blockNumber),
          },
        };
        addEvent(event);
      });
    },
    onError: (error) => console.error('[Viem] AuctionStarted watch error:', error),
  });
  unwatchFunctions.push(unwatchAuctionStarted);

  // Watch BidReceived events
  const unwatchBidReceived = client.watchContractEvent({
    address: SIR_CONTRACT,
    abi: [EVENTS.BidReceived],
    eventName: 'BidReceived',
    onLogs: (logs) => {
      logs.forEach((log) => {
        const event: CachedEvent = {
          id: `${log.transactionHash}-${log.logIndex}`,
          type: 'bidReceived',
          timestamp: Date.now(),
          data: {
            bidder: log.args.bidder,
            token: log.args.token,
            previousBid: log.args.previousBid?.toString(),
            newBid: log.args.newBid?.toString(),
            txHash: log.transactionHash,
            blockNumber: Number(log.blockNumber),
          },
        };
        addEvent(event);
      });
    },
    onError: (error) => console.error('[Viem] BidReceived watch error:', error),
  });
  unwatchFunctions.push(unwatchBidReceived);

  // Watch AuctionedTokensSentToWinner events
  const unwatchAuctionWon = client.watchContractEvent({
    address: SIR_CONTRACT,
    abi: [EVENTS.AuctionedTokensSentToWinner],
    eventName: 'AuctionedTokensSentToWinner',
    onLogs: (logs) => {
      logs.forEach((log) => {
        const event: CachedEvent = {
          id: `${log.transactionHash}-${log.logIndex}`,
          type: 'auctionSettled',
          timestamp: Date.now(),
          data: {
            winner: log.args.winner,
            beneficiary: log.args.beneficiary,
            token: log.args.token,
            reward: log.args.reward?.toString(),
            txHash: log.transactionHash,
            blockNumber: Number(log.blockNumber),
          },
        };
        addEvent(event);
      });
    },
    onError: (error) => console.error('[Viem] AuctionedTokensSentToWinner watch error:', error),
  });
  unwatchFunctions.push(unwatchAuctionWon);

  // Watch DividendsPaid events
  const unwatchDividends = client.watchContractEvent({
    address: SIR_CONTRACT,
    abi: [EVENTS.DividendsPaid],
    eventName: 'DividendsPaid',
    onLogs: (logs) => {
      logs.forEach((log) => {
        const event: CachedEvent = {
          id: `${log.transactionHash}-${log.logIndex}`,
          type: 'dividendsPaid',
          timestamp: Date.now(),
          data: {
            amountETH: log.args.amountETH?.toString(),
            amountStakedSIR: log.args.amountStakedSIR?.toString(),
            txHash: log.transactionHash,
            blockNumber: Number(log.blockNumber),
          },
        };
        addEvent(event);
      });
    },
    onError: (error) => console.error('[Viem] DividendsPaid watch error:', error),
  });
  unwatchFunctions.push(unwatchDividends);

  console.log('[Viem] Event watchers set up for:', Object.keys(EVENTS).join(', '));
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Send recent events to newly connected client
  socket.emit('recentEvents', recentEvents.slice(0, 10));

  socket.on('disconnect', (reason) => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id} | Reason: ${reason}`);
  });
});

// Graceful shutdown
function shutdown() {
  console.log('[Server] Shutting down...');

  // Unwatch all events
  unwatchFunctions.forEach((unwatch) => unwatch());

  // Close Socket.IO
  void io.close(() => {
    console.log('[Socket.IO] Closed');
  });

  // Close HTTP server
  server.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start server
async function main() {
  try {
    await setupEventWatchers();

    server.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT}`);
      console.log(`[Server] Allowed origins: ${FRONTEND_URLS.join(', ')}`);
      console.log(`[Server] Watching contract: ${SIR_CONTRACT}`);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

void main();
