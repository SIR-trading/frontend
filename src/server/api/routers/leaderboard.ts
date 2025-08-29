import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { getClosedApePositions } from "@/server/leaderboard/getClosedApePositions";
import { getLastMonthClosedPositions } from "@/server/leaderboard/getLastMonthClosedPositions";

export const leaderboardRouter = createTRPCRouter({
  getClosedApePositions: publicProcedure.query(getClosedApePositions),
  getLastMonthClosedPositions: publicProcedure.query(getLastMonthClosedPositions),
});
