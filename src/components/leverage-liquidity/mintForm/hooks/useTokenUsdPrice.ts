import { api } from "@/trpc/react";
import { shouldUseCoinGecko, getCoinGeckoPlatformId, getAlchemyChainString } from "@/lib/chains";
import { useChainId } from "wagmi";
import { useMemo, useState, useEffect } from "react";
import { parseUnits } from "viem";

export function useTokenUsdPrice(tokenAddress?: string, amount?: string, decimals?: number) {
  const chainId = useChainId();

  // Debounced amount to prevent excessive API calls while typing
  const [debouncedAmount, setDebouncedAmount] = useState(amount);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAmount(amount);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [amount]);

  // Determine which price source to use based on chain
  const useCoinGecko = shouldUseCoinGecko(chainId);

  // Only enable queries when we have a debounced amount
  const shouldFetchPrice = !!tokenAddress && !!debouncedAmount && parseFloat(debouncedAmount) > 0;

  // Fetch price using Alchemy for Ethereum chains
  const { data: alchemyPrice, isLoading: alchemyLoading } = api.price.getTokenPrice.useQuery(
    {
      contractAddress: tokenAddress ?? "",
      chain: getAlchemyChainString(chainId)
    },
    {
      enabled: !useCoinGecko && shouldFetchPrice,
      staleTime: 60000, // 1 minute cache
    }
  );

  // Fetch price using CoinGecko for HyperEVM chains
  const { data: coinGeckoPrice, isLoading: coinGeckoLoading } = api.price.getCoinGeckoPrice.useQuery(
    {
      platformId: getCoinGeckoPlatformId(chainId),
      contractAddress: tokenAddress ?? ""
    },
    {
      enabled: useCoinGecko && shouldFetchPrice,
      staleTime: 60000, // 1 minute cache
    }
  );

  const fallbackEnabled = shouldFetchPrice && (
    (!useCoinGecko && !alchemyPrice?.data?.[0]?.prices?.[0]?.value) ||
    (useCoinGecko && !coinGeckoPrice)
  );

  // Fetch price with Uniswap fallback for exotic tokens
  const { data: fallbackPrice, isLoading: fallbackLoading } = api.price.getTokenPriceWithFallback.useQuery(
    {
      tokenAddress: tokenAddress ?? "",
      tokenDecimals: decimals ?? 18,
    },
    {
      enabled: fallbackEnabled,
      staleTime: 60000, // 1 minute cache
    }
  );

  // Calculate USD value
  const usdValue = useMemo(() => {
    if (!debouncedAmount || decimals === null || decimals === undefined || parseFloat(debouncedAmount) === 0) {
      return null;
    }

    let pricePerToken: number | null = null;

    // Try primary sources first
    if (!useCoinGecko && alchemyPrice?.data?.[0]?.prices?.[0]?.value) {
      pricePerToken = Number(alchemyPrice.data[0].prices[0].value);
    } else if (useCoinGecko && coinGeckoPrice) {
      pricePerToken = coinGeckoPrice;
    }

    // Use fallback price if primary sources failed
    if (!pricePerToken && fallbackPrice !== null && fallbackPrice !== undefined) {
      pricePerToken = fallbackPrice;
    }

    if (!pricePerToken) {
      return null;
    }

    // Convert amount to number (considering decimals)
    const amountInTokens = parseFloat(debouncedAmount);
    const usdAmount = amountInTokens * pricePerToken;

    return usdAmount;
  }, [debouncedAmount, decimals, alchemyPrice, coinGeckoPrice, fallbackPrice, useCoinGecko]);

  return {
    usdValue,
    isLoading: false, // We always have fallback, so never truly loading
    pricePerToken: useCoinGecko
      ? (coinGeckoPrice ?? fallbackPrice ?? null)
      : (alchemyPrice?.data?.[0]?.prices?.[0]?.value
          ? Number(alchemyPrice.data[0].prices[0].value)
          : fallbackPrice ?? null)
  };
}