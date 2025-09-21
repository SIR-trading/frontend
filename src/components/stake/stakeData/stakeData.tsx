"use client";

import type { ReactNode } from "react";
import { TokenDisplay } from "@/components/ui/token-display";
import { Card } from "@/components/ui/card";
import Show from "@/components/shared/show";
import { useAccount } from "wagmi";
import { getSirSymbol } from "@/lib/assets";
import { Lock, LockOpen } from "lucide-react";
import HoverPopup from "@/components/ui/hover-popup";
import { useStaking } from "@/contexts/StakingContext";

const StakeData = ({ children }: { children: ReactNode }) => {
  const { isConnected } = useAccount();

  const {
    stakedPosition,
    totalValueLocked,
    unstakedSupplyLoading,
    totalSupplyLoading,
    stakedLoading: stakedPositionLoading,
  } = useStaking();

  const isLoadingTVL = unstakedSupplyLoading || totalSupplyLoading;
  const isLoadingUserStake = stakedPositionLoading;

  return (
    <div className="mx-auto grid gap-4 font-normal md:grid-cols-3  ">
      <Card className="flex flex-col  items-center justify-center gap-2 rounded-md bg-secondary py-2">
        <div className="text-sm font-normal text-muted-foreground">
          Total Staked
        </div>
        {/* <div className="text-2xl font-semibold ">
          {parseFloat(formatUnits(totalValueLocked ?? 0n, 12)).toFixed(4)}
        </div> */}
        <div className=" text-2xl font-normal">
          <Show
            when={!isLoadingTVL}
            fallback={
              <div className="h-8 w-20 bg-foreground/10 rounded animate-pulse"></div>
            }
          >
            <TokenDisplay
              amount={totalValueLocked}
              decimals={12}
              unitLabel={getSirSymbol()}
              amountSize="medium"
            />
          </Show>
        </div>
      </Card>

      <Card className="flex flex-col items-center justify-center gap-2 rounded-md bg-secondary py-2">
        <div className="flex w-full flex-row items-center justify-center">
          <div className="px-2 text-sm text-muted-foreground">Your Stake</div>
        </div>
        <div className=" text-2xl ">
          <Show 
            when={isConnected && !isLoadingUserStake && !!stakedPosition} 
            fallback={
              isConnected ? (
                <div className="space-y-2">
                  <div className="h-6 w-24 bg-foreground/10 rounded animate-pulse"></div>
                  <div className="h-6 w-24 bg-foreground/10 rounded animate-pulse"></div>
                </div>
              ) : (
                <div className="text-sm text-foreground italic text-center">
                  Connect to see your stake
                </div>
              )
            }
          >
            <div className="flex flex-col gap-1">
              <HoverPopup
                trigger={
                  <div className="flex items-center gap-1 justify-center cursor-default">
                    <LockOpen className="h-4 w-4 text-muted-foreground" />
                    <TokenDisplay
                      amount={stakedPosition?.unlockedStake ?? 0n}
                      decimals={12}
                      unitLabel={getSirSymbol()}
                      amountSize="medium"
                    />
                  </div>
                }
                size="200"
              >
                <div className="text-xs font-normal">
                  Available to withdraw anytime
                </div>
              </HoverPopup>
              <HoverPopup
                trigger={
                  <div className="flex items-center gap-1 justify-center cursor-default">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <TokenDisplay
                      amount={stakedPosition?.lockedStake ?? 0n}
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
      </Card>

      {children}
    </div>
  );
};

export default StakeData;
