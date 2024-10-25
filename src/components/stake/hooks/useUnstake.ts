"use client";

import { useSimulateContract } from "wagmi";
import { SirContract } from "@/contracts/sir";
import { useEffect } from "react";

interface Props {
  amount: bigint | undefined;
  unstakeAndClaimFees: boolean;
}

export const useUnstake = ({ amount, unstakeAndClaimFees }: Props) => {
  const {
    data: Unstake,
    error,
    refetch,
    isFetching,
  } = useSimulateContract({
    ...SirContract,
    functionName: unstakeAndClaimFees ? "unstakeAndClaim" : "unstake",
    args: [amount ?? 0n],
  });

  useEffect(() => {
    refetch().catch((e) => console.log(e));
  }, [refetch]);

  return { Unstake, isFetching, error };
};
