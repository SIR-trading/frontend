import { getActiveApePositions } from "@/server/leaderboard/getActiveApePositions";
import { createClient } from "redis";
import { NextResponse } from "next/server";
import { env } from "@/env";

const redis = await createClient({ url: env.REDIS_URL }).connect();

const CACHE_KEY = "leaderboard:closedPositions";

export async function GET() {
  const cached = await redis.get(CACHE_KEY);
  if (cached) {
    console.log("Returning cached leaderboard positions");
    return NextResponse.json(JSON.parse(cached));
  }

  const [activeApePositions] = await Promise.all([getActiveApePositions()]);

  const result = { activeApePositions };
  console.log("Fetched new leaderboard positions");
  await redis.set(CACHE_KEY, JSON.stringify(result), {
    EX: 60 * 30, // Cache for 10 minutes
  });
  return NextResponse.json(result);
}
