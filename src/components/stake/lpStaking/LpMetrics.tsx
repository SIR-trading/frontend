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
      <div className="grid grid-cols-2 gap-3 pb-4">
        {/* Total Value Staked Card */}
        <div className="flex h-[88px] flex-col justify-center rounded-md bg-primary/5 p-3 text-center dark:bg-primary">
          <div className="flex items-center justify-center gap-x-1 text-xs text-muted-foreground">
            <span>Total Value Staked</span>
          </div>
          <div className="mt-1 h-7 w-24 animate-pulse rounded bg-foreground/10 mx-auto"></div>
          <div className="mt-1 h-4 w-20 animate-pulse rounded bg-foreground/10 mx-auto"></div>
        </div>
        {/* Staking APR Card */}
        <div className="flex h-[88px] flex-col justify-center rounded-md bg-primary/5 p-3 text-center dark:bg-primary">
          <div className="flex items-center justify-center gap-x-1 text-xs text-muted-foreground">
            <span>Staking APR</span>
          </div>
          <div className="mt-1 h-7 w-16 animate-pulse rounded bg-foreground/10 mx-auto"></div>
          <div className="mt-1 h-4 w-20 animate-pulse rounded bg-foreground/10 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 pb-4">
      {/* Total Value Staked Card */}
      <div className="flex h-[88px] flex-col justify-center rounded-md bg-primary/5 p-3 text-center dark:bg-primary">
        <div className="flex items-center justify-center gap-x-1 text-xs text-muted-foreground">
          <span>Total Value Staked</span>
          <ToolTip iconSize={12}>
            In-range positions actively earn trading fees and SIR rewards. Out-of-range positions earn neither until price returns to range.
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
            Additional SIR rewards earned on top of standard Uniswap LP trading fees
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
          {stakingApr !== null ? "30-day average" : "To be determined"}
        </div>
      </div>
    </div>
  );
}
