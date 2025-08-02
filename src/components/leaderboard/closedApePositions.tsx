"use client";
import React from "react";
import ExpandablePositions from "@/components/leaderboard/expandablePositions";
import LeaderboardTable from "@/components/leaderboard/leaderboardTable";
import type { TClosedApePositions } from "@/lib/types";
import useApePositions from "@/hooks/useApePositions";

const ClosedApePositions = () => {
  const {
    data: { closedApePositions },
    isLoading,
  } = useApePositions();

  return (
    <LeaderboardTable<
      TClosedApePositions[string],
      TClosedApePositions[string]["positions"]
    >
      data={closedApePositions}
      isLoading={isLoading}
      pnlLabel="PnL [USD]"
      pnlPercentageLabel="% PnL"
      emptyStateMessage="No APE positions closed in the last week."
      expandableComponent={ExpandablePositions}
      extractTotal={(item) => item.total}
      extractPositions={(item) => item.positions}
      extractRank={(item) => item.rank}
    />
  );
};

export default ClosedApePositions;
