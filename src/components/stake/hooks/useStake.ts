"use client";

import { useSimulateContract } from "wagmi";
import { SirContract } from "@/contracts/sir";

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

  return { stake, isFetching, error };
};
