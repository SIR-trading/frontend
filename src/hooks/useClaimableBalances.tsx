import { useAccount } from "wagmi";
import { api } from "@/trpc/react";
import { useEffect, useState, useMemo } from "react";
import { useClaim } from "@/components/stake/hooks/useClaim";
import { env } from "@/env";

export function useClaimableBalances() {
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

  useEffect(() => {
    const hasDividends = Boolean(dividends && dividends > 0n);
    const hasStakingRewards = Boolean(claimData?.result && claimData.result > 0n);
    const hasContributorRewards = Boolean(contributorRewards && contributorRewards > 0n);
    setHasClaimableBalances(hasDividends || hasStakingRewards || hasContributorRewards);
  }, [dividends, claimData?.result, contributorRewards]);

  // Check if dividends meet threshold
  const hasDividendsAboveThreshold = Boolean(dividends && dividends >= dividendsThreshold);

  // Check if any rewards meet threshold
  const stakingRewards = claimData?.result ?? 0n;
  const hasRewardsAboveThreshold = Boolean(
    (stakingRewards >= rewardsThreshold) ||
    (contributorRewards && contributorRewards >= rewardsThreshold)
  );

  return {
    hasClaimableBalances,
    dividendsAmount: dividends ?? 0n,
    rewardsAmount: (claimData?.result ?? 0n) + (contributorRewards ?? 0n),
    stakingRewardsAmount: claimData?.result ?? 0n,
    contributorRewardsAmount: contributorRewards ?? 0n,
    isLoading: !dividends && !claimData && !contributorRewards,
    hasDividendsAboveThreshold,
    hasRewardsAboveThreshold,
  } as const;
}