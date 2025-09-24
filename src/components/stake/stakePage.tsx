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

const stakePage = () => {
  return (
    <div className="">
      <PageHeadingSpace />
      <Container className="lg:w-[900px] space-y-6">
        <Explainer page={EPage.STAKE} />

        {/* Stats Section */}
        <StakeData>
          <AprCard />
        </StakeData>

        {/* Your Position Section */}
        <Card className="rounded-[4px] md:py-6 md:px-6 card-shadow bg-secondary p-4">
          <h2 className="flex items-center gap-x-1 pb-4 text-sm">Your Position</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <SirCard />
            <UnstakeCard />
          </div>
        </Card>

        {/* Claimable Rewards Section */}
        <Card className="rounded-[4px] md:py-6 md:px-6 card-shadow bg-secondary p-4">
          <h2 className="flex items-center gap-x-1 pb-4 text-sm">Claimable Rewards</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <ContributorRewardsCard />
            <ClaimCard />
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default stakePage;
