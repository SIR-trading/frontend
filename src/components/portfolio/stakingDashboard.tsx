"use client";
import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { TokenDisplay } from "../ui/token-display";
import { StakeModal } from "../shared/stake/stakeModal";
import StakeFormProvider from "../providers/stakeFormProvider";
import UnstakeFormProvider from "../providers/unstakeFormProvider";
import { UnstakeModal } from "./unstakeModal";
import TransactionModal from "../shared/transactionModal";
import TransactionSuccess from "../shared/transactionSuccess";
import ContributorClaim from "./contributorClaim";
import Show from "../shared/show";
import { api } from "@/trpc/react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useClaim } from "../stake/hooks/useClaim";
import { useEffect } from "react";
import { Coins, TrendingDown, Wallet, Lock, LockOpen } from "lucide-react";
import ToolTip from "../ui/tooltip";
import HoverPopup from "../ui/hover-popup";
import DisplayFormattedNumber from "../shared/displayFormattedNumber";
import { getNativeCurrencySymbol } from "@/lib/chains";
import { getSirSymbol } from "@/lib/assets";
import { useStaking } from "@/contexts/StakingContext";

export default function StakingDashboard() {
  const [stakeModal, setStakeModal] = useState(false);
  const [unstakeModal, setUnstakeModal] = useState(false);
  const [claimModal, setClaimModal] = useState(false);

  const { isConnected, address } = useAccount();

  // Use StakingContext for all staking-related queries
  const {
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
  } = useStaking();

  const { data: dividends, isLoading: dividendsLoading } =
    api.user.getUserSirDividends.useQuery(
      { user: address },
      { enabled: isConnected },
    );

  const stakedSir = stakedPosition ?? { unlockedStake: 0n, lockedStake: 0n };

  // Claim logic
  const { claimData } = useClaim();
  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isSuccess: isConfirmed, isLoading: isConfirming } =
    useWaitForTransactionReceipt({ hash });
  const utils = api.useUtils();

  const onClaim = () => {
    if (claimData?.request) {
      writeContract(claimData?.request);
    }
  };

  useEffect(() => {
    if (isConfirmed && !claimModal) {
      reset();
    }
  }, [isConfirmed, reset, claimModal]);

  useEffect(() => {
    if (isConfirmed) {
      utils.user.getUserSirDividends.invalidate().catch((e) => console.log(e));
    }
  }, [isConfirmed, utils.user.getUserSirDividends]);

  return (
    <Card className="w-full">
      <div className="p-6">
        {/* Protocol Stats */}
        <div className="mb-8 rounded-lg bg-secondary/30 p-4 dark:bg-secondary/20">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            Protocol Statistics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-background/50 p-4 dark:bg-background/30">
              <div className="mb-1 text-sm text-muted-foreground">
                Total Staked
              </div>
              {(unstakedSupplyLoading || totalSupplyLoading) &&
              (totalSupply === undefined || unstakedSupply === undefined) ? (
                <div className="h-8 w-32 animate-pulse rounded bg-foreground/10"></div>
              ) : (
                <div className="text-xl font-semibold">
                  <TokenDisplay
                    amount={totalValueLocked}
                    decimals={12}
                    unitLabel={getSirSymbol()}
                    amountSize="medium"
                  />
                </div>
              )}
            </div>
            <div className="rounded-lg bg-background/50 p-4 dark:bg-background/30">
              <div className="mb-1 flex items-center gap-1">
                <span className="text-sm text-muted-foreground">
                  Staking APR
                </span>
                <ToolTip size="300">
                  <span>
                    The APR is estimated using the past 30 days&apos; dividend
                    data.
                  </span>
                </ToolTip>
              </div>
              {aprLoading ? (
                <div className="h-8 w-20 animate-pulse rounded bg-foreground/10"></div>
              ) : (
                <div className="text-xl font-semibold">
                  {apr && parseFloat(apr.apr) > 0 ? (
                    <>
                      <DisplayFormattedNumber num={apr.apr} />%
                    </>
                  ) : (
                    "N/A"
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Personal Balance Overview */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            Your Balances
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Unstaked Balance */}
            <div className="flex flex-col justify-between rounded-lg bg-primary/5 p-4 dark:bg-primary">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Unstaked
                  </span>
                </div>
                <Show
                  when={isConnected && !unstakedLoading}
                  fallback={
                    isConnected ? (
                      <div className="mb-8 h-7 w-24 animate-pulse rounded bg-foreground/10"></div>
                    ) : (
                      <div className="mb-8 text-sm italic text-muted-foreground">
                        Connect wallet
                      </div>
                    )
                  }
                >
                  <div className="mb-3 text-2xl font-semibold">
                    <TokenDisplay
                      amount={unstakedBalance}
                      decimals={12}
                      unitLabel={getSirSymbol()}
                      amountSize="medium"
                    />
                  </div>
                </Show>
              </div>
              <Button
                onClick={() => setStakeModal(true)}
                disabled={!isConnected || !Number(unstakedBalance)}
                className="w-full"
              >
                Stake
              </Button>
            </div>

            {/* Staked Balance */}
            <div className="flex flex-col justify-between rounded-lg bg-primary/5 p-4 dark:bg-primary">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Coins className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Staked</span>
                </div>
                <Show
                  when={isConnected && !stakedLoading}
                  fallback={
                    isConnected ? (
                      <div className="mb-8 h-7 w-24 animate-pulse rounded bg-foreground/10"></div>
                    ) : (
                      <div className="mb-8 text-sm italic text-muted-foreground">
                        Connect wallet
                      </div>
                    )
                  }
                >
                  <div className="mb-3 space-y-1">
                    <HoverPopup
                      trigger={
                        <div className="flex cursor-default items-center gap-1 text-2xl font-semibold">
                          <LockOpen className="h-4 w-4 text-muted-foreground" />
                          <TokenDisplay
                            amount={stakedSir.unlockedStake}
                            decimals={12}
                            unitLabel={getSirSymbol()}
                            amountSize="medium"
                          />
                        </div>
                      }
                      size="200"
                    >
                      <div className="text-xs font-normal">
                        Available to withdraw
                      </div>
                    </HoverPopup>
                    <HoverPopup
                      trigger={
                        <div className="flex cursor-default items-center gap-1 text-2xl font-semibold">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                          <TokenDisplay
                            amount={stakedSir.lockedStake}
                            decimals={12}
                            unitLabel={getSirSymbol()}
                            amountSize="medium"
                          />
                        </div>
                      }
                      size="200"
                    >
                      <div className="text-xs font-normal">
                        Locked stake cannot be withdrawn yet
                      </div>
                    </HoverPopup>
                  </div>
                </Show>
              </div>
              <Button
                onClick={() => setUnstakeModal(true)}
                disabled={!isConnected || !Number(stakedSir.unlockedStake)}
                variant="outline"
                className="w-full"
              >
                Unstake
              </Button>
            </div>

            {/* Claimable Rewards */}
            <div className="flex flex-col justify-between rounded-lg bg-primary/5 p-4 dark:bg-primary">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Dividends
                  </span>
                </div>
                <Show
                  when={isConnected && !dividendsLoading}
                  fallback={
                    isConnected ? (
                      <div className="mb-8 h-7 w-24 animate-pulse rounded bg-foreground/10"></div>
                    ) : (
                      <div className="mb-8 text-sm italic text-muted-foreground">
                        Connect wallet
                      </div>
                    )
                  }
                >
                  <div className="mb-3 text-2xl font-semibold">
                    <TokenDisplay
                      amount={dividends}
                      decimals={18}
                      unitLabel={getNativeCurrencySymbol()}
                      amountSize="medium"
                    />
                  </div>
                </Show>
              </div>
              <Button
                onClick={() => setClaimModal(true)}
                disabled={!isConnected || !Number(dividends)}
                variant="outline"
                className="w-full"
              >
                Claim
              </Button>
            </div>
          </div>
        </div>

        {/* Contributor Claim - if applicable */}
        <div>
          <ContributorClaim />
        </div>
      </div>

      {/* Modals */}
      <StakeFormProvider>
        <StakeModal setOpen={setStakeModal} open={stakeModal} />
      </StakeFormProvider>

      <UnstakeFormProvider>
        <UnstakeModal open={unstakeModal} setOpen={setUnstakeModal} />
      </UnstakeFormProvider>

      {/* Claim Modal */}
      <TransactionModal.Root
        title="Claim Rewards"
        setOpen={setClaimModal}
        open={claimModal}
      >
        <TransactionModal.InfoContainer isConfirming={isConfirming} hash={hash}>
          {!isConfirmed && (
            <div className="space-y-2">
              <h3 className="font-medium">
                Claiming {getNativeCurrencySymbol()} Rewards
              </h3>
              <div className="text-2xl font-semibold">
                <TokenDisplay
                  disableRounding
                  amount={dividends}
                  unitLabel={getNativeCurrencySymbol()}
                />
              </div>
            </div>
          )}
          {isConfirmed && <TransactionSuccess hash={hash} />}
        </TransactionModal.InfoContainer>
        <TransactionModal.Close setOpen={setClaimModal} />
        <TransactionModal.StatSubmitContainer>
          <TransactionModal.SubmitButton
            isPending={isPending}
            isConfirmed={isConfirmed}
            disabled={isPending || isConfirming}
            loading={isConfirming}
            onClick={() => {
              if (isConfirmed) {
                setClaimModal(false);
              } else {
                onClaim();
              }
            }}
          >
            {isConfirmed ? "Close" : "Confirm Claim"}
          </TransactionModal.SubmitButton>
        </TransactionModal.StatSubmitContainer>
      </TransactionModal.Root>
    </Card>
  );
}
