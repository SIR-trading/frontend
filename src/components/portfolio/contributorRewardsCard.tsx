import React, { useEffect, useState } from "react";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
  useReadContract,
  useChainId,
} from "wagmi";
import { api } from "@/trpc/react";
import { SirContract } from "@/contracts/sir";
import { ContributorsContract } from "@/contracts/contributors";
import { Button } from "../ui/button";
import { SirRewardsClaimModal } from "../shared/SirRewardsClaimModal";
import { TokenDisplay } from "../ui/token-display";
import Show from "../shared/show";
import { getSirSymbol } from "@/lib/assets";
import buildData from "@/../public/build-data.json";
import ToolTip from "../ui/tooltip";
import DisplayFormattedNumber from "../shared/displayFormattedNumber";

export default function ContributorRewardsCard() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  // Show allocation % for non-Ethereum chains (not mainnet or Sepolia)
  const showAllocation = chainId !== 1 && chainId !== 11155111;

  const { data: unclaimedData, isLoading: rewardsLoading } =
    api.user.getUnclaimedContributorRewards.useQuery(
      { user: address },
      { enabled: isConnected },
    );
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState(false);
  const { writeContract, reset, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Fetch user's allocation from Contributors contract (HyperEVM only)
  const { data: userAllocation } = useReadContract({
    ...ContributorsContract,
    functionName: "allocations",
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && showAllocation && !!address,
    },
  });

  // Calculate allocation percentage
  // Formula: allocation / maxAllocation * (ISSUANCE - LP_ISSUANCE_FIRST_3_YEARS) / ISSUANCE * 100
  const calculateAllocationPercentage = (): number | null => {
    if (!userAllocation || userAllocation === 0n) return null;

    // Check if contributorConstants exists in build data
    const buildDataWithConstants = buildData as typeof buildData & {
      contributorConstants?: {
        issuanceRate: string | number | bigint;
        lpIssuanceFirst3Years: string | number | bigint;
      };
    };

    if (!buildDataWithConstants.contributorConstants) return null;

    // Ethereum (1), Sepolia (11155111), and HyperEVM (998, 999) use uint56, all others use uint16
    const UINT56_MAX = 72057594037927935n; // 2^56 - 1
    const UINT16_MAX = 65535n; // 2^16 - 1
    const maxAllocation =
      chainId === 1 || chainId === 11155111 || chainId === 998 || chainId === 999
        ? UINT56_MAX
        : UINT16_MAX;

    const issuanceRate = BigInt(
      buildDataWithConstants.contributorConstants.issuanceRate,
    );
    const lpIssuance = BigInt(
      buildDataWithConstants.contributorConstants.lpIssuanceFirst3Years,
    );

    // Calculate: allocation / maxAllocation
    const allocationRatio = Number(userAllocation) / Number(maxAllocation);

    // Calculate: (ISSUANCE - LP_ISSUANCE_FIRST_3_YEARS) / ISSUANCE
    const contributorIssuanceRatio =
      Number(issuanceRate - lpIssuance) / Number(issuanceRate);

    // Final percentage
    const percentage = allocationRatio * contributorIssuanceRatio * 100;

    return percentage;
  };

  const allocationPercentage = showAllocation
    ? calculateAllocationPercentage()
    : null;
  const onSubmit = () => {
    if (isConfirmed) {
      setOpen(false);
      return;
    }
    writeContract({
      ...SirContract,
      functionName: !checked ? "contributorMint" : "contributorMintAndStake",
    });
  };
  const utils = api.useUtils();
  // Invalidate queries after successful tx
  useEffect(() => {
    if (isConfirmed && !open) {
      utils.user.getUnclaimedContributorRewards
        .invalidate()
        .catch((e) => console.log(e));
      utils.user.getUnstakedSirBalance
        .invalidate()
        .catch((e) => console.log(e));
      if (checked) {
        utils.user.getStakedSirPosition
          .invalidate()
          .catch((e) => console.log(e));
      }
      reset();
    }
  }, [
    isConfirmed,
    reset,
    open,
    utils.user.getUnclaimedContributorRewards,
    utils.user.getUnstakedSirBalance,
    utils.user.getTotalSirBalance,
    checked,
    utils.user.getStakedSirPosition,
  ]);

  const unclaimedRewards = unclaimedData ?? 0n;
  const hasContributorRewards = unclaimedRewards && unclaimedRewards > 0n;

  return (
    <div>
      {hasContributorRewards && (
        <SirRewardsClaimModal
          open={open}
          setOpen={setOpen}
          unclaimedAmount={unclaimedData}
          isPending={isPending}
          isConfirming={isConfirming}
          isConfirmed={isConfirmed}
          hash={hash}
          claimAndStake={checked}
          setClaimAndStake={setChecked}
          onSubmit={onSubmit}
          checkboxLabel="Mint and stake"
        />
      )}

      {hasContributorRewards ? (
        <>
          <h2 className="pb-4 text-sm font-medium">SIR Allocation</h2>
          <div
            className={`relative h-full rounded-md bg-primary/5 p-4 dark:bg-primary ${unclaimedRewards >= 100000000000000000n ? "claim-card-gold-glow" : ""}`}
          >
            <div className="flex justify-between rounded-md text-2xl">
              <div className="flex gap-x-2">
                <div className="flex w-full justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 pb-1">
                      <h2 className="text-sm text-muted-foreground">
                        Contributor Rewards
                      </h2>
                      {showAllocation && allocationPercentage !== null && (
                        <>
                          <ToolTip iconSize={14} size="250">
                            You own{" "}
                            <DisplayFormattedNumber
                              num={allocationPercentage}
                              significant={2}
                            />
                            % of SIR&apos;s issuance during the first 3 years.
                            Return anytime to mint accumulated rewards.
                          </ToolTip>
                          <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs font-medium text-primary dark:bg-gold dark:text-foreground">
                            <DisplayFormattedNumber
                              num={allocationPercentage}
                              significant={2}
                            />
                            %
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex min-h-[32px] items-baseline justify-between text-3xl">
                      <div className="flex items-end gap-x-1">
                        <Show
                          when={isConnected && !rewardsLoading}
                          fallback={
                            isConnected ? (
                              <div className="h-8 w-20 animate-pulse rounded bg-foreground/10"></div>
                            ) : (
                              <div className="text-sm italic text-foreground mt-1">
                                Connect to claim rewards
                              </div>
                            )
                          }
                        >
                          <TokenDisplay
                            amount={unclaimedRewards}
                            decimals={12}
                            unitLabel={getSirSymbol()}
                          />
                        </Show>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  disabled={!isConnected || !unclaimedRewards || unclaimedRewards === 0n}
                  onClick={() => setOpen(true)}
                  className="w-20 py-2"
                >
                  Claim
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex h-full min-h-[80px] items-center justify-center p-2">
          {/* Empty state - no text */}
        </div>
      )}
    </div>
  );
}
