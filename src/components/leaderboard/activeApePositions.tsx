"use client";
import React from "react";
import { api } from "@/trpc/react";
import ExpandableActivePositions from "@/components/leaderboard/expandableActivePositions";
import LeaderboardTable from "@/components/leaderboard/leaderboardTable";
import type { TCurrentApePositions } from "@/lib/types";
import useApePositions from "@/hooks/useApePositions";

const ActiveApePositions = () => {
  const {
    data: { activeApePositions: openApePositions },
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
      TCurrentApePositions[string],
      TCurrentApePositions[string]["positions"]
    >
      data={openApePositions}
      isLoading={isLoading}
      pnlLabel="Current PnL [USD]"
      pnlPercentageLabel="Current % PnL"
      emptyStateMessage="No active APE positions found."
      expandableComponent={ExpandableActivePositions}
      vaults={vaults}
      extractTotal={(item) => item.total}
      extractPositions={(item) => item.positions}
    />
  );
};

export default ActiveApePositions;
