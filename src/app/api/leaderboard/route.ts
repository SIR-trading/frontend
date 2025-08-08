import { getActiveApePositions } from "@/server/leaderboard/getActiveApePositions";
import { NextResponse } from "next/server";
import { env } from "@/env";
import { createClient } from "redis";

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
    
    // Try to get cached data if Redis is available
    if (redisClient) {
      try {
        const cached = await redisClient.get(CACHE_KEY);
        if (cached) {
          console.log("Returning cached leaderboard positions");
          return NextResponse.json(JSON.parse(cached));
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
