import type { TCalculatorFormFields } from "@/components/providers/calculatorFormProvider";
import { useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import useVaultFilterStore from "@/lib/store";

export default function useSetDepositTokenDefault({
  collToken,
}: {
  collToken: string | undefined;
}) {
  const { setValue, watch } = useFormContext<TCalculatorFormFields>();
  const previousCollToken = useRef<string | undefined>(undefined);
  const currentDepositToken = watch("depositToken");
  const debtToken = watch("versus")?.split(",")[0];
  const longToken = watch("long")?.split(",")[0];
  const storeDepositToken = useVaultFilterStore(state => state.depositToken);
  const isFirstRender = useRef(true);
  const hasSetFromStore = useRef(false);
  
  useEffect(() => {
    
    // Use longToken as fallback collateral token when vault not found yet
    const effectiveCollToken = collToken ?? longToken;
    
    // Only run if we have a collateral token (either from vault or form)
    if (!effectiveCollToken) return;
    
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // On first render, check if form already has a deposit token value from store sync
      // If not, set default based on store or collateral
      if (!currentDepositToken) {
        if (storeDepositToken) {
          setValue("depositToken", storeDepositToken);
          hasSetFromStore.current = true;
        } else {
          setValue("depositToken", effectiveCollToken);
        }
      }
      previousCollToken.current = effectiveCollToken;
      return;
    }
    
    // Vault changed
    if (effectiveCollToken !== previousCollToken.current) {
      // Always set to new collateral when vault changes
      // Unless user explicitly selected debt token and it's still available in new vault
      if (!currentDepositToken || 
          currentDepositToken === previousCollToken.current ||
          (currentDepositToken !== debtToken)) {
        setValue("depositToken", effectiveCollToken);
      }
      previousCollToken.current = effectiveCollToken;
      hasSetFromStore.current = false;
    }
  }, [collToken, setValue, currentDepositToken, debtToken, longToken, storeDepositToken]);
}
