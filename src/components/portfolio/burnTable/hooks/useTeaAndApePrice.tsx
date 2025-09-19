import { formatUnits } from "viem";
import { api } from "@/trpc/react";
import type { TUserPosition } from "@/server/queries/vaults";
import { useAccount } from "wagmi";
import {
  getAlchemyChainString,
  getCoinGeckoPlatformId,
  shouldUseCoinGecko,
} from "@/lib/chains";
import { SirContract } from "@/contracts/sir";

export function useTeaAndApePrice({
  quoteBurn,
  row,
}: {
  quoteBurn: bigint | undefined;
  row: TUserPosition;
}) {
  const { chainId } = useAccount();

  const collateralAmount = parseFloat(
    formatUnits(quoteBurn ?? 0n, row.decimals),
  );

  const contractAddress: string = row.collateralToken ?? "";

  // Check if the collateral token is SIR
  const isSirToken = contractAddress.toLowerCase() === SirContract.address.toLowerCase();

  // Use CoinGecko for HyperEVM chains
  const useCoinGecko = shouldUseCoinGecko(chainId);
  const alchemyChain = getAlchemyChainString(chainId);
  const coinGeckoPlatform = getCoinGeckoPlatformId(chainId);

  // Fetch SIR price in USD (only when collateral is SIR)
  const { data: sirPriceInUsd } = api.price.getSirPriceInUsd.useQuery(
    undefined,
    {
      enabled: isSirToken,
    },
  );

  // Fetch price from Alchemy (only when not using CoinGecko and not SIR)
  const { data: alchemyData } = api.price.getTokenPrice.useQuery(
    {
      contractAddress,
      chain: alchemyChain,
    },
    {
      enabled: Boolean(contractAddress) && !useCoinGecko && !isSirToken,
    },
  );

  // Fetch price from CoinGecko (only when using CoinGecko and not SIR)
  const { data: coinGeckoPrice } = api.price.getCoinGeckoPrice.useQuery(
    {
      platformId: coinGeckoPlatform,
      contractAddress,
    },
    {
      enabled: Boolean(contractAddress) && useCoinGecko && !isSirToken,
    },
  );

  // If no quoteBurn data, return 0
  if (!quoteBurn) {
    return 0;
  }

  // Get price from the appropriate source
  let collateralPrice = 0;

  if (isSirToken) {
    // Use SIR price from Uniswap
    collateralPrice = sirPriceInUsd ?? 0;
  } else if (useCoinGecko) {
    // Use CoinGecko for HyperEVM chains
    collateralPrice = coinGeckoPrice ?? 0;
  } else {
    // Use Alchemy for Ethereum chains
    collateralPrice = alchemyData?.data?.[0]?.prices?.[0]?.value
      ? Number(alchemyData.data[0].prices[0].value)
      : 0;
  }

  const usdValue = collateralAmount * collateralPrice;

  // Return USD value: collateral amount * price per token
  return usdValue;
}
