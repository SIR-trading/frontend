import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import type { TPositionsResponse } from "@/lib/types";
import { getClosedApePositions } from "@/server/leaderboard/getClosedApePositions";

export const leaderboardRouter = createTRPCRouter({
  getClosedApePositions: publicProcedure.query(getClosedApePositions),

  getActiveApePositions: publicProcedure.query(async () => {
    const res = await fetch(`/api/leaderboard`);
    const data = (await res.json()) as TPositionsResponse;
    return data.activeApePositions;
  }),
});
