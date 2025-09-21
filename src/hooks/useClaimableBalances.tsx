import { useAccount } from "wagmi";
import { api } from "@/trpc/react";
import { useEffect, useState } from "react";
import { useClaim } from "@/components/stake/hooks/useClaim";

export function useClaimableBalances() {
  const { isConnected, address } = useAccount();
  const [hasClaimableBalances, setHasClaimableBalances] = useState(false);

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

  return {
    hasClaimableBalances,
    dividendsAmount: dividends ?? 0n,
    rewardsAmount: (claimData?.result ?? 0n) + (contributorRewards ?? 0n),
    stakingRewardsAmount: claimData?.result ?? 0n,
    contributorRewardsAmount: contributorRewards ?? 0n,
    isLoading: !dividends && !claimData && !contributorRewards,
  } as const;
}