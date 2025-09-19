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

  console.log("useUnstake hook debug:", {
    functionName: unstakeAndClaimFees ? "unstakeAndClaim" : "unstake",
    amount,
    Unstake,
    error: error?.message ?? error,
    isFetching,
  });

  useEffect(() => {
    refetch().catch((e) => console.log("useUnstake refetch error:", e));
  }, [refetch]);

  return { Unstake, isFetching, error };
};
