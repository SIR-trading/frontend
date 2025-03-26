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
import boostIcon from "@/../public/images/white-logo.svg";
import type { StaticImageData } from "next/image";
import Image from "next/image";
import { SirToUsd } from "./SirToUsd";
import { formatUnits } from "viem";
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
              <SirToUsd amount={totalValueLocked} />
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
