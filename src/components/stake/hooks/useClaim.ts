"use client";

import { useSimulateContract } from "wagmi";
import { SirContract } from "@/contracts/sir";

export const useClaim = () => {
  const {
    data: claimData,
    error,
    isFetching,
  } = useSimulateContract({
    ...SirContract,
    functionName: "claim",
    args: [],
  });

  return { claimData, isFetching, error };
};
