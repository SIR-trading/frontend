import buildData from "@/../public/build-data.json";

const BASE_FEE = buildData.systemParams.baseFee;
import { calculateMaxApe } from "@/lib/utils/calculations";
import { api } from "@/trpc/react";
import { formatUnits, parseUnits } from "viem";
import useCalculateVaultHealth from "../../vaultTable/hooks/useCalculateVaultHealth";
import { useFormContext } from "react-hook-form";
import { parseAddress } from "@/lib/utils/index";
import type { TMintFormFields } from "@/components/providers/mintFormProvider";

interface UseCalculateMaxApeParams {
  /** The vault ID to calculate max ape for */
  vaultId: number;
  /** Whether the user is using debt token instead of collateral token */
  usingDebtToken: boolean;
  /** Number of decimals for the collateral token */
  collateralDecimals: number;
  /** Tax amount as a string (will be converted to BigInt) */
  taxAmount: string;
}

interface UseCalculateMaxApeReturn {
  /** Whether the vault health is bad (red or yellow) */
  badHealth: boolean;
  /** Maximum debt token amount that can be used (only available when usingDebtToken is true) */
  maxDebtIn: bigint | undefined;
  /** Maximum collateral amount that can be minted */
  maxCollateralIn: bigint | undefined;
  /** Whether the data is still loading */
  isLoading: boolean;
}

/**
 * Hook to calculate the maximum amount of APE that can be minted for a given vault
 * without causing insufficient liquidity or bad vault health.
 * 
 * @param params - Configuration parameters for the calculation
 * @returns Object containing max amounts and vault health status
 */
export function useCalculateMaxApe({
  vaultId,
  usingDebtToken,
  collateralDecimals,
  taxAmount,
}: UseCalculateMaxApeParams): UseCalculateMaxApeReturn {
  const formData = useFormContext<TMintFormFields>().watch();
  
  // Load build-time data for system parameters
  const baseFee = BASE_FEE;
  
  // Fetch vault reserve data (APE and TEA reserves)
  const { data: reserveData, isLoading: isLoadingReserves } = api.vault.getReserve.useQuery(
    { vaultId },
    { enabled: vaultId !== -1 && Number.isFinite(vaultId) },
  );
  
  // Extract reserve amounts with fallback to 0
  const apeReserve = reserveData?.[0]?.reserveApes ?? 0n;
  const teaReserve = reserveData?.[0]?.reserveLPers ?? 0n;

  // Calculate vault health status
  const { variant: healthVariant } = useCalculateVaultHealth({
    leverageTier: Number.parseInt(formData.leverageTier),
    apeCollateral: apeReserve,
    teaCollateral: teaReserve,
    isApe: true,
  });

  // Calculate max APE that can be minted using the new formula
  // Use build-time data for base fee
  
  const maxCollateralIn = calculateMaxApe({
    leverageTier: parseUnits(formData.leverageTier ?? "0", 0),
    baseFeeBigInt: parseUnits(baseFee.toString(), 4),
    apeReserve,
    gentlemenReserve: teaReserve,
    taxAmountBigInt: parseUnits(taxAmount, 0),
  });
  
  // Determine if vault health is bad (red or yellow status)
  const badHealth = healthVariant === "red" || healthVariant === "yellow";

  // Fetch maximum debt token amount (only when using debt token and vault is valid)
  const { data: maxDebtIn, isLoading: isLoadingDebtMax } = api.vault.getDebtTokenMax.useQuery(
    {
      debtToken: parseAddress(formData.versus) ?? "0x",
      collateralToken: parseAddress(formData.long) ?? "0x",
      maxCollateralIn: formatUnits(maxCollateralIn ?? 0n, collateralDecimals),
      decimals: collateralDecimals,
    },
    { enabled: usingDebtToken && vaultId !== -1 && Number.isFinite(vaultId) },
  );

  const isLoading = isLoadingReserves || (usingDebtToken && isLoadingDebtMax);

  return { 
    badHealth, 
    maxDebtIn, 
    maxCollateralIn, 
    isLoading 
  };
}
