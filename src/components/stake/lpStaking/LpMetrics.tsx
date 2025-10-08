"use client";
import React from 'react';
import DisplayFormattedNumber from '@/components/shared/displayFormattedNumber';

interface LpMetricsProps {
  totalValueLockedUsd: number;
  inRangeValueUsd: number;
  stakingApr: number | null; // null means TBD
}

export function LpMetrics({ totalValueLockedUsd, inRangeValueUsd, stakingApr }: LpMetricsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 pb-4">
      {/* Total Value Locked Card */}
      <div className="rounded-md bg-primary/5 p-3 dark:bg-primary text-center">
        <div className="text-xs text-muted-foreground">Total Value Locked</div>
        <div className="mt-1 text-lg font-semibold">
          {totalValueLockedUsd > 0 ? (
            <>
              $<DisplayFormattedNumber num={totalValueLockedUsd} significant={3} />
            </>
          ) : (
            "$0"
          )}
        </div>
        {inRangeValueUsd > 0 && inRangeValueUsd < totalValueLockedUsd && (
          <div className="text-xs text-muted-foreground mt-1">
            In-Range: $<DisplayFormattedNumber num={inRangeValueUsd} significant={3} />
          </div>
        )}
      </div>

      {/* Staking APR Card */}
      <div className="rounded-md bg-primary/5 p-3 dark:bg-primary text-center">
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
