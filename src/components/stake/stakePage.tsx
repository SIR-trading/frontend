"use client";
import StakeData from "@/components/stake/stakeData/stakeData";
import Explainer from "../shared/explainer";
import { EPage } from "@/lib/types";
import { Container } from "../ui/container";
import PageHeadingSpace from "../shared/pageHeadingSpace";
import AprCard from "./stakeData/aprCard";
import { Card } from "../ui/card";
import ContributorRewardsCard from "../portfolio/contributorRewardsCard";
import ClaimCard from "../shared/claimCard";
import { SirCard } from "../portfolio/sirCard";
import { UnstakeCard } from "../portfolio/unstakeCard";
import { StakeCardWrapper } from "./stakeCardWrapper";
import { useAccount } from "wagmi";
import { api } from "@/trpc/react";
import Image from "next/image";

const StakePage = () => {
  const { isConnected, address } = useAccount();
  const { data: unclaimedData } = api.user.getUnclaimedContributorRewards.useQuery(
    { user: address },
    { enabled: isConnected },
  );
  const hasContributorRewards = unclaimedData && unclaimedData > 0n;
  return (
    <div className="">
      <PageHeadingSpace />
      <Container className="space-y-6 lg:w-[900px]">
        <Explainer page={EPage.STAKE} />

        {/* Stats Section */}
        <StakeData>
          <AprCard />
        </StakeData>

        {/* Your Position Section */}
        <Card className="card-shadow rounded-[4px] bg-secondary p-4 md:px-6 md:py-6">
          <h2 className="flex items-center gap-x-1 pb-4 text-sm">
            Your Position
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <StakeCardWrapper>
              <SirCard />
            </StakeCardWrapper>
            <StakeCardWrapper>
              <UnstakeCard />
            </StakeCardWrapper>
          </div>
        </Card>

        {/* Claimable Rewards Section */}
        <Card className="card-shadow relative overflow-hidden rounded-[4px] bg-secondary p-4 md:px-6 md:py-6">
          {/* Background frog image - behind everything - only show when no contributor rewards */}
          {!hasContributorRewards && (
            <div className="pointer-events-none absolute inset-0 flex items-end justify-end">
              <div className="relative h-2/5 md:h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/Frog_blue.jpg"
                  alt="Background"
                  className="hidden h-full w-auto object-contain object-right-bottom dark:block"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/Frog_beige.jpg"
                  alt="Background"
                  className="h-full w-auto object-contain object-right-bottom dark:hidden"
                />
              </div>
            </div>
          )}
          <h2 className="relative flex items-center gap-x-1 pb-4 text-sm">
            Claimable Rewards
          </h2>
          <div className="relative grid gap-6 md:grid-cols-2">
            <StakeCardWrapper>
              <ClaimCard />
            </StakeCardWrapper>
            <StakeCardWrapper>
              <ContributorRewardsCard />
            </StakeCardWrapper>
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default StakePage;
