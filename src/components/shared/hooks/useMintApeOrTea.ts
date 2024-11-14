"use client";
import { useSimulateContract } from "wagmi";
import type { TAddressString } from "@/lib/types";
import { VaultContract } from "@/contracts/vault";
import { useEffect } from "react";
interface Props {
  collateralToken: string;
  debtToken: string;
  amount: bigint | undefined;
  tokenAllowance: bigint | undefined;
  leverageTier: number;
  vaultId: string | undefined;
  isApe: boolean;
  useEth: boolean;
}
export function useMintApeOrTea({
  collateralToken,
  debtToken,
  leverageTier,
  amount,
  tokenAllowance,
  isApe,
  useEth,
}: Props) {
  const vault = {
    debtToken: debtToken as TAddressString,
    collateralToken: collateralToken as TAddressString,
    leverageTier,
  };
  const tokenAmount = useEth ? 0n : amount;
  const ethAmount = useEth ? amount : 0n;
  const {
    data: Mint,
    refetch,
    isFetching,
    error,
  } = useSimulateContract({
    ...VaultContract,
    functionName: "mint",
    args: [
      isApe,
      { ...vault },
      // isApe ? apeAddress : zeroAddress,
      tokenAmount ?? 0n,
    ],
    value: ethAmount ?? 0n,
  });

  if (error) {
    console.log(error, "APE OR TEA ERROR");
  }
  useEffect(() => {
    refetch().catch((e) => console.log(e));
  }, [refetch, tokenAllowance]);
  return { Mint, isFetching };
}
