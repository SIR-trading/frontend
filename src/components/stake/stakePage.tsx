"use client";
import { Container } from "../ui/container";
import PageHeadingSpace from "../shared/pageHeadingSpace";
import { useAccount } from "wagmi";
import { api } from "@/trpc/react";
import { SirStakingArea } from "./sirStaking/SirStakingArea";
import { LpStakingArea } from "./lpStaking/LpStakingArea";
import { UniswapV3StakerContract } from "@/contracts/uniswapV3Staker";
import { getSirSymbol } from "@/lib/assets";
import { getNativeCurrencySymbol } from "@/lib/chains";
import ContributorRewardsCard from "../portfolio/contributorRewardsCard";
import { Card } from "../ui/card";

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
      <Container className="space-y-6 lg:max-w-[1200px]">
        {/* Custom explainer with conditional LP staking text */}
        <div className={`w-full max-w-[588px] pb-8 mx-auto ${isLpStakingEnabled || hasContributorRewards ? 'lg:max-w-none lg:mx-0' : ''}`}>
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

        {/* Unified layout for both cases */}
        {!isLpStakingEnabled && !hasContributorRewards ? (
          <div className="max-w-[588px] mx-auto">
            <SirStakingArea />
          </div>
        ) : (
          <div className={`max-w-[588px] mx-auto flex flex-col gap-6 lg:max-w-none lg:mx-0 lg:grid lg:grid-cols-2 lg:items-start ${!isLpStakingEnabled ? 'lg:justify-center' : ''}`}>
            {isLpStakingEnabled ? (
              <>
                {/* When LP staking enabled */}
                <div className="order-1 lg:row-start-1 lg:col-start-1">
                  <SirStakingArea />
                </div>
                <div className="order-2 lg:row-start-1 lg:row-span-2 lg:col-start-2">
                  <LpStakingArea />
                </div>
                {hasContributorRewards && (
                  <Card className="card-shadow rounded-[4px] bg-secondary p-4 md:px-6 md:py-6 order-3 lg:row-start-2 lg:col-start-1">
                    <ContributorRewardsCard />
                  </Card>
                )}
              </>
            ) : (
              <>
                {/* When LP staking disabled: SIR Staking on left, Contributor Rewards on right */}
                <SirStakingArea />
                {hasContributorRewards && (
                  <Card className="card-shadow rounded-[4px] bg-secondary p-4 md:px-6 md:py-6">
                    <ContributorRewardsCard />
                  </Card>
                )}
              </>
            )}
          </div>
        )}
      </Container>
    </div>
  );
};

export default StakePage;
