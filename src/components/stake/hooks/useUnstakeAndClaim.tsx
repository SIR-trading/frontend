"use client";

import { useSimulateContract } from "wagmi";
import { SirContract } from "@/contracts/sir";

interface Props {
  amount: bigint | undefined;
}

export const useUnstakeAndClaim = ({ amount }: Props) => {
  const {
    data: UnstakeAndClaim,
    error,
    isFetching,
  } = useSimulateContract({
    ...SirContract,
    functionName: "unstakeAndClaim", // get the newly deployed sir contract's abi
    args: [amount ?? 0n],
  });

  return { UnstakeAndClaim, isFetching, error };
};
