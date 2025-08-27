import type { TMintFormFields } from "@/components/providers/mintFormProvider";
import { useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import useVaultFilterStore from "@/lib/store";

export default function useSetDepositTokenDefault({
  collToken,
}: {
  collToken: string | undefined;
}) {
  const { setValue, watch } = useFormContext<TMintFormFields>();
  const previousCollToken = useRef<string | undefined>(undefined);
  const currentDepositToken = watch("depositToken");
  const debtToken = watch("versus")?.split(",")[0];
  const storeDepositToken = useVaultFilterStore(state => state.depositToken);
  const isFirstRender = useRef(true);
  
  useEffect(() => {
    // Only run if we have a collToken
    if (!collToken) return;
    
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // On first render, if there's no depositToken from store, set collateral as default
      if (!storeDepositToken) {
        setValue("depositToken", collToken);
      }
      previousCollToken.current = collToken;
      return;
    }
    
    // Vault changed
    if (collToken !== previousCollToken.current) {
      // Always set to new collateral when vault changes
      // Unless user explicitly selected debt token and it's still available in new vault
      if (!currentDepositToken || 
          currentDepositToken === previousCollToken.current ||
          (currentDepositToken !== debtToken)) {
        setValue("depositToken", collToken);
      }
      previousCollToken.current = collToken;
    } else {
      // Even if vault hasn't changed, ensure deposit token is set
      // This handles edge cases where the component re-renders but deposit token is empty
      if (!currentDepositToken) {
        setValue("depositToken", collToken);
      }
    }
  }, [collToken, setValue, currentDepositToken, debtToken, storeDepositToken]);
}
