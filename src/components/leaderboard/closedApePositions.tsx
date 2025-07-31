"use client";
import React from "react";
import { api } from "@/trpc/react";
import ExpandablePositions from "@/components/leaderboard/expandablePositions";
import LeaderboardTable from "@/components/leaderboard/leaderboardTable";
import type { TClosedApePositions } from "@/lib/types";
import useApePositions from "@/hooks/useApePositions";

const ClosedApePositions = () => {
  const {
    data: { closedApePositions },
    isLoading,
  } = useApePositions();

  const { data: vaults } = api.vault.getVaults.useQuery(
    {
      sortbyVaultId: true,
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      placeholderData: (previousData) => previousData,
    },
  );

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
      vaults={vaults}
      extractTotal={(item) => item.total}
      extractPositions={(item) => item.positions}
    />
  );
};

export default ClosedApePositions;
