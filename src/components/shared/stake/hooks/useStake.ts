"use client";

import { useSimulateContract } from "wagmi";
import { SirContract } from "@/contracts/sir";

interface Props {
  amount: bigint | undefined;
}

export const useStake = ({ amount }: Props) => {
  const {
    data: Stake,
    error,
    isFetching,
  } = useSimulateContract({
    ...SirContract,
    functionName: "stake",
    args: [amount ?? 0n],
  });

  return { Stake, isFetching, error };
};
