import React, { useEffect, useState } from "react";
import {
  useAccount,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { api } from "@/trpc/react";
import { SirContract } from "@/contracts/sir";
import { Button } from "../ui/button";
import { SirRewardsClaimModal } from "../shared/SirRewardsClaimModal";
import { TokenDisplay } from "../ui/token-display";
import Show from "../shared/show";
import { getSirSymbol } from "@/lib/assets";

export default function ContributorRewardsCard() {
  const { isConnected, address } = useAccount();
  const { data: unclaimedData, isLoading: rewardsLoading } =
    api.user.getUnclaimedContributorRewards.useQuery(
      { user: address },
      { enabled: isConnected },
    );
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState(false);
  const { data } = useSimulateContract({
    ...SirContract,
    functionName: !checked ? "contributorMint" : "contributorMintAndStake",
  });
  const { writeContract, reset, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });
  const onSubmit = () => {
    if (isConfirmed) {
      setOpen(false);
      return;
    }
    if (data?.request) {
      writeContract(data?.request);
    }
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
        <div
          className={`relative h-full rounded-md bg-primary/5 p-4 dark:bg-primary ${unclaimedRewards >= 100000000000000000n ? "claim-card-gold-glow" : ""}`}
        >
          <div className="flex justify-between rounded-md text-2xl">
            <div className="flex gap-x-2">
              <div className="flex w-full justify-between">
                <div>
                  <h2 className="pb-1 text-sm text-muted-foreground">
                    Contributor Rewards
                  </h2>
                  <div className="flex min-h-[32px] justify-between text-3xl">
                    <div className="flex items-end gap-x-1">
                      <Show
                        when={isConnected && !rewardsLoading}
                        fallback={
                          isConnected ? (
                            <div className="h-8 w-20 animate-pulse rounded bg-foreground/10"></div>
                          ) : (
                            <div className="text-sm italic text-foreground">
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
                disabled={!isConnected || !unclaimedRewards || !data?.request}
                onClick={() => setOpen(true)}
                className="w-20 py-2"
              >
                Claim
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-full min-h-[80px] items-center justify-center p-2">
          {/* Empty state - no text */}
        </div>
      )}
    </div>
  );
}
