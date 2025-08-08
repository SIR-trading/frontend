import { getActiveApePositions } from "@/server/leaderboard/getActiveApePositions";
import { NextResponse } from "next/server";
import { env } from "@/env";
import { createClient } from "redis";
import { getCurrentApePositions } from "@/server/queries/leaderboard";

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

const CACHE_KEY = "leaderboard:closedPositions";

export async function GET() {
  try {
    // Try to get Redis client but don't fail if it's not available
    const redisClient = await getRedisClient();
    // Fetch current ape positions to allow faster invalidation of cache
    const { apePositions } = await getCurrentApePositions();
    const apePositionsLength = apePositions.length;

    // Try to get cached data if Redis is available
    if (redisClient) {
      try {
        const cached = await redisClient.get(CACHE_KEY);
        if (cached) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const parsedCache = JSON.parse(cached);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          const parsedCacheLength = Object.keys(parsedCache).length;
          // Validate length to ensure there is no new comment at this point, This method is experimental and can be removed if it's not needed
          if (parsedCacheLength !== apePositionsLength) {
            console.log(
              `Cache length mismatch: ${parsedCacheLength} vs ${apePositionsLength}. Fetching fresh data.`,
            );
          } else {
            // If cache is valid, return cached data
            console.log("Returning cached leaderboard positions");
            return NextResponse.json(parsedCache);
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
        await redisClient.set(CACHE_KEY, JSON.stringify(activeApePositions), {
          EX: 60 * 30, // Cache for 30 minutes
        });
      } catch (cacheError) {
        console.error("Error writing to cache:", cacheError);
        // Continue without caching
      }
    }

    return NextResponse.json(activeApePositions);
  } catch (error) {
    console.error("Error in leaderboard API:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard data" },
      { status: 500 },
    );
  }
}
