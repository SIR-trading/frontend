"use client";
import React, { createContext, useContext, type ReactNode } from "react";
import { useAccount, useReadContract } from "wagmi";
import { api } from "@/trpc/react";
import { useEffect, useState, useMemo } from "react";
import { useClaim } from "@/components/stake/hooks/useClaim";
import { env } from "@/env";
import { UniswapV3StakerContract } from "@/contracts/uniswapV3Staker";
import { SirContract } from "@/contracts/sir";

interface ClaimableBalancesContextType {
  hasClaimableBalances: boolean;
  dividendsAmount: bigint;
  rewardsAmount: bigint;
  stakingRewardsAmount: bigint;
  contributorRewardsAmount: bigint;
  teaRewardsAmount: bigint;
  lpStakingRewardsAmount: bigint;
  isLoading: boolean;
  hasDividendsAboveThreshold: boolean;
  hasRewardsAboveThreshold: boolean;
  hasContributorRewardsAboveThreshold: boolean;
  hasVaultRewardsAboveThreshold: boolean;
  hasLpStakingRewardsAboveThreshold: boolean;
}

const ClaimableBalancesContext = createContext<ClaimableBalancesContextType | undefined>(undefined);

export function ClaimableBalancesProvider({ children }: { children: ReactNode }) {
  const { isConnected, address } = useAccount();
  const [hasClaimableBalances, setHasClaimableBalances] = useState(false);

  // Determine thresholds based on chain
  const { dividendsThreshold, rewardsThreshold } = useMemo(() => {
    const chainId = parseInt(env.NEXT_PUBLIC_CHAIN_ID);
    const isHyperEVM = chainId === 998 || chainId === 999;
    return {
      // 1 HYPE for HyperEVM, 0.01 ETH for Ethereum
      dividendsThreshold: isHyperEVM ? 1000000000000000000n : 10000000000000000n,
      // 100k SIR for rewards
      rewardsThreshold: 100000000000000000n
    };
  }, []);

  // Get ETH/HYPE dividends
  const { data: dividends } = api.user.getUserSirDividends.useQuery(
    { user: address },
    {
      enabled: isConnected && !!address,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchInterval: false,
    }
  );

  // Get SIR/HyperSIR rewards from staking
  const { claimData } = useClaim();

  // Get contributor rewards
  const { data: contributorRewards } = api.user.getUnclaimedContributorRewards.useQuery(
    { user: address },
    {
      enabled: isConnected && !!address,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchInterval: false,
    }
  );

  // Get TEA vault rewards (unclaimedSirRewards for each vault)
  const { data: userBalancesInVaults } = api.user.getUserBalancesInVaults.useQuery(
    { address },
    {
      enabled: isConnected && !!address,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    }
  );

  // Get LP staking rewards from Uniswap V3 Staker
  const { data: lpStakingRewards } = useReadContract({
    address: UniswapV3StakerContract.address,
    abi: UniswapV3StakerContract.abi,
    functionName: 'rewards',
    args: address ? [SirContract.address, address] : undefined,
    query: {
      enabled: isConnected && !!address,
    },
  });

  // Calculate total TEA vault rewards and check if any single vault meets threshold
  const totalTeaRewards = useMemo(() => {
    if (!userBalancesInVaults?.unclaimedSirRewards) return 0n;
    return userBalancesInVaults.unclaimedSirRewards.reduce(
      (sum, reward) => sum + (reward ?? 0n),
      0n
    );
  }, [userBalancesInVaults?.unclaimedSirRewards]);

  // Check if any single vault has rewards above threshold
  const hasAnyVaultAboveThreshold = useMemo(() => {
    if (!userBalancesInVaults?.unclaimedSirRewards) return false;
    return userBalancesInVaults.unclaimedSirRewards.some(
      reward => reward && reward >= rewardsThreshold
    );
  }, [userBalancesInVaults?.unclaimedSirRewards, rewardsThreshold]);

  useEffect(() => {
    const hasDividends = Boolean(dividends && dividends > 0n);
    const hasStakingRewards = Boolean(claimData?.result && claimData.result > 0n);
    const hasContributorRewards = Boolean(contributorRewards && contributorRewards > 0n);
    const hasTeaRewards = Boolean(totalTeaRewards && totalTeaRewards > 0n);
    const hasLpStaking = Boolean(lpStakingRewards && lpStakingRewards > 0n);
    setHasClaimableBalances(hasDividends || hasStakingRewards || hasContributorRewards || hasTeaRewards || hasLpStaking);
  }, [dividends, claimData?.result, contributorRewards, totalTeaRewards, lpStakingRewards]);

  // Check if dividends meet threshold
  const hasDividendsAboveThreshold = Boolean(dividends && dividends >= dividendsThreshold);

  // Check if contributor rewards meet threshold
  const hasContributorRewardsAboveThreshold = Boolean(
    contributorRewards && contributorRewards >= rewardsThreshold
  );

  // Check if LP staking rewards meet threshold
  const hasLpStakingRewardsAboveThreshold = Boolean(
    lpStakingRewards && lpStakingRewards >= rewardsThreshold
  );

  // Check if any rewards meet threshold individually (for backwards compatibility)
  const hasRewardsAboveThreshold = Boolean(
    /* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */
    hasContributorRewardsAboveThreshold ||
    hasAnyVaultAboveThreshold ||
    hasLpStakingRewardsAboveThreshold
  );

  const value = useMemo(() => ({
    hasClaimableBalances,
    dividendsAmount: dividends ?? 0n,
    rewardsAmount: (claimData?.result ?? 0n) + (contributorRewards ?? 0n) + totalTeaRewards + (lpStakingRewards ?? 0n),
    stakingRewardsAmount: claimData?.result ?? 0n,
    contributorRewardsAmount: contributorRewards ?? 0n,
    teaRewardsAmount: totalTeaRewards,
    lpStakingRewardsAmount: lpStakingRewards ?? 0n,
    isLoading: !dividends && !claimData && !contributorRewards && !userBalancesInVaults && !lpStakingRewards,
    hasDividendsAboveThreshold,
    hasRewardsAboveThreshold,
    hasContributorRewardsAboveThreshold,
    hasVaultRewardsAboveThreshold: hasAnyVaultAboveThreshold,
    hasLpStakingRewardsAboveThreshold,
  }), [
    hasClaimableBalances,
    dividends,
    claimData,
    contributorRewards,
    totalTeaRewards,
    lpStakingRewards,
    userBalancesInVaults,
    hasDividendsAboveThreshold,
    hasRewardsAboveThreshold,
    hasContributorRewardsAboveThreshold,
    hasAnyVaultAboveThreshold,
    hasLpStakingRewardsAboveThreshold,
  ]);

  return (
    <ClaimableBalancesContext.Provider value={value}>
      {children}
    </ClaimableBalancesContext.Provider>
  );
}

export function useClaimableBalances() {
  const context = useContext(ClaimableBalancesContext);
  if (context === undefined) {
    throw new Error("useClaimableBalances must be used within a ClaimableBalancesProvider");
  }
  return context;
}