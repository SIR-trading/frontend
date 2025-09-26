import { api } from "@/trpc/react";
import { useMemo, useState, useEffect } from "react";
import { parseUnits } from "viem";

export function useSirUsdPrice(amount?: string) {
  // Debounced amount to prevent excessive API calls while typing
  const [debouncedAmount, setDebouncedAmount] = useState(amount);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAmount(amount);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [amount]);

  // Fetch SIR price in USD
  const { data: sirPriceUsd, isLoading } = api.price.getSirPriceInUsd.useQuery(
    undefined,
    {
      staleTime: 60000, // 1 minute cache
    }
  );

  // Calculate USD value
  const usdValue = useMemo(() => {
    if (!debouncedAmount || parseFloat(debouncedAmount) === 0) return null;
    if (!sirPriceUsd) return null;

    // Convert amount to number (SIR has 12 decimals)
    const amountInTokens = parseFloat(debouncedAmount);
    const usdAmount = amountInTokens * sirPriceUsd;

    return usdAmount;
  }, [debouncedAmount, sirPriceUsd]);

  return {
    usdValue,
    isLoading,
    pricePerToken: sirPriceUsd,
  };
}