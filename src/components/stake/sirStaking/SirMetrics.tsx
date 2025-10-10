"use client";
import React, { useMemo } from "react";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { useStaking } from "@/contexts/StakingContext";
import { getSirSymbol } from "@/lib/assets";
import { formatUnits } from "viem";
import { getNativeCurrencySymbol } from "@/lib/chains";
import ToolTip from "@/components/ui/tooltip";

export function SirMetrics() {
  const {
    totalValueLocked,
    totalSupply,
    apr,
    unstakedSupplyLoading,
    totalSupplyLoading,
    unstakedSupply,
  } = useStaking();

  const isLoading = unstakedSupplyLoading || totalSupplyLoading || !totalSupply || !unstakedSupply;

  const stakedSupplyFormatted = totalValueLocked
    ? parseFloat(formatUnits(totalValueLocked, 12))
    : 0;

  const aprValue = apr ? parseFloat(apr.apr) : 0;
  const totalEthDistributed = apr?.totalEthDistributed
    ? BigInt(apr.totalEthDistributed)
    : 0n;

  const stakedPercentage = useMemo(() => {
    if (!totalSupply || totalSupply === 0n || !totalValueLocked) return 0;
    const staked = Number(totalValueLocked);
    const total = Number(totalSupply);
    return (staked / total) * 100;
  }, [totalSupply, totalValueLocked]);

  const ethDistributedFormatted =
    totalEthDistributed > 0n
      ? parseFloat(formatUnits(totalEthDistributed, 18))
      : 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pb-4">
        {/* Staked Supply Card */}
        <div className="flex h-[88px] flex-col justify-center rounded-md bg-primary/5 p-3 text-center dark:bg-primary">
          <div className="text-xs text-muted-foreground">Staked Supply</div>
          <div className="mt-1 h-7 w-20 animate-pulse rounded bg-foreground/10 mx-auto"></div>
          <div className="mt-1 h-4 w-16 animate-pulse rounded bg-foreground/10 mx-auto"></div>
        </div>
        {/* Total Dividends Card */}
        <div className="flex h-[88px] flex-col justify-center rounded-md bg-primary/5 p-3 text-center dark:bg-primary">
          <div className="flex items-center justify-center gap-x-1 text-xs text-muted-foreground">
            <span>Total Dividends</span>
            <ToolTip iconSize={12}>
              Dividends distributed to SIR stakers from protocol revenue.
            </ToolTip>
          </div>
          <div className="mt-1 h-7 w-20 animate-pulse rounded bg-foreground/10 mx-auto"></div>
          <div className="mt-1 h-4 w-16 animate-pulse rounded bg-foreground/10 mx-auto"></div>
        </div>
        {/* Staking APR Card */}
        <div className="flex h-[88px] flex-col justify-center rounded-md bg-primary/5 p-3 text-center dark:bg-primary">
          <div className="text-xs text-muted-foreground">Staking APR</div>
          <div className="mt-1 h-7 w-16 animate-pulse rounded bg-foreground/10 mx-auto"></div>
          <div className="mt-1 h-4 w-20 animate-pulse rounded bg-foreground/10 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pb-4">
      {/* Staked Supply Card */}
      <div className="flex h-[88px] flex-col justify-center rounded-md bg-primary/5 p-3 text-center dark:bg-primary">
        <div className="text-xs text-muted-foreground">Staked Supply</div>
        <div className="mt-1 text-lg font-semibold">
          <DisplayFormattedNumber num={stakedSupplyFormatted} significant={3} />{" "}
          {getSirSymbol()}
        </div>
        <div className="text-xs text-muted-foreground">
          <DisplayFormattedNumber num={stakedPercentage} significant={3} />% of
          total
        </div>
      </div>

      {/* Total Dividends Card */}
      <div className="flex h-[88px] flex-col justify-center rounded-md bg-primary/5 p-3 text-center dark:bg-primary">
        <div className="flex items-center justify-center gap-x-1 text-xs text-muted-foreground">
          <span>Total Dividends</span>
          <ToolTip iconSize={12}>
            Dividends distributed to SIR stakers from protocol revenue.
          </ToolTip>
        </div>
        <div className="mt-1 text-lg font-semibold">
          <DisplayFormattedNumber
            num={ethDistributedFormatted}
            significant={3}
          />{" "}
          {getNativeCurrencySymbol()}
        </div>
        <div className="text-xs text-muted-foreground">in the last 30 days</div>
      </div>

      {/* Staking APR Card */}
      <div className="flex h-[88px] flex-col justify-center rounded-md bg-primary/5 p-3 text-center dark:bg-primary">
        <div className="text-xs text-muted-foreground">Staking APR</div>
        <div className="mt-1 text-lg font-semibold">
          {aprValue > 0 ? (
            <>
              <DisplayFormattedNumber num={aprValue} significant={3} />%
            </>
          ) : (
            "0%"
          )}
        </div>
        <div className="text-xs text-muted-foreground">30-day average</div>
      </div>
    </div>
  );
}
