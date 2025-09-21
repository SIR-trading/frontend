"use client";
import React from "react";
import { Card } from "../ui/card";
import { useClaimableBalances } from "@/hooks/useClaimableBalances";
import DisplayFormattedNumber from "../shared/displayFormattedNumber";
import { formatUnits } from "viem";
import { getSirSymbol } from "@/lib/assets";
import { getNativeCurrencySymbol } from "@/lib/chains";
import { Coins, Gem } from "lucide-react";

export function ClaimNotificationCard() {
  const {
    hasClaimableBalances,
    dividendsAmount,
    stakingRewardsAmount,
    contributorRewardsAmount,
    rewardsAmount,
    isLoading
  } = useClaimableBalances() as {
    hasClaimableBalances: boolean;
    dividendsAmount: bigint;
    stakingRewardsAmount: bigint;
    contributorRewardsAmount: bigint;
    rewardsAmount: bigint;
    isLoading: boolean;
  };

  // Don't show if no claimable balances or still loading
  if (!hasClaimableBalances || isLoading) {
    return null;
  }

  const hasDividends = dividendsAmount > 0n;
  const hasRewards = rewardsAmount > 0n;
  const hasContributor = contributorRewardsAmount > 0n;
  const hasStaking = stakingRewardsAmount > 0n;

  return (
    <Card className="relative overflow-hidden mb-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 claim-card-glow">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Rewards Available to Claim
          </h3>
        </div>

        <div className="space-y-3">
          {hasRewards && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-green-500" />
                <span className="text-sm text-muted-foreground">
                  {getSirSymbol()} Rewards
                  {hasContributor && hasStaking && " (Staking + Contributor)"}
                  {hasContributor && !hasStaking && " (Contributor)"}
                  {!hasContributor && hasStaking && " (Staking)"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg">
                  <DisplayFormattedNumber
                    num={formatUnits(rewardsAmount, 12)}
                    significant={4}
                  />
                </span>
                <span className="text-muted-foreground">{getSirSymbol()}</span>
              </div>
            </div>
          )}

          {hasDividends && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Gem className="h-5 w-5 text-green-500" />
                <span className="text-sm text-muted-foreground">Staking Dividends</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg">
                  <DisplayFormattedNumber
                    num={formatUnits(dividendsAmount, 18)}
                    significant={4}
                  />
                </span>
                <span className="text-muted-foreground">{getNativeCurrencySymbol()}</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Use the claim buttons below to collect your rewards
          </p>
        </div>
      </div>
    </Card>
  );
}