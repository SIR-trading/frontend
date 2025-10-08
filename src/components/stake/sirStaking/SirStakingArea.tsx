"use client";
import React from 'react';
import { Card } from '@/components/ui/card';
import { SirCard } from '@/components/portfolio/sirCard';
import { UnstakeCard } from '@/components/portfolio/unstakeCard';
import ClaimCard from '@/components/shared/claimCard';
import { StakeCardWrapper } from '../stakeCardWrapper';
import { SirMetrics } from './SirMetrics';

export function SirStakingArea() {
  return (
    <Card className="card-shadow rounded-[4px] bg-secondary p-4 md:px-6 md:py-6">
      <h2 className="pb-4 text-sm font-medium">
        SIR Staking
      </h2>

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
      </div>
    </Card>
  );
}
