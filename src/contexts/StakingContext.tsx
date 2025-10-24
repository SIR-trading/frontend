"use client";
import React, { createContext, useContext, type ReactNode, useMemo } from "react";
import { useAccount } from "wagmi";
import { api } from "@/trpc/react";

interface StakingContextType {
  // User-specific data
  unstakedBalance: bigint | undefined;
  stakedPosition: { unlockedStake: bigint; lockedStake: bigint } | undefined;
  unstakedLoading: boolean;
  stakedLoading: boolean;

  // Protocol-wide data
  totalSupply: bigint | undefined;
  unstakedSupply: bigint | undefined;
  totalValueLocked: bigint;
  apr: { apr: string; latestTimestamp: number; totalEthDistributed: string } | undefined;
  totalSupplyLoading: boolean;
  unstakedSupplyLoading: boolean;
  aprLoading: boolean;
  aprError: boolean;
}

const StakingContext = createContext<StakingContextType | undefined>(undefined);

export function StakingProvider({ children }: { children: ReactNode }) {
  const { isConnected, address } = useAccount();

  // User-specific queries
  const { data: unstakedBalance, isLoading: unstakedLoading } = api.user.getUnstakedSirBalance.useQuery(
    { user: address },
    {
      enabled: isConnected && !!address,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    }
  );

  const { data: stakedPosition, isLoading: stakedLoading } = api.user.getStakedSirPosition.useQuery(
    { user: address ?? "0x" },
    {
      enabled: isConnected,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    }
  );

  // Protocol-wide queries
  const { data: totalSupply, isLoading: totalSupplyLoading } = api.user.getSirTotalSupply.useQuery(
    undefined,
    {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
    }
  );

  const { data: unstakedSupply, isLoading: unstakedSupplyLoading } = api.user.getSirSupply.useQuery(
    undefined,
    {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
    }
  );

  const { data: apr, isLoading: aprLoading, isError: aprError } = api.user.getMonthlyApr.useQuery(
    undefined,
    {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );

  // Calculate total value locked
  const totalValueLocked = useMemo(() => {
    if (totalSupply && unstakedSupply) {
      return totalSupply - unstakedSupply;
    }
    return 0n;
  }, [totalSupply, unstakedSupply]);

  const value = useMemo(() => ({
    unstakedBalance,
    stakedPosition,
    unstakedLoading,
    stakedLoading,
    totalSupply,
    unstakedSupply,
    totalValueLocked,
    apr,
    totalSupplyLoading,
    unstakedSupplyLoading,
    aprLoading,
    aprError,
  }), [
    unstakedBalance,
    stakedPosition,
    unstakedLoading,
    stakedLoading,
    totalSupply,
    unstakedSupply,
    totalValueLocked,
    apr,
    totalSupplyLoading,
    unstakedSupplyLoading,
    aprLoading,
    aprError,
  ]);

  return (
    <StakingContext.Provider value={value}>
      {children}
    </StakingContext.Provider>
  );
}

export function useStaking() {
  const context = useContext(StakingContext);
  if (context === undefined) {
    throw new Error("useStaking must be used within a StakingProvider");
  }
  return context;
}