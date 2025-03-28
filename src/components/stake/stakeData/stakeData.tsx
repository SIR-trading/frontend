"use client";

import { api } from "@/trpc/react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useGetStakedSir } from "@/components/shared/hooks/useGetStakedSir";
import { TokenDisplay } from "@/components/ui/token-display";
import { Card } from "@/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { SirToUsd } from "./SirToUsd";
import { usePriceProvider } from "@/components/providers/priceProvider";
import { getAddress, EContracts } from "@/lib/contractAddresses";
import { formatUnits, parseUnits } from "viem";

interface supplyProps {
  data?: bigint;
}

const StakeData = ({ children }: { children: ReactNode }) => {
  const { data: unstakedSupply }: supplyProps =
    api.user.getSirSupply.useQuery();
  const { data: totalSupply }: supplyProps =
    api.user.getSirTotalSupply.useQuery();

  const totalValueLocked = useMemo(() => {
    if (totalSupply !== undefined && unstakedSupply !== undefined) {
      return totalSupply - unstakedSupply;
    }
  }, [unstakedSupply, totalSupply]);
  const userStakedSir = useGetStakedSir();

  const { prices } = usePriceProvider();
  console.log("PRICES===", prices);
  const priceStr = prices?.find(p => p.address = getAddress(EContracts.SIR))?.price ?? "0";
  const sirPrice = parseUnits(priceStr, 18);
  console.log("SIR_PRICE", sirPrice)
  return (
    <div className="mx-auto grid gap-4 font-normal md:w-[600px] md:grid-cols-3  ">
      <Card className="flex flex-col  items-center justify-center gap-2 rounded-md bg-secondary py-2">
        <div className="text-sm font-normal text-gray-300">
          Total Staked SIR
        </div>
        <HoverCard openDelay={0} closeDelay={20}>
          <HoverCardTrigger asChild>
            {/* <div className="text-2xl font-semibold ">
          {parseFloat(formatUnits(totalValueLocked ?? 0n, 12)).toFixed(4)}
        </div> */}
            <div className=" text-2xl font-normal">
              <TokenDisplay
                amount={totalValueLocked}
                decimals={12}
                unitLabel="SIR"
              />
            </div>
          </HoverCardTrigger>
          <HoverCardContent side="top" alignOffset={10}>
            <div className="mb-2 max-w-[200px] rounded-sm bg-white px-2 py-2 text-[13px] font-medium text-gray-800">
              <SirToUsd amount={totalValueLocked} sirPrice={sirPrice} />
              <TokenDisplay
                amount={sirPrice}
                decimals={18}
                unitLabel="USD"
              />
            </div>
          </HoverCardContent>
        </HoverCard>
      </Card>

      <Card className="flex flex-col items-center justify-center gap-2 rounded-md bg-secondary py-2">
        <div className="flex w-full flex-row items-center justify-center">
          <div className="px-2 text-sm text-gray-300">Your Staked SIR</div>
        </div>
        <div className=" text-2xl ">
          <TokenDisplay
            amount={userStakedSir.unlockedStake}
            decimals={12}
            unitLabel={"SIR Unlocked"}
          />
          <TokenDisplay
            amount={userStakedSir.lockedStake}
            decimals={12}
            unitLabel={"SIR Locked"}
          />
          {/* {formatUnits(userStakedSir, 12)} */}
        </div>
      </Card>

      {children}
    </div>
  );
};

export default StakeData;

// <div className="flex flex-col items-center justify-center gap-2 rounded-md bg-secondary py-2">
//   <div className="flex w-full flex-row items-center justify-center">
//     <div className="px-2 text-sm text-gray-300">Staking APR</div>
//     <ToolTip>Tool tip info.</ToolTip>
//     {/* <AprInfo></AprInfo>
//   </div>
//   <div className=" text-2xl ">N/A</div>
// </div>
