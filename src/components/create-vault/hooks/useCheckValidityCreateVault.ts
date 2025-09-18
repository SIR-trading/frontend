import { useMemo } from "react";
import { getDexName } from "@/lib/chains";

interface Props {
  vaultData: number | undefined;
  vaultSimulation: boolean;
  isCheckingOracle?: boolean;
}
export function useCheckValidityCreactVault({
  vaultData,
  vaultSimulation,
  isCheckingOracle = false,
}: Props) {
  const isValid = useMemo(() => {
    // Don't show errors while checking oracle
    if (isCheckingOracle) {
      return { isValid: false, error: "" };
    }

    if (vaultData === 0) {
      return { isValid: false, error: "Invalid token address(es)" };
    }
    if (vaultData === 1) {
      return {
        isValid: false,
        error: `No ${getDexName()} price oracle available for this pair`,
      };
    }
    if (vaultData === 3) {
      return {
        isValid: false,
        error: "Vault already exists for this configuration",
      };
    }
    if (vaultSimulation) {
      return { isValid: true, error: undefined };
    } else {
      return { isValid: false, error: "" };
    }
  }, [vaultData, vaultSimulation, isCheckingOracle]);
  return isValid;
}
