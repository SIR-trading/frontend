import { parseUnits } from "viem";
import type { TBurnFields } from "../burnForm";
import { useMemo } from "react";
import useGetChainId from "@/components/shared/hooks/useGetChainId";
import { env } from "@/env";

export function useBurnFormValidation(
  formData: TBurnFields,
  tokenBalance: bigint | undefined,
) {
  const chainId = useGetChainId();
  const { isValid, error } = useMemo(() => {
    if (chainId?.toString() !== env.NEXT_PUBLIC_CHAIN_ID && Boolean(chainId)) {
      return { isValid: false, error: "Wrong network!" };
    }
    if (parseUnits(formData.deposit ?? "0", 18) > (tokenBalance ?? 0n)) {
      return { isValid: false, error: "Insufficent balance." };
    }
    return { isValid: true, error: null };
  }, [chainId, formData.deposit, tokenBalance]);
  return { isValid, error };
}
