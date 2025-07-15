import type { badgeVariants } from "@/components/ui/badge";
import { mapLeverage } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";
import { useMemo } from "react";
import { parseUnits } from "viem";
import { api } from "@/trpc/react";
import { useFormContext } from "react-hook-form";
import type { TMintFormFields } from "@/components/providers/mintFormProvider";

interface VaultHealthParams {
  /** The leverage tier (e.g., -4 to 2) */
  leverageTier?: number;
  /** Whether this is an APE vault (affects health color mapping) */
  isApe: boolean;
  /** Amount of APE collateral in the vault (optional - will be fetched if not provided) */
  apeCollateral?: bigint;
  /** Amount of TEA (gentlemen) collateral in the vault (optional - will be fetched if not provided) */
  teaCollateral?: bigint;
  /** The vault ID to fetch data for (required if collateral amounts not provided) */
  vaultId?: number;
}

interface VaultHealthReturn extends VariantProps<typeof badgeVariants> {
  /** Whether the vault health is bad (red or yellow) */
  badHealth: boolean;
  /** Whether the data is still loading (only applicable when fetching data) */
  isLoading?: boolean;
}

type VaultHealthVariant = VariantProps<typeof badgeVariants>;

/**
 * Hook to calculate vault health status based on collateral ratios
 * Can work with provided collateral data or fetch it from API using vaultId
 * Returns a badge variant indicating the health level
 */
export default function useCalculateVaultHealth({
  leverageTier,
  teaCollateral: providedTeaCollateral,
  apeCollateral: providedApeCollateral,
  isApe,
  vaultId,
}: VaultHealthParams): VaultHealthReturn {
  const formData = useFormContext<TMintFormFields>().watch();
  
  // Only fetch data if collateral amounts are not provided
  const shouldFetchData = providedApeCollateral === undefined || providedTeaCollateral === undefined;
  
  const { data: reserveData, isLoading } = api.vault.getReserve.useQuery(
    { vaultId: vaultId! },
    { enabled: shouldFetchData && vaultId !== undefined && vaultId !== -1 && Number.isFinite(vaultId) },
  );
  
  // Use provided collateral or fallback to fetched data
  const apeCollateral = providedApeCollateral ?? reserveData?.[0]?.reserveApes ?? 0n;
  const teaCollateral = providedTeaCollateral ?? reserveData?.[0]?.reserveLPers ?? 0n;
  
  // Get leverage tier from form if not provided
  const effectiveLeverageTier = leverageTier ?? Number.parseInt(formData.leverageTier);

  const healthResult = useMemo(() => {
    return calculateVaultHealth({
      leverageTier: effectiveLeverageTier,
      teaCollateral,
      apeCollateral,
      isApe,
    });
  }, [apeCollateral, isApe, effectiveLeverageTier, teaCollateral]);

  const badHealth = healthResult.variant === "red" || healthResult.variant === "yellow";

  return {
    ...healthResult,
    badHealth,
    isLoading: shouldFetchData ? isLoading : undefined,
  };
}

/**
 * Calculates the health status of a vault based on collateral ratios
 * 
 * Health levels:
 * - Red: Critical - gentlemen collateral below minimum required
 * - Yellow: Warning - gentlemen collateral below healthy threshold
 * - Green: Healthy - gentlemen collateral above healthy threshold
 * 
 * Note: The color mapping is inverted for APE vs TEA vaults
 * 
 * @param params - Vault parameters for health calculation
 * @returns Badge variant indicating health status
 */
export function calculateVaultHealth({
  leverageTier,
  teaCollateral,
  apeCollateral,
  isApe,
}: {
  leverageTier: number;
  isApe: boolean;
  apeCollateral: bigint;
  teaCollateral: bigint;
}): VaultHealthVariant {
  // Convert leverage tier to ratio (e.g., 2x = 20000, 0.5x = 5000)
  const leverageRatioFloat = parseFloat(mapLeverage(leverageTier.toString()) ?? "0");
  const leverageRatioBasisPoints = leverageRatioFloat * 10000; // Convert to basis points (10000 = 1x)
  
  // Calculate minimum gentlemen collateral required
  // Formula: (leverageRatio - 1) * apeCollateral
  const leverageMultiplier = parseUnits((leverageRatioBasisPoints - 10000).toString(), 0);
  const minimumGentlemenRequired = (leverageMultiplier * apeCollateral) / 10000n;
  
  // Calculate healthy threshold (25% buffer above minimum)
  const healthyThreshold = (minimumGentlemenRequired * 125n) / 100n;
  
  // Current gentlemen collateral
  const currentGentlemenCollateral = teaCollateral;
  
  // Determine health status based on thresholds
  if (minimumGentlemenRequired >= currentGentlemenCollateral) {
    // Critical: Below minimum required collateral
    return isApe ? { variant: "red" } : { variant: "green" };
  }
  
  if (healthyThreshold >= currentGentlemenCollateral) {
    // Warning: Below healthy threshold but above minimum
    return isApe ? { variant: "yellow" } : { variant: "green" };
  }
  
  // Healthy: Above healthy threshold
  return isApe ? { variant: "green" } : { variant: "yellow" };
}
