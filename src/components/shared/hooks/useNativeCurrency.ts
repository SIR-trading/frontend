import { useMemo } from "react";
import { getCurrentChainConfig } from "@/lib/chains";

export function useNativeCurrency() {
  return useMemo(() => {
    try {
      const config = getCurrentChainConfig();
      return {
        name: config.nativeCurrency.name,
        symbol: config.nativeCurrency.symbol,
        decimals: config.nativeCurrency.decimals,
        wrappedSymbol: config.wrappedToken.symbol,
      };
    } catch (error) {
      // Fallback to ETH if chain config not found
      console.error("Failed to get chain config:", error);
      return {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
        wrappedSymbol: "WETH",
      };
    }
  }, []);
}