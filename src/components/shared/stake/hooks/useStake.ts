"use client";

import { useSimulateContract } from "wagmi";
import { SirContract } from "@/contracts/sir";
import { useEffect } from "react";

interface Props {
  amount: bigint | undefined;
}

export const useStake = ({ amount }: Props) => {
  const {
    data: Stake,
    error,
    refetch,
    isFetching,
  } = useSimulateContract({
    ...SirContract,
    functionName: "stake",
    args: [amount ?? 0n],
  });

  useEffect(() => {
    refetch().catch((e) => console.log(e));
  }, [refetch]);

  return { Stake, isFetching, error };
};
