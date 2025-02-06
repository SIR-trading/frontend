"use client";
import { useSimulateContract } from "wagmi";
import type { TAddressString } from "@/lib/types";
import { VaultContract } from "@/contracts/vault";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { parseUnits } from "viem";
import type { TMintFormFields } from "@/components/providers/mintFormProvider";
interface Props {
  collateralToken: string;
  debtToken: string;
  amount: bigint | undefined;
  tokenAllowance: bigint | undefined;
  depositToken: string;
  leverageTier: number;
  vaultId: string | undefined;
  isApe: boolean;
  useEth: boolean;
  decimals: number;
  minCollateralOut: bigint | undefined;
}
export function useMintApeOrTea({
  collateralToken,
  debtToken,
  leverageTier,
  amount,
  tokenAllowance,
  isApe,
  useEth,
  depositToken,
  minCollateralOut,
}: Props) {
  const vault = {
    debtToken: debtToken as TAddressString,
    collateralToken: collateralToken as TAddressString,
    leverageTier,
  };
  const debtTokenDeposit = depositToken === debtToken && debtToken !== "";
  const tokenAmount = useEth ? 0n : amount;
  const ethAmount = useEth ? amount : 0n;
  const form = useFormContext<TMintFormFields>();
  const formData = form.watch();
  let minCollateralOutWithSlippage = 0n;

  if (minCollateralOut !== undefined) {
    if (minCollateralOut > 0n) {
      const slippage = parseUnits(formData.slippage ?? "0", 0);
      const minus = ((minCollateralOut ?? 0n) * BigInt(slippage)) / 100n;
      minCollateralOutWithSlippage = minCollateralOut - minus;
    }
  }
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
      tokenAmount ?? 0n,
      debtTokenDeposit ? minCollateralOutWithSlippage ?? 0n : 0n,
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
