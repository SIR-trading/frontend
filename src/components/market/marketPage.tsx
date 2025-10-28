"use client";
import SirPriceChart from "@/components/stake/stakeData/sirPriceChart";
import PriceCard from "@/components/stake/stakeData/priceCard";
import MarketCapCard from "@/components/stake/stakeData/marketCapCard";
import { Container } from "../ui/container";
import PageHeadingSpace from "../shared/pageHeadingSpace";
import { Card } from "@/components/ui/card";
import { getSirSymbol } from "@/lib/assets";
import Image from "next/image";

const MarketPage = () => {

  return (
    <div className="w-full">
      <PageHeadingSpace />
      <Container className="space-y-6 w-full max-w-[900px] xl:max-w-[1200px]">
        {/* Page heading and explainer */}
        <div className="w-full pb-8">
          <h1 className="text-[24px] font-semibold md:text-[32px] lg:text-[42px]">
            {getSirSymbol()} Market Data
          </h1>
          <div className="pt-2 text-[16px] leading-5 opacity-75">
            <p>
              Real-time price chart, market capitalization, and key metrics for{" "}
              {getSirSymbol()} token.
            </p>
          </div>
        </div>

        {/* Market Data - full width */}
        <Card className="card-shadow relative overflow-hidden rounded-[4px] bg-secondary p-4 md:px-6 md:py-6">

          {/* Small screens (< xl) - cards above chart */}
          <div className="relative z-10 space-y-4 pb-40 xl:hidden">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <PriceCard />
              <MarketCapCard />
            </div>
            <div>
              <SirPriceChart />
            </div>
          </div>

          {/* Large screens (xl+) - chart left, cards right */}
          <div className="relative z-10 hidden gap-6 pb-40 xl:grid xl:grid-cols-3 xl:pb-0">
            {/* Left side: Price Chart (takes up 2 columns) */}
            <div className="lg:col-span-2">
              <SirPriceChart />
            </div>

            {/* Right side: Price and Market Cap cards */}
            <div className="flex flex-col gap-3">
              <PriceCard />
              <MarketCapCard />
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
      </Container>
    </div>
  );
};

export default MarketPage;
