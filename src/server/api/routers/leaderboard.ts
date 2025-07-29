import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import type { TPositionsResponse } from "@/lib/types";

export const leaderboardRouter = createTRPCRouter({
  getClosedApePositions: publicProcedure.query(async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/leaderboard`,
    );
    const data = (await res.json()) as TPositionsResponse;
    return data.closedApePositions;
  }),
  getActiveApePositions: publicProcedure.query(async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/leaderboard`,
    );
    const data = (await res.json()) as TPositionsResponse;
    return data.activeApePositions;
  }),
});
