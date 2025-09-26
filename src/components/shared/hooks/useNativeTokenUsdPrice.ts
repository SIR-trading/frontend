import { api } from "@/trpc/react";
import { useMemo, useState, useEffect } from "react";
import { useChainId } from "wagmi";
import { getWrappedNativeTokenAddress } from "@/config/chains";
import { shouldUseCoinGecko, getCoinGeckoPlatformId, getAlchemyChainString } from "@/lib/chains";

export function useNativeTokenUsdPrice(amount?: string) {
  const chainId = useChainId();

  // Debounced amount to prevent excessive API calls while typing
  const [debouncedAmount, setDebouncedAmount] = useState(amount);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAmount(amount);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [amount]);

  // Get wrapped native token address
  const wrappedTokenAddress = getWrappedNativeTokenAddress(chainId);

  // Determine which price source to use based on chain
  const useCoinGecko = shouldUseCoinGecko(chainId);

  // Only enable queries when we have a debounced amount
  const shouldFetchPrice = !!debouncedAmount && parseFloat(debouncedAmount) > 0;

  // Fetch price using Alchemy for Ethereum chains
  const { data: alchemyPrice } = api.price.getTokenPrice.useQuery(
    {
      contractAddress: wrappedTokenAddress,
      chain: getAlchemyChainString(chainId)
    },
    {
      enabled: !useCoinGecko && shouldFetchPrice,
      staleTime: 60000, // 1 minute cache
    }
  );

  // Fetch price using CoinGecko for HyperEVM chains
  const { data: coinGeckoPrice } = api.price.getCoinGeckoPrice.useQuery(
    {
      platformId: getCoinGeckoPlatformId(chainId),
      contractAddress: wrappedTokenAddress
    },
    {
      enabled: useCoinGecko && shouldFetchPrice,
      staleTime: 60000, // 1 minute cache
    }
  );

  // Calculate USD value
  const usdValue = useMemo(() => {
    if (!debouncedAmount || parseFloat(debouncedAmount) === 0) return null;

    let pricePerToken: number | null = null;

    if (!useCoinGecko && alchemyPrice?.data?.[0]?.prices?.[0]?.value) {
      pricePerToken = Number(alchemyPrice.data[0].prices[0].value);
    } else if (useCoinGecko && coinGeckoPrice) {
      pricePerToken = coinGeckoPrice;
    }

    if (!pricePerToken) return null;

    // Convert amount to number (native tokens have 18 decimals)
    const amountInTokens = parseFloat(debouncedAmount);
    const usdAmount = amountInTokens * pricePerToken;

    return usdAmount;
  }, [debouncedAmount, alchemyPrice, coinGeckoPrice, useCoinGecko]);

  return {
    usdValue,
    isLoading: false,
    pricePerToken: useCoinGecko
      ? coinGeckoPrice
      : (alchemyPrice?.data?.[0]?.prices?.[0]?.value
          ? Number(alchemyPrice.data[0].prices[0].value)
          : null)
  };
}