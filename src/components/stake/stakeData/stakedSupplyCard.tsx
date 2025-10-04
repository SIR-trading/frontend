"use client";
import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import Show from "@/components/shared/show";
import { TokenDisplay } from "@/components/ui/token-display";
import { getSirSymbol } from "@/lib/assets";
import { useStaking } from "@/contexts/StakingContext";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";

export default function StakedSupplyCard() {
  const {
    totalValueLocked,
    totalSupply,
    unstakedSupplyLoading,
    totalSupplyLoading
  } = useStaking();

  const isLoading = unstakedSupplyLoading || totalSupplyLoading;

  const stakedPercentage = useMemo(() => {
    if (!totalSupply || totalSupply === 0n || !totalValueLocked) return 0;
    const staked = Number(totalValueLocked);
    const total = Number(totalSupply);
    return (staked / total) * 100;
  }, [totalSupply, totalValueLocked]);

  return (
    <Card className="flex flex-col items-center justify-center gap-3 rounded-md bg-secondary p-6 transition-colors hover:bg-secondary/80">
      <div className="text-sm font-normal text-muted-foreground">
        Staked Supply
      </div>
      <Show
        when={!isLoading}
        fallback={
          <div className="space-y-2">
            <div className="h-8 w-32 animate-pulse rounded bg-foreground/10"></div>
            <div className="h-4 w-20 animate-pulse rounded bg-foreground/10"></div>
          </div>
        }
      >
        <div className="space-y-2 text-center">
          <TokenDisplay
            amount={totalValueLocked}
            decimals={12}
            unitLabel={getSirSymbol()}
            className="text-2xl"
          />
          <div className="text-xs text-muted-foreground">
            <DisplayFormattedNumber num={stakedPercentage} significant={2} />% of total
          </div>
        </div>
      </Show>
    </Card>
  );
}