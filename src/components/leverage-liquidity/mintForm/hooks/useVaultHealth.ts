import { api } from "@/trpc/react";
import useCalculateVaultHealth from "../../vaultTable/hooks/useCalculateVaultHealth";
import { useFormContext } from "react-hook-form";
import type { TMintFormFields } from "@/components/providers/mintFormProvider";
import type { badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

interface UseVaultHealthParams {
  /** The vault ID to get health for */
  vaultId: number;
}

interface UseVaultHealthReturn {
  /** Vault health variant (red/yellow/green) */
  healthVariant: VariantProps<typeof badgeVariants>["variant"];
  /** Whether the vault health is bad (red or yellow) */
  badHealth: boolean;
  /** Whether the data is still loading */
  isLoading: boolean;
}

/**
 * Simplified hook for liquidity page that only calculates vault health
 * without expensive max ape calculations.
 * 
 * @param params - Configuration parameters
 * @returns Object containing vault health status and loading state
 */
export function useVaultHealth({
  vaultId,
}: UseVaultHealthParams): UseVaultHealthReturn {
  const formData = useFormContext<TMintFormFields>().watch();
  
  // Fetch vault reserve data (APE and TEA reserves)
  const { data: reserveData, isLoading } = api.vault.getReserve.useQuery(
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

  // Determine if vault health is bad (red or yellow status)
  const badHealth = healthVariant === "red" || healthVariant === "yellow";

  return { 
    healthVariant,
    badHealth, 
    isLoading 
  };
}
