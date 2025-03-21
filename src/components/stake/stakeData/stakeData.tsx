"use client";

import { api } from "@/trpc/react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useGetStakedSir } from "@/components/shared/hooks/useGetStakedSir";
import { TokenDisplay } from "@/components/ui/token-display";
import { Card } from "@/components/ui/card";

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
