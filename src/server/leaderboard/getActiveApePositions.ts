import { ApeContract } from "@/contracts/ape";
import { AssistantContract } from "@/contracts/assistant";
import { env } from "@/env";
import { ZTokenPrices } from "@/lib/schemas";
import type { TCurrentApePositions } from "@/lib/types";
import { multicall, readContract } from "@/lib/viemClient";
import { getCurrentApePositions } from "@/server/queries/leaderboard";
import { formatUnits, fromHex, getAddress } from "viem";
import buildData from "@/../public/build-data.json";
import { appRouter } from "@/server/api/root";
import { createCallerFactory } from "@/server/api/trpc";
import { shouldUseCoinGecko, getCoinGeckoPlatformId, getAlchemyChainString } from "@/lib/chains";

export async function getActiveApePositions(): Promise<TCurrentApePositions> {
  const { apePositions } = await getCurrentApePositions();
  if (apePositions.length === 0) return {};

  // Create TRPC caller for server-side calls
  const createCaller = createCallerFactory(appRouter);
  const caller = createCaller({ headers: new Headers() });

  const chainId = parseInt(env.NEXT_PUBLIC_CHAIN_ID);
  const useCoinGecko = shouldUseCoinGecko(chainId);

  const { apeTokens, totalSupplyContracts, vaultIds, uniqueCollateralTokens } = apePositions.reduce(
    (acc, position) => {
      if (!acc.collateralTokenSet.has(position.vault.collateralToken.id)) {
        acc.collateralTokenSet.add(position.vault.collateralToken.id);
        acc.apeTokens.push({
          network: getAlchemyChainString(chainId),
          address: position.vault.collateralToken.id,
        });
        acc.uniqueCollateralTokens.push({
          address: position.vault.collateralToken.id,
          decimals: position.vault.collateralToken.decimals,
        });
      }
      acc.totalSupplyContracts.push({
        address: position.vault.ape.id,
        abi: ApeContract.abi,
        functionName: "totalSupply" as const,
      });
      acc.vaultIds.push(fromHex(position.vault.id, "number"));
      return acc;
    },
    {
      collateralTokenSet: new Set<string>(),
      apeTokens: [] as { network: string; address: string }[],
      totalSupplyContracts: [] as {
        address: `0x${string}`;
        abi: typeof ApeContract.abi;
        functionName: "totalSupply";
      }[],
      vaultIds: [] as number[],
      uniqueCollateralTokens: [] as { address: string; decimals: number }[],
    },
  );

  // Fetch prices based on chain (Alchemy for Ethereum, CoinGecko for HyperEVM)
  let priceResponse: Response | null = null;

  if (!useCoinGecko && env.ALCHEMY_BEARER) {
    // Use Alchemy for Ethereum chains
    priceResponse = await fetch(
      `https://api.g.alchemy.com/prices/v1/${env.ALCHEMY_BEARER}/tokens/by-address`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({ addresses: apeTokens }),
      },
    ).catch(() => null);
  }

  const [apeTotalSupply, vaultReserves] = await Promise.all([
    multicall({ contracts: totalSupplyContracts }),
    readContract({
      ...AssistantContract,
      functionName: "getReserves",
      args: [vaultIds],
    }),
  ]);

  // Use base fee from build-data (already converted to basis points)
  // buildData.systemParams.baseFee is in decimal (e.g., 0.1 for 10%)
  // Convert to basis points for the calculation (multiply by 10000)
  const baseFeeInBasisPoints = Math.round(buildData.systemParams.baseFee * 10000);
  const prices: Record<string, string> = {};

  if (useCoinGecko) {
    // For HyperEVM chains, try to get prices from CoinGecko first
    const platformId = getCoinGeckoPlatformId(chainId);
    const addressList = uniqueCollateralTokens.map(t => t.address.toLowerCase()).join(',');

    if (addressList) {
      try {
        const headers: HeadersInit = {
          accept: "application/json",
        };

        const apiKey = process.env.COINGECKO_API_KEY;
        if (apiKey) {
          headers["x-cg-demo-api-key"] = apiKey;
        }

        const url = `https://api.coingecko.com/api/v3/simple/token_price/${platformId}?contract_addresses=${addressList}&vs_currencies=usd`;
        const response = await fetch(url, { headers });

        if (response.ok) {
          const data = (await response.json()) as Record<string, { usd?: number }>;
          Object.entries(data).forEach(([address, priceData]) => {
            if (priceData.usd) {
              // Find the original address (CoinGecko returns lowercase)
              const originalAddress = uniqueCollateralTokens.find(
                t => t.address.toLowerCase() === address.toLowerCase()
              )?.address;
              if (originalAddress) {
                prices[originalAddress] = priceData.usd.toString();
              }
            }
          });
        }
      } catch (error) {
        console.error("Failed to fetch CoinGecko prices:", error);
      }
    }
  } else {
    // For Ethereum chains, get prices from Alchemy
    if (priceResponse?.ok) {
      try {
        const priceResult = ZTokenPrices.parse(await priceResponse.json());
        priceResult.data.forEach((token) => {
          prices[token.address] = token.prices[0]?.value ?? "0";
        });
      } catch {}
    }
  }

  // For any tokens without prices, use the fallback mechanism
  const tokensWithoutPrice = uniqueCollateralTokens.filter(
    token => !prices[token.address] || prices[token.address] === "0"
  );

  if (tokensWithoutPrice.length > 0) {
    const apiName = useCoinGecko ? "CoinGecko" : "Alchemy";
    console.log(`Found ${tokensWithoutPrice.length} tokens without ${apiName} prices, using fallback...`);

    // Fetch prices with fallback for tokens without Alchemy prices
    const fallbackPrices = await Promise.all(
      tokensWithoutPrice.map(async (token) => {
        try {
          const price = await caller.price.getTokenPriceWithFallback({
            tokenAddress: token.address,
            tokenDecimals: token.decimals,
          });
          return { address: token.address, price };
        } catch (error) {
          console.error(`Failed to get fallback price for ${token.address}:`, error);
          return { address: token.address, price: null };
        }
      })
    );

    // Update prices with fallback results
    fallbackPrices.forEach(({ address, price }) => {
      if (price !== null) {
        prices[address] = price.toString();
        console.log(`Got fallback price for ${address}: $${price}`);
      } else {
        console.warn(`No price available for ${address}, will use 0`);
        prices[address] = "0";
      }
    });
  }

  const allPositions: Array<{
    vaultId: `0x${string}`;
    user: `0x${string}`;
    apeBalance: string;
    collateralToken: string;
    collateralSymbol?: string;
    debtToken?: string;
    debtSymbol?: string;
    pnlUsd: number;
    pnlUsdPercentage: number;
    pnlCollateral: number;
    pnlCollateralPercentage: number;
    leverageTier: number;
    netCollateralPosition: number;
    dollarTotal: number;
    collateralTotal: string;
  }> = [];

  apePositions.forEach(
    (
      {
        balance,
        user,
        dollarTotal,
        collateralTotal,
        vault,
      },
      index,
    ) => {
      // Get vault state data
      const apeTotalSupplyInVault = BigInt(apeTotalSupply[index]?.result ?? 0n);
      const vaultCollateralReserves = vaultReserves[index]?.reserveApes ?? 0n;
      
      // Skip if vault has no supply or reserves
      if (apeTotalSupplyInVault === 0n || vaultCollateralReserves === 0n) return;
      
      // Step 1: Calculate user's share of vault collateral
      // User owns (balance / totalSupply) of the vault's collateral
      const userApeBalance = BigInt(balance);
      const userShareOfVaultCollateral =
        (userApeBalance * vaultCollateralReserves) / apeTotalSupplyInVault;
      
      // Step 2: Apply leverage adjustment to get net position
      // Higher leverage tiers have higher fees, reducing net collateral
      // Formula: 10000 + (2^leverageTier * baseFeeInBasisPoints)
      const leverageFeeMultiplier = BigInt(10000 + 2 ** vault.leverageTier * baseFeeInBasisPoints);
      const netCollateralAfterFees =
        (userShareOfVaultCollateral * 10000n) / leverageFeeMultiplier;
      
      // Step 3: Convert positions to human-readable numbers
      const currentCollateralAmount = +formatUnits(
        netCollateralAfterFees,
        vault.collateralToken.decimals,
      );
      // collateralTotal is a BigInt string from the subgraph (in smallest units)
      // Need to format it with the proper decimals
      const originalCollateralDeposited = +formatUnits(
        BigInt(collateralTotal),
        vault.collateralToken.decimals,
      );

      // Step 4: Calculate USD values using current market prices
      const currentTokenPrice = +(prices[vault.collateralToken.id] ?? "0");
      const currentPositionValueUsd = currentCollateralAmount * currentTokenPrice;
      // dollarTotal is now a BigDecimal string from the subgraph
      const originalDepositValueUsd = parseFloat(dollarTotal);
      
      // Step 5: Calculate PnL (Profit and Loss)
      // PnL in USD
      const pnlUsd = currentPositionValueUsd - originalDepositValueUsd;
      const pnlUsdPercentage =
        originalDepositValueUsd > 0 
          ? (pnlUsd / originalDepositValueUsd) * 100 
          : 0;
      
      // PnL in collateral tokens
      const pnlCollateral = currentCollateralAmount - originalCollateralDeposited;
      const pnlCollateralPercentage =
        originalCollateralDeposited > 0
          ? (pnlCollateral / originalCollateralDeposited) * 100
          : 0;

      // Store calculated position data
      allPositions.push({
        vaultId: vault.id,
        apeBalance: formatUnits(userApeBalance, vault.ape.decimals),
        collateralToken: vault.collateralToken.id,
        collateralSymbol: vault.collateralToken.symbol ?? undefined,
        debtToken: vault.debtToken.id,
        debtSymbol: vault.debtToken.symbol ?? undefined,
        pnlUsd,
        pnlUsdPercentage,
        pnlCollateral,
        pnlCollateralPercentage,
        leverageTier: vault.leverageTier,
        netCollateralPosition: currentPositionValueUsd,
        dollarTotal: originalDepositValueUsd,
        collateralTotal: originalCollateralDeposited.toString(),
        user: getAddress(user),
      });
    },
  );

  // Sort positions by PnL in descending order
  const sortedPositions = allPositions.sort((a, b) => b.pnlUsd - a.pnlUsd);

  const result: TCurrentApePositions = {};
  sortedPositions.forEach((position, index) => {
    result[`position-${index}`] = {
      rank: index + 1,
      position, // Each entry now contains a single position
    };
  });

  return result;
}
