"use client";
import SirPriceChart from "@/components/stake/stakeData/sirPriceChart";
import PriceCard from "@/components/stake/stakeData/priceCard";
import MarketCapCard from "@/components/stake/stakeData/marketCapCard";
import { Container } from "../ui/container";
import PageHeadingSpace from "../shared/pageHeadingSpace";
import { Card } from "@/components/ui/card";
import ContributorRewardsCard from "../portfolio/contributorRewardsCard";
import { useAccount } from "wagmi";
import { api } from "@/trpc/react";
import { SirStakingArea } from "./sirStaking/SirStakingArea";
import { LpStakingArea } from "./lpStaking/LpStakingArea";
import { UniswapV3StakerContract } from "@/contracts/uniswapV3Staker";
import { getSirSymbol } from "@/lib/assets";
import { getNativeCurrencySymbol } from "@/lib/chains";
import Image from "next/image";

const StakePage = () => {
  const { isConnected, address } = useAccount();
  const { data: unclaimedData } =
    api.user.getUnclaimedContributorRewards.useQuery(
      { user: address },
      { enabled: isConnected },
    );
  const hasContributorRewards = unclaimedData && unclaimedData > 0n;

  // Check if LP staking is enabled on this chain
  const isLpStakingEnabled =
    UniswapV3StakerContract.address !==
    "0x0000000000000000000000000000000000000000";

  return (
    <div className="">
      <PageHeadingSpace />
      <Container className="space-y-6 xl:w-[1200px]">
        {/* Custom explainer with conditional LP staking text */}
        <div className="w-full pb-8">
          <h1 className="text-[24px] font-semibold md:text-[32px] lg:text-[42px]">
            Stake {getSirSymbol()}, earn {getNativeCurrencySymbol()}
          </h1>
          <div className="pt-2 text-[16px] leading-5 opacity-75 [&>p+p]:mt-4">
            <p>
              Stake {getSirSymbol()} tokens to earn {getNativeCurrencySymbol()}{" "}
              dividends from protocol fees. Staked tokens unlock gradually, with
              half becoming withdrawable every 30 days.
            </p>
            {isLpStakingEnabled && (
              <p className="mt-2">
                Additionally, you can stake Uniswap V3 LP positions in the{" "}
                {getSirSymbol()}/W{getNativeCurrencySymbol()} pool to earn{" "}
                {getSirSymbol()} rewards.
              </p>
            )}
          </div>
        </div>

        {isLpStakingEnabled ? (
          <>
            {/* When LP staking enabled: Two-column layout for staking, then Market Data below */}
            <div className="grid gap-6 xl:grid-cols-2">
              <SirStakingArea />
              <LpStakingArea />
            </div>

            {/* Market Data - full width below */}
            <Card className="card-shadow relative overflow-hidden rounded-[4px] bg-secondary p-4 md:px-6 md:py-6">
              <h2 className="pb-4 text-sm font-medium">Market Data</h2>

              {/* Small screens (< lg) - cards above chart */}
              <div className="relative z-10 space-y-4 pb-40 lg:hidden">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <PriceCard />
                  <MarketCapCard />
                </div>
                <div>
                  <SirPriceChart />
                </div>
                {hasContributorRewards && <ContributorRewardsCard />}
              </div>

              {/* Large screens (lg+) - chart left, cards right */}
              <div className="relative z-10 hidden gap-6 pb-40 lg:grid lg:grid-cols-3 lg:pb-0">
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
              <div className="pointer-events-none absolute bottom-0 right-0">
                {/* Dark mode frog */}
                <Image
                  src="/Frog_blue.jpg"
                  alt="SIR Mascot"
                  width={560}
                  height={560}
                  className="hidden opacity-50 dark:block"
                />
                {/* Light mode frog */}
                <Image
                  src="/Frog_beige.jpg"
                  alt="SIR Mascot"
                  width={560}
                  height={560}
                  className="block opacity-50 dark:hidden"
                />
              </div>
            </Card>
          </>
        ) : (
          <>
            {/* When LP staking disabled: SIR Staking and Market Data side by side */}
            <div className="grid gap-6 xl:grid-cols-2">
              <SirStakingArea className="xl:min-h-[586px]" />

              {/* Market Data - side by side with SIR Staking on wide screens */}
              <Card className="card-shadow relative overflow-hidden rounded-[4px] bg-secondary p-4 md:px-6 md:py-6 xl:min-h-[586px]">
                <h2 className="pb-4 text-sm font-medium">Market Data</h2>

                {/* Small screens (< lg) - cards above chart */}
                <div className="relative z-10 space-y-4 pb-40 lg:hidden">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <PriceCard />
                    <MarketCapCard />
                  </div>
                  <div>
                    <SirPriceChart />
                  </div>
                  {hasContributorRewards && <ContributorRewardsCard />}
                </div>

                {/* Medium screens (lg - xl) - chart left, cards right */}
                <div className="relative z-10 hidden gap-6 pb-40 lg:grid lg:grid-cols-3 lg:pb-0 xl:hidden">
                  <div className="lg:col-span-2">
                    <SirPriceChart />
                  </div>
                  <div className="flex flex-col gap-3">
                    <PriceCard />
                    <MarketCapCard />
                    {hasContributorRewards && <ContributorRewardsCard />}
                  </div>
                </div>

                {/* Compact layout for side-by-side (xl+) - cards above chart */}
                <div className="relative z-10 hidden space-y-4 pb-40 lg:pb-0 xl:block">
                  <div className="grid grid-cols-2 gap-3">
                    <PriceCard />
                    <MarketCapCard />
                  </div>
                  <div>
                    <SirPriceChart height={210} />
                  </div>
                  {hasContributorRewards && (
                    <div className="max-w-[66%]">
                      <ContributorRewardsCard />
                    </div>
                  )}
                </div>

                {/* Frog images - bottom right corner */}
                <div className="pointer-events-none absolute bottom-0 right-0">
                  {/* Large frogs for stacked layout (< xl) */}
                  <div className="xl:hidden">
                    <Image
                      src="/Frog_blue.jpg"
                      alt="SIR Mascot"
                      width={560}
                      height={560}
                      className="hidden opacity-50 dark:block"
                    />
                    <Image
                      src="/Frog_beige.jpg"
                      alt="SIR Mascot"
                      width={560}
                      height={560}
                      className="block opacity-50 dark:hidden"
                    />
                  </div>
                  {/* Smaller frogs for side-by-side layout (xl+) */}
                  <div className="hidden xl:block">
                    <Image
                      src="/Frog_blue.jpg"
                      alt="SIR Mascot"
                      width={400}
                      height={400}
                      className="hidden opacity-50 dark:block"
                    />
                    <Image
                      src="/Frog_beige.jpg"
                      alt="SIR Mascot"
                      width={400}
                      height={400}
                      className="block opacity-50 dark:hidden"
                    />
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}
      </Container>
    </div>
  );
};

export default StakePage;
