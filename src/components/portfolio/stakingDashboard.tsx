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
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useClaim } from "../stake/hooks/useClaim";
import { useEffect, useMemo } from "react";
import { Coins, TrendingDown, Wallet } from "lucide-react";
import ToolTip from "../ui/tooltip";
import DisplayFormattedNumber from "../shared/displayFormattedNumber";

export default function StakingDashboard() {
  const [stakeModal, setStakeModal] = useState(false);
  const [unstakeModal, setUnstakeModal] = useState(false);
  const [claimModal, setClaimModal] = useState(false);
  
  const { isConnected, address } = useAccount();
  
  // Fetch protocol data
  const { data: unstakedSupply, isLoading: unstakedSupplyLoading } = api.user.getSirSupply.useQuery();
  const { data: totalSupply, isLoading: totalSupplyLoading } = api.user.getSirTotalSupply.useQuery();
  const { data: apr, isLoading: aprLoading } = api.user.getMonthlyApr.useQuery();
  
  const totalValueLocked = useMemo(() => {
    if (totalSupply !== undefined && unstakedSupply !== undefined) {
      return totalSupply - unstakedSupply;
    }
    return 0n;
  }, [unstakedSupply, totalSupply]);
  
  // Fetch balances
  const { data: unstakedBalance, isLoading: unstakedLoading } = api.user.getUnstakedSirBalance.useQuery(
    { user: address },
    { enabled: isConnected }
  );
  
  const { data: stakedPosition, isLoading: stakedLoading } = api.user.getStakedSirPosition.useQuery(
    { user: address ?? "0x" },
    { enabled: isConnected }
  );
  
  const { data: dividends, isLoading: dividendsLoading } = api.user.getUserSirDividends.useQuery(
    { user: address },
    { enabled: isConnected }
  );
  
  const stakedSir = stakedPosition ?? { unlockedStake: 0n, lockedStake: 0n };
  const totalStaked = stakedSir.unlockedStake + stakedSir.lockedStake;
  
  // Claim logic
  const { claimData } = useClaim();
  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isSuccess: isConfirmed, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });
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
  
  const isLoading = unstakedLoading || stakedLoading || dividendsLoading;
  
  return (
    <Card className="w-full">
      <div className="p-6">
        {/* Protocol Stats */}
        <div className="rounded-lg bg-secondary/30 dark:bg-secondary/20 p-4 mb-8">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Protocol Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-background/50 dark:bg-background/30 p-4">
              <div className="text-sm text-muted-foreground mb-1">Total Staked SIR</div>
              {unstakedSupplyLoading || totalSupplyLoading ? (
                <div className="h-8 w-32 bg-foreground/10 rounded animate-pulse"></div>
              ) : (
                <div className="text-xl font-semibold">
                  <TokenDisplay
                    amount={totalValueLocked}
                    decimals={12}
                    unitLabel="SIR"
                    amountSize="small"
                  />
                </div>
              )}
            </div>
            <div className="rounded-lg bg-background/50 dark:bg-background/30 p-4">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-sm text-muted-foreground">Staking APR</span>
                <ToolTip size="300">
                  <div className="rounded-sm bg-primary/5 text-[13px] font-medium backdrop-blur-xl dark:bg-primary">
                    <span>
                      The APR is estimated using the past 30 days&apos; dividend data.
                    </span>
                  </div>
                </ToolTip>
              </div>
              {aprLoading ? (
                <div className="h-8 w-20 bg-foreground/10 rounded animate-pulse"></div>
              ) : (
                <div className="text-xl font-semibold">
                  {apr && parseFloat(apr.apr) > 0 ? (
                    <>
                      <DisplayFormattedNumber num={parseFloat(apr.apr)} />%
                    </>
                  ) : (
                    'N/A'
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Personal Balance Overview */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Your Balances</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Unstaked Balance */}
            <div className="rounded-lg bg-primary/5 dark:bg-primary p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Unstaked</span>
                </div>
                <Show 
                  when={isConnected && !unstakedLoading} 
                  fallback={
                    isConnected ? (
                      <div className="h-7 w-24 bg-foreground/10 rounded animate-pulse mb-8"></div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic mb-8">Connect wallet</div>
                    )
                  }
                >
                  <div className="text-2xl font-semibold mb-3">
                    <TokenDisplay
                      amount={unstakedBalance}
                      decimals={12}
                      unitLabel="SIR"
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
            <div className="rounded-lg bg-primary/5 dark:bg-primary p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Staked</span>
                </div>
                <Show 
                  when={isConnected && !stakedLoading} 
                  fallback={
                    isConnected ? (
                      <div className="h-7 w-24 bg-foreground/10 rounded animate-pulse mb-8"></div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic mb-8">Connect wallet</div>
                    )
                  }
                >
                  {totalStaked > 0n ? (
                    <div className="space-y-1 mb-3">
                      {stakedSir.lockedStake > 0n && (
                        <div className="text-2xl font-semibold">
                          <TokenDisplay
                            amount={stakedSir.lockedStake}
                            decimals={12}
                            unitLabel="SIR locked"
                          />
                        </div>
                      )}
                      {stakedSir.unlockedStake > 0n && (
                        <div className="text-2xl font-semibold">
                          <TokenDisplay
                            amount={stakedSir.unlockedStake}
                            decimals={12}
                            unitLabel="SIR unlocked"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-2xl font-semibold mb-3">
                      <TokenDisplay
                        amount={0n}
                        decimals={12}
                        unitLabel="SIR"
                      />
                    </div>
                  )}
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
            <div className="rounded-lg bg-primary/5 dark:bg-primary p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Dividends</span>
                </div>
                <Show 
                  when={isConnected && !dividendsLoading} 
                  fallback={
                    isConnected ? (
                      <div className="h-7 w-24 bg-foreground/10 rounded animate-pulse mb-8"></div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic mb-8">Connect wallet</div>
                    )
                  }
                >
                  <div className="text-2xl font-semibold mb-3">
                    <TokenDisplay
                      amount={dividends}
                      decimals={18}
                      unitLabel="ETH"
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
              <h3 className="font-medium">Claiming ETH Rewards</h3>
              <div className="text-2xl font-semibold">
                <TokenDisplay
                  disableRounding
                  amount={dividends}
                  unitLabel="ETH"
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