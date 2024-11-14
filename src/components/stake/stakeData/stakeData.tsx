"use client";

import { api } from "@/trpc/react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { formatUnits } from "viem";
import { useGetStakedSir } from "@/components/shared/hooks/useGetStakedSir";
import { formatNumber } from "@/lib/utils";

interface supplyProps {
  data?: bigint;
}

const StakeData = ({ children }: { children: ReactNode }) => {
  const { data: unstakedSupply }: supplyProps =
    api.user.getSirSupply.useQuery();
  const { data: totalSupply }: supplyProps =
    api.user.getSirTotalSupply.useQuery();

  const totalValueLocked = useMemo(() => {
    if (totalSupply !== undefined && unstakedSupply != undefined) {
      return totalSupply - unstakedSupply;
    }
  }, [unstakedSupply, totalSupply]);
  const userStakedSir = useGetStakedSir();

  return (
    <div className="mx-auto grid gap-4 md:w-[600px] md:grid-cols-3  ">
      <div className="flex flex-col  items-center justify-center gap-2 rounded-md bg-secondary py-2">
        <div className="text-sm font-medium text-gray-300">
          Total Staked SIR
        </div>
        <div className="font-lora text-2xl font-normal">
          {formatNumber(formatUnits(totalValueLocked ?? 0n, 12))}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-2 rounded-md bg-secondary py-2">
        <div className="flex w-full flex-row items-center justify-center">
          <div className="px-2 text-sm text-gray-300">Your Staked SIR</div>
        </div>
        <div className="font-lora text-2xl ">
          {formatUnits(userStakedSir, 12)}
        </div>
      </div>
      {children}
    </div>
  );
};

export default StakeData;
