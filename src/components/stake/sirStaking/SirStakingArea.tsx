"use client";
import React from "react";
import { Card } from "@/components/ui/card";
import { SirCard } from "@/components/portfolio/sirCard";
import { UnstakeCard } from "@/components/portfolio/unstakeCard";
import ClaimCard from "@/components/shared/claimCard";
import { StakeCardWrapper } from "../stakeCardWrapper";
import { SirMetrics } from "./SirMetrics";
import { cn } from "@/lib/utils";
import ContributorRewardsCard from "@/components/portfolio/contributorRewardsCard";

interface SirStakingAreaProps {
  className?: string;
  showContributorRewards?: boolean;
  useGridLayout?: boolean; // Use 2x2 grid layout on large screens
  hideTitle?: boolean; // Hide the "SIR Staking" title
}

export function SirStakingArea({ className, showContributorRewards, useGridLayout, hideTitle }: SirStakingAreaProps) {
  return (
    <Card className={cn("card-shadow rounded-[4px] bg-secondary p-4 md:px-6 md:py-6", className)}>
      {!hideTitle && <h2 className="pb-4 text-sm font-medium">SIR Staking</h2>}

      {/* Metrics at top */}
      <SirMetrics />

      {/* Action Cards - 2x2 grid when useGridLayout, otherwise vertically stacked */}
      <div className={useGridLayout ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : "space-y-4"}>
        <StakeCardWrapper>
          <SirCard />
        </StakeCardWrapper>

        <StakeCardWrapper>
          <UnstakeCard />
        </StakeCardWrapper>

        <StakeCardWrapper>
          <ClaimCard />
        </StakeCardWrapper>

        {/* Contributor Rewards - shown when available, or empty space */}
        {useGridLayout && (
          <StakeCardWrapper>
            {showContributorRewards ? <ContributorRewardsCard /> : <div />}
          </StakeCardWrapper>
        )}
      </div>
    </Card>
  );
}
