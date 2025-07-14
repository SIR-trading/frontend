"use client";

import { api } from "@/trpc/react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { TokenDisplay } from "@/components/ui/token-display";
import { Card } from "@/components/ui/card";
import Show from "@/components/shared/show";
import { useAccount } from "wagmi";

const StakeData = ({ children }: { children: ReactNode }) => {
  const { 
    data: unstakedSupply, 
    isLoading: unstakedSupplyLoading 
  } = api.user.getSirSupply.useQuery();
  const { 
    data: totalSupply, 
    isLoading: totalSupplyLoading 
  } = api.user.getSirTotalSupply.useQuery();

  const { address, isConnected } = useAccount();
  const { 
    data: stakedPosition, 
    isLoading: stakedPositionLoading 
  } = api.user.getStakedSirPosition.useQuery(
    { user: address ?? "0x" },
    { enabled: isConnected },
  );

  const totalValueLocked = useMemo(() => {
    if (totalSupply !== undefined && unstakedSupply !== undefined) {
      return totalSupply - unstakedSupply;
    }
  }, [unstakedSupply, totalSupply]);

  const isLoadingTVL = unstakedSupplyLoading || totalSupplyLoading || !totalValueLocked;
  const isLoadingUserStake = stakedPositionLoading;

  return (
    <div className="mx-auto grid gap-4 font-normal md:w-[600px] md:grid-cols-3  ">
      <Card className="flex flex-col  items-center justify-center gap-2 rounded-md bg-secondary py-2">
        <div className="text-sm font-normal text-gray-300">
          Total Staked SIR
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
              unitLabel="SIR"
            />
          </Show>
        </div>
      </Card>

      <Card className="flex flex-col items-center justify-center gap-2 rounded-md bg-secondary py-2">
        <div className="flex w-full flex-row items-center justify-center">
          <div className="px-2 text-sm text-gray-300">Your Staked SIR</div>
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
                <div className="text-sm text-foreground/60 text-center">
                  Connect wallet to view
                </div>
              )
            }
          >
            <TokenDisplay
              amount={stakedPosition?.unlockedStake}
              decimals={12}
              unitLabel={"SIR Unlocked"}
            />
            <TokenDisplay
              amount={stakedPosition?.lockedStake}
              decimals={12}
              unitLabel={"SIR Locked"}
            />
          </Show>
        </div>
      </Card>

      {children}
    </div>
  );
};

export default StakeData;
