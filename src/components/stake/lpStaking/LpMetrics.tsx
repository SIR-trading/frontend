"use client";
import React from "react";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import ToolTip from "@/components/ui/tooltip";

interface LpMetricsProps {
  totalValueStakedUsd: number;
  inRangeValueStakedUsd: number;
  stakingApr: number | null; // null means TBD
  isLoading?: boolean;
}

export function LpMetrics({
  totalValueStakedUsd,
  inRangeValueStakedUsd,
  stakingApr,
  isLoading = false,
}: LpMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
        {/* Staked Liquidity Card */}
        <div className="flex h-[88px] flex-col justify-center rounded-md bg-primary/5 p-3 text-center dark:bg-primary">
          <div className="flex items-center justify-center gap-x-1 text-xs text-muted-foreground">
            <span>Staked Liquidity</span>
          </div>
          <div className="mx-auto mt-1 h-7 w-24 animate-pulse rounded bg-foreground/10"></div>
          <div className="mx-auto mt-1 h-4 w-20 animate-pulse rounded bg-foreground/10"></div>
        </div>
        {/* Staking APR Card */}
        <div className="flex h-[88px] flex-col justify-center rounded-md bg-primary/5 p-3 text-center dark:bg-primary">
          <div className="flex items-center justify-center gap-x-1 text-xs text-muted-foreground">
            <span>Staking APR</span>
          </div>
          <div className="mx-auto mt-1 h-7 w-16 animate-pulse rounded bg-foreground/10"></div>
          <div className="mx-auto mt-1 h-4 w-20 animate-pulse rounded bg-foreground/10"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
      {/* Staked Liquidity Card */}
      <div className="flex h-[88px] flex-col justify-center rounded-md bg-primary/5 p-3 text-center dark:bg-primary">
        <div className="flex items-center justify-center gap-x-1 text-xs text-muted-foreground">
          <span>Staked Liquidity</span>
          <ToolTip iconSize={12}>
            In-range Uniswap V3 positions have liquidity at the current price and actively earn trading fees and SIR rewards.
          </ToolTip>
        </div>
        <div className="mt-1 text-lg font-semibold">
          {inRangeValueStakedUsd > 0 ? (
            <>
              <DisplayFormattedNumber
                num={inRangeValueStakedUsd}
                significant={3}
              />
            </>
          ) : (
            "0"
          )}
          {" USD "}
          <span className="text-[10px] font-normal text-muted-foreground/70">
            in-range
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          {totalValueStakedUsd - inRangeValueStakedUsd > 0 ? (
            <DisplayFormattedNumber
              num={totalValueStakedUsd - inRangeValueStakedUsd}
              significant={3}
            />
          ) : (
            "0"
          )}{" "}
          <span className="text-muted-foreground/70">USD out-of-range</span>
        </div>
      </div>

      {/* Staking APR Card */}
      <div className="flex h-[88px] flex-col justify-center rounded-md bg-primary/5 p-3 text-center dark:bg-primary">
        <div className="flex items-center justify-center gap-x-1 text-xs text-muted-foreground">
          <span>Staking APR</span>
          <ToolTip iconSize={12}>
            APR from SIR rewards only. Does not include Uniswap trading fees.
          </ToolTip>
        </div>
        <div className="mt-1 text-lg font-semibold">
          {stakingApr !== null ? (
            <>
              <DisplayFormattedNumber num={stakingApr} significant={3} />%
            </>
          ) : (
            "TBD"
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {stakingApr !== null ? "Based on current TVL" : "To be determined"}
        </div>
      </div>
    </div>
  );
}
