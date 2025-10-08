"use client";
import SirPriceChart from "@/components/stake/stakeData/sirPriceChart";
import PriceCard from "@/components/stake/stakeData/priceCard";
import MarketCapCard from "@/components/stake/stakeData/marketCapCard";
import Explainer from "../shared/explainer";
import { EPage } from "@/lib/types";
import { Container } from "../ui/container";
import PageHeadingSpace from "../shared/pageHeadingSpace";
import { Card } from "@/components/ui/card";
import ContributorRewardsCard from "../portfolio/contributorRewardsCard";
import { useAccount } from "wagmi";
import { api } from "@/trpc/react";
import { SirStakingArea } from "./sirStaking/SirStakingArea";
import { LpStakingArea } from "./lpStaking/LpStakingArea";
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
      <Container className="space-y-6 lg:w-[1200px]">
        <Explainer page={EPage.STAKE} />

        {/* Two-column layout: SIR Staking | LP Staking */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SirStakingArea />
          <LpStakingArea />
        </div>

        {/* Bottom section: Market Data Zone */}
        <Card className="card-shadow rounded-[4px] bg-secondary p-4 md:px-6 md:py-6 relative overflow-hidden">
          <h2 className="pb-4 text-sm font-medium">
            Market Data
          </h2>

          <div className="grid gap-6 lg:grid-cols-3 relative z-10">
            {/* Left side: Price Chart (takes up 2 columns) */}
            <div className="lg:col-span-2">
              <SirPriceChart />
            </div>

            {/* Right side: Price, Market Cap, and Contributor Rewards cards */}
            <div className="flex flex-col gap-3">
              <PriceCard />
              <MarketCapCard />
              {hasContributorRewards && <ContributorRewardsCard />}
            </div>
          </div>

          {/* Frog images - bottom right corner */}
          <div className="absolute bottom-0 right-0 pointer-events-none">
            {/* Dark mode frog */}
            <Image
              src="/Frog_blue.jpg"
              alt="SIR Mascot"
              width={560}
              height={560}
              className="hidden dark:block opacity-50"
            />
            {/* Light mode frog */}
            <Image
              src="/Frog_beige.jpg"
              alt="SIR Mascot"
              width={560}
              height={560}
              className="block dark:hidden opacity-50"
            />
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default StakePage;
