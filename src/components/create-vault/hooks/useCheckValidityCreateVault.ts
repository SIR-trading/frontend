import { useMemo } from "react";

interface Props {
  vaultData: number | undefined;
  vaultSimulation: boolean;
}
export function useCheckValidityCreactVault({
  vaultData,
  vaultSimulation,
}: Props) {
  const isValid = useMemo(() => {
    if (vaultData === 0) {
      return { isValid: false, error: "Invalid token address(es)" };
    }
    if (vaultData === 1) {
      return { isValid: false, error: "No Uniswap Pool." };
    }
    if (vaultData === 3) {
      return { isValid: false, error: "Vault Already Exists" };
    }
    if (vaultSimulation) {
      return { isValid: true, error: undefined };
    } else {
      return { isValid: false, error: "" };
    }
  }, [vaultData, vaultSimulation]);
  return isValid;
}
