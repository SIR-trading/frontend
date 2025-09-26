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
  const { data: alchemyPrice } = api.price.getTokenPrice.useQuery(
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
  const { data: coinGeckoPrice } = api.price.getCoinGeckoPrice.useQuery(
    {
      platformId: getCoinGeckoPlatformId(chainId),
      contractAddress: tokenAddress ?? ""
    },
    {
      enabled: useCoinGecko && shouldFetchPrice,
      staleTime: 60000, // 1 minute cache
    }
  );

  // Calculate USD value
  const usdValue = useMemo(() => {
    if (!debouncedAmount || !decimals || parseFloat(debouncedAmount) === 0) return null;

    let pricePerToken: number | null = null;

    if (!useCoinGecko && alchemyPrice?.data?.[0]?.prices?.[0]?.value) {
      pricePerToken = Number(alchemyPrice.data[0].prices[0].value);
    } else if (useCoinGecko && coinGeckoPrice) {
      pricePerToken = coinGeckoPrice;
    }

    if (!pricePerToken) return null;

    // Convert amount to number (considering decimals)
    const amountInTokens = parseFloat(debouncedAmount);
    const usdAmount = amountInTokens * pricePerToken;

    return usdAmount;
  }, [debouncedAmount, decimals, alchemyPrice, coinGeckoPrice, useCoinGecko]);

  return {
    usdValue,
    isLoading: useCoinGecko ? !coinGeckoPrice : !alchemyPrice,
    pricePerToken: useCoinGecko ? coinGeckoPrice : alchemyPrice?.data?.[0]?.prices?.[0]?.value ? Number(alchemyPrice.data[0].prices[0].value) : null
  };
}