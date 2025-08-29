"use client";
import React from "react";
import ExpandablePositions from "@/components/leaderboard/expandablePositions";
import LeaderboardTable from "@/components/leaderboard/leaderboardTable";
import type { TClosedApePositions } from "@/lib/types";
import { api } from "@/trpc/react";

const LastMonthClosedPositions = () => {
  const { data: lastMonthPositions, isLoading } =
    api.leaderboard.getLastMonthClosedPositions.useQuery();

  return (
    <LeaderboardTable<
      TClosedApePositions[string],
      TClosedApePositions[string]["positions"]
    >
      data={lastMonthPositions}
      isLoading={isLoading}
      pnlLabel="PnL"
      pnlPercentageLabel="% PnL"
      emptyStateMessage="No APE positions closed last month."
      expandableComponent={ExpandablePositions}
      extractTotal={(item) => item.total}
      extractPositions={(item) => item.positions}
      extractRank={(item) => item.rank}
    />
  );
};

export default LastMonthClosedPositions;