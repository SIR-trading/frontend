"use client";
import React from "react";
import ExpandableActivePositions from "@/components/leaderboard/expandableActivePositions";
import LeaderboardTable from "@/components/leaderboard/leaderboardTable";
import type { TCurrentApePositions } from "@/lib/types";
import useApePositions from "@/hooks/useApePositions";

const ActiveApePositions = () => {
  const {
    data: { activeApePositions: openApePositions },
    isLoading,
  } = useApePositions();

  return (
    <LeaderboardTable<
      TCurrentApePositions[string],
      TCurrentApePositions[string]["positions"]
    >
      data={openApePositions}
      isLoading={isLoading}
      pnlLabel="Current PnL [USD]"
      pnlPercentageLabel="Current % PnL"
      emptyStateMessage="No active APE positions found."
      expandableComponent={ExpandableActivePositions}
      extractTotal={(item) => item.total}
      extractPositions={(item) => item.positions}
    />
  );
};

export default ActiveApePositions;
