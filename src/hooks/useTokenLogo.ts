import { useTokenlistContext } from "@/contexts/tokenListProvider";
import { getLogoAssetWithFallback } from "@/lib/assets";
import { useMemo } from "react";
import type { Address } from "viem";

/**
 * Hook to get token logo with fallback to assets.json logoURI
 * when Trust Wallet asset is not available
 */
export function useTokenLogo(address: Address | undefined, chainId?: string) {
  const { tokenMap } = useTokenlistContext();

  return useMemo(() => {
    if (!address) {
      return { primary: "", fallback: undefined };
    }

    return getLogoAssetWithFallback(address, tokenMap, chainId);
  }, [address, tokenMap, chainId]);
}
