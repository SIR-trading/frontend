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
}

export function SirStakingArea({ className, showContributorRewards }: SirStakingAreaProps) {
  return (
    <Card className={cn("card-shadow rounded-[4px] bg-secondary p-4 md:px-6 md:py-6", className)}>
      <h2 className="pb-4 text-sm font-medium">SIR Staking</h2>

      {/* Metrics at top */}
      <SirMetrics />

      {/* Action Cards - vertically stacked */}
      <div className="space-y-4">
        <StakeCardWrapper>
          <SirCard />
        </StakeCardWrapper>

        <StakeCardWrapper>
          <UnstakeCard />
        </StakeCardWrapper>

        <StakeCardWrapper>
          <ClaimCard />
        </StakeCardWrapper>

        {/* Contributor Rewards - shown when LP staking is disabled */}
        {showContributorRewards && (
          <StakeCardWrapper>
            <ContributorRewardsCard />
          </StakeCardWrapper>
        )}
      </div>
    </Card>
  );
}
