import type { badgeVariants } from "@/components/ui/badge";
import { mapLeverage } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";
import { useMemo } from "react";
import { parseUnits } from "viem";

interface Props {
  leverageTier: number;
  isApe: boolean;
  apeCollateral: bigint;
  teaCollateral: bigint;
}
export default function useCalculateVaultHealth({
  leverageTier,
  teaCollateral,
  apeCollateral,
  isApe,
}: Props): VariantProps<typeof badgeVariants> {
  return useMemo(() => {
    return calculateVaultHealth({
      leverageTier,
      teaCollateral,
      apeCollateral,
      isApe,
    });
  }, [apeCollateral, isApe, leverageTier, teaCollateral]);
}

export function calculateVaultHealth({
  leverageTier,
  teaCollateral,
  apeCollateral,
  isApe,
}: Props): VariantProps<typeof badgeVariants> {
  const ape = apeCollateral;
  const gentlemen = teaCollateral;
  const leverageRatio =
    parseFloat(mapLeverage(leverageTier.toString()) ?? "0") * 10000;
  const gentlemenMinimum =
    (parseUnits((leverageRatio - 10000).toString(), 0) * ape) / 10000n;
  const healthyMinimum = (gentlemenMinimum * 125n) / 100n;
  
  // Debug log for health calculation values
  console.log('💊 HEALTH CALC DEBUG - calculation values:', {
    leverageTier,
    leverageRatio,
    ape: ape.toString(),
    gentlemen: gentlemen.toString(),
    gentlemenMinimum: gentlemenMinimum.toString(),
    healthyMinimum: healthyMinimum.toString(),
    isApe,
    gentlemenMinimumGteGentlemen: gentlemenMinimum >= gentlemen,
    healthyMinimumGteGentlemen: healthyMinimum >= gentlemen
  });
  
  if (gentlemenMinimum >= gentlemen) {
    return isApe ? { variant: "red" } : { variant: "green" };
  }
  if (healthyMinimum >= gentlemen) {
    return isApe ? { variant: "yellow" } : { variant: "green" };
  }
  return isApe ? { variant: "green" } : { variant: "yellow" };
}
