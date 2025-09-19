"use client";

import { useSimulateContract } from "wagmi";
import { SirContract } from "@/contracts/sir";
import { useEffect } from "react";

interface Props {
  amount: bigint | undefined;
}

export const useStake = ({ amount }: Props) => {
  const {
    data: stake,
    error,
    refetch,
    isFetching,
  } = useSimulateContract({
    ...SirContract,
    functionName: "stake",
    args: [amount ?? 0n],
  });

  console.log("useStake hook debug:", {
    functionName: "stake",
    amount,
    stake,
    error: error?.message ?? error,
    isFetching,
  });

  useEffect(() => {
    refetch().catch((e) => console.log("useStake refetch error:", e));
  }, [refetch]);

  return { stake, isFetching, error };
};
