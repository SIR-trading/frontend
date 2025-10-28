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
      <Container className={`space-y-6 ${isLpStakingEnabled ? 'xl:w-[1200px]' : 'xl:w-[840px]'}`}>
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
            {/* When LP staking enabled: Two-column layout for staking */}
            <div className="grid gap-6 xl:grid-cols-2">
              <SirStakingArea />
              <LpStakingArea />
            </div>
          </>
        ) : (
          <>
            {/* When LP staking disabled: SIR Staking only, full width with grid layout */}
            <SirStakingArea
              showContributorRewards={!!hasContributorRewards}
              useGridLayout={true}
              hideTitle={true}
            />
          </>
        )}
      </Container>
    </div>
  );
};

export default StakePage;
