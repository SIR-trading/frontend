"use client";
import React from 'react';
import DisplayFormattedNumber from '@/components/shared/displayFormattedNumber';

interface LpMetricsProps {
  totalValueStakedUsd: number;
  inRangeValueStakedUsd: number;
  stakingApr: number | null; // null means TBD
}

export function LpMetrics({ totalValueStakedUsd, inRangeValueStakedUsd, stakingApr }: LpMetricsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 pb-4">
      {/* Total Value Staked Card */}
      <div className="rounded-md bg-primary/5 p-3 dark:bg-primary text-center h-[88px] flex flex-col justify-center">
        <div className="text-xs text-muted-foreground">Total Value Staked</div>
        <div className="mt-1 text-lg font-semibold">
          {inRangeValueStakedUsd > 0 ? (
            <>
              $<DisplayFormattedNumber num={inRangeValueStakedUsd} significant={3} />
            </>
          ) : (
            "$0"
          )}{" "}
          <span className="text-[10px] text-muted-foreground/70 font-normal">in-range</span>
        </div>
        <div className="text-xs text-muted-foreground">
          ${(totalValueStakedUsd - inRangeValueStakedUsd) > 0 ? (
            <DisplayFormattedNumber num={totalValueStakedUsd - inRangeValueStakedUsd} significant={3} />
          ) : (
            "0"
          )}{" "}
          <span className="text-muted-foreground/70">out-of-range</span>
        </div>
      </div>

      {/* Staking APR Card */}
      <div className="rounded-md bg-primary/5 p-3 dark:bg-primary text-center h-[88px] flex flex-col justify-center">
        <div className="text-xs text-muted-foreground">Staking APR</div>
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
          {stakingApr !== null ? '30-day average' : 'To be determined'}
        </div>
      </div>
    </div>
  );
}
