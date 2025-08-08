import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { getClosedApePositions } from "@/server/leaderboard/getClosedApePositions";

export const leaderboardRouter = createTRPCRouter({
  getClosedApePositions: publicProcedure.query(getClosedApePositions),
});
