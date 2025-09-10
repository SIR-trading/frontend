import { getActiveApePositions } from "@/server/leaderboard/getActiveApePositions";
import { NextResponse } from "next/server";
import { env } from "@/env";
import { createClient } from "redis";
import { getCurrentApePositions } from "@/server/queries/leaderboard";

// Force this route to be dynamic and never cache at Next.js level
export const dynamic = 'force-dynamic';
export const revalidate = 0;

let redis: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (!redis) {
    try {
      redis = await createClient({ url: env.REDIS_URL }).connect();
      console.log("Redis connected successfully");
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      // Return null if Redis fails to connect
      return null;
    }
  }
  return redis;
}

const chainId = env.NEXT_PUBLIC_CHAIN_ID;
const CACHE_KEY = `leaderboard:${chainId}:activePositions`;
const CACHE_TIMESTAMP_KEY = `leaderboard:${chainId}:activePositions:timestamp`;
const CACHE_TTL_SECONDS = 30 * 60; // 30 minutes

export async function GET() {
  try {
    // Try to get Redis client but don't fail if it's not available
    const redisClient = await getRedisClient();
    
    // Try to get cached data if Redis is available
    if (redisClient) {
      try {
        const [cached, cachedTimestamp] = await Promise.all([
          redisClient.get(CACHE_KEY),
          redisClient.get(CACHE_TIMESTAMP_KEY),
        ]);
        
        if (cached && cachedTimestamp) {
          const cacheAge = Date.now() - parseInt(cachedTimestamp);
          const maxCacheAge = CACHE_TTL_SECONDS * 1000; // Convert to milliseconds
          
          // Check if cache is still valid (not expired)
          if (cacheAge < maxCacheAge) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const parsedCache = JSON.parse(cached);
            console.log(`Returning cached leaderboard positions (age: ${Math.round(cacheAge / 1000)}s)`);
            return NextResponse.json(parsedCache, {
              headers: {
                'Cache-Control': 'private, no-cache, no-store, must-revalidate',
                'X-Cache-Status': 'redis-hit',
                'X-Cache-Age': Math.round(cacheAge / 1000).toString(),
              },
            });
          } else {
            console.log(`Cache expired (age: ${Math.round(cacheAge / 1000)}s). Fetching fresh data.`);
          }
        }
      } catch (cacheError) {
        console.error("Error reading from cache:", cacheError);
        // Continue without cache
      }
    }

    // Fetch fresh data

    const activeApePositions = await getActiveApePositions();

    console.log("Fetched new leaderboard positions");

    // Try to cache the result if Redis is available
    if (redisClient) {
      try {
        await Promise.all([
          redisClient.set(CACHE_KEY, JSON.stringify(activeApePositions), {
            EX: CACHE_TTL_SECONDS, // Cache for 30 minutes
          }),
          redisClient.set(CACHE_TIMESTAMP_KEY, Date.now().toString(), {
            EX: CACHE_TTL_SECONDS, // Same TTL for timestamp
          }),
        ]);
        console.log("Cached new leaderboard positions");
      } catch (cacheError) {
        console.error("Error writing to cache:", cacheError);
        // Continue without caching
      }
    }

    // Prevent Vercel Edge caching - let Redis handle caching
    return NextResponse.json(activeApePositions, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Cache-Status': redisClient ? 'redis-miss' : 'redis-unavailable',
      },
    });
  } catch (error) {
    console.error("Error in leaderboard API:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard data" },
      { status: 500 },
    );
  }
}
