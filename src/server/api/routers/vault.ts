import { ApeContract } from "@/contracts/ape";
import { AssistantContract } from "@/contracts/assistant";
import { getVaultsForTable } from "@/lib/getVaults";
import { ZAddress } from "@/lib/schemas";
import type { TAddressString, VaultFieldFragment } from "@/lib/types";
import { multicall, readContract } from "@/lib/viemClient";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { executeSearchVaultsQuery } from "@/server/queries/searchVaults";
import { executeVaultsQuery } from "@/server/queries/vaults";
import { executeGetVaultFees } from "@/server/queries/fees";
import type { Address } from "viem";
import { erc20Abi } from "viem";
import { parseUnits } from "viem";
import { z } from "zod";
import { VaultContract } from "@/contracts/vault";
import { SirContract } from "@/contracts/sir";
import { WethContract } from "@/contracts/weth";
import { shouldUseCoinGecko, getCoinGeckoPlatformId, getAlchemyChainString } from "@/lib/chains";
import { env } from "@/env";

// Extended vault interface for backward compatibility
type VaultWithCollateral = VaultFieldFragment;
const ZVaultFilters = z.object({
  filterLeverage: z.string().optional(),
  filterDebtToken: z.string().optional(),
  filterCollateralToken: z.string().optional(),
});

// Cache for SIR price to avoid repeated Uniswap calls (5 minute cache)
let sirPriceCache: { price: number; timestamp: number } | null = null;
const SIR_PRICE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached SIR price or fetch from Uniswap if cache is expired
 */
async function getCachedSirPrice(): Promise<number> {
  const now = Date.now();

  if (
    sirPriceCache &&
    now - sirPriceCache.timestamp < SIR_PRICE_CACHE_DURATION
  ) {
    return sirPriceCache.price;
  }

  const price = await getSirPriceInWrappedNativeToken();
  sirPriceCache = { price, timestamp: now };
  return price;
}

/**
 * Calculate the APY from SIR token rewards for a specific vault
 */
async function calculateSirRewardsApy(vaultId: string): Promise<number> {
  try {
    // Get vault information to get the rate and collateral token
    const vaults = await executeVaultsQuery({});
    const vault = vaults.vaults.find((v) => v.id === vaultId);

    if (!vault?.rate || parseFloat(vault.rate) === 0) {
      return 0; // No SIR rewards for this vault
    }

    // Convert rate from string to float (rate is already per second, scaled by 10^12)
    const ratePerSecond = parseFloat(vault.rate) / 1e12;
    // Log the rate for debugging
    console.log("Rate per second:", ratePerSecond);

    // Log rate per day for debugging
    const SECONDS_IN_DAY = 24 * 60 * 60;
    const dailyRate = ratePerSecond * SECONDS_IN_DAY;

    // Convert to annual rate (seconds in a year = 365 * 24 * 60 * 60)
    const SECONDS_IN_YEAR = 365 * 24 * 60 * 60;
    const annualSirRewards = ratePerSecond * SECONDS_IN_YEAR;

    // Get SIR price in wrapped native token from Uniswap (cached)
    const sirPriceInWrappedNativeToken = await getCachedSirPrice();

    // Get vault collateral belonging to LPers (reserveLPers) and scale with decimals
    const totalLpCollateral =
      parseFloat(vault.reserveLPers) /
      Math.pow(10, vault.collateralToken.decimals);

    // Calculate external LP collateral (excluding POL)
    const teaSupply = parseFloat(vault.teaSupply);
    const lockedLiquidity = parseFloat(vault.lockedLiquidity);

    let vaultCollateral = totalLpCollateral;

    // If TEA supply exists, subtract POL portion
    if (teaSupply > 0) {
      // POL percentage = lockedLiquidity / teaSupply
      // External LP collateral = totalLpCollateral * (1 - POL%)
      const externalLpRatio = Math.max(0, (teaSupply - lockedLiquidity) / teaSupply);
      vaultCollateral = totalLpCollateral * externalLpRatio;
    } else if (totalLpCollateral > 0) {
      // If TEA supply is 0 but there's LP collateral, all of it is POL
      vaultCollateral = 0;
    }

    if (vaultCollateral === 0) {
      return 0; // No collateral, can't calculate APY
    }

    // Check if the vault uses SIR as collateral (compare addresses case-insensitively)
    if (
      vault.collateralToken.id.toLowerCase() ===
      SirContract.address.toLowerCase()
    ) {
      // For SIR collateral vaults, no price conversion needed
      // APY is simply: (annual SIR rewards / SIR collateral) * 100
      const apy = (annualSirRewards / vaultCollateral) * 100;
      return apy;
    }

    // For non-SIR collateral vaults, need price conversion
    if (sirPriceInWrappedNativeToken === 0) {
      return 0;
    }

    // Try to convert SIR price to vault's collateral token
    // This may fail for tokens without Alchemy price data
    let sirPriceInCollateral = 0;
    try {
      sirPriceInCollateral = await convertWrappedNativeTokenPriceToCollateral(
        sirPriceInWrappedNativeToken,
        vault.collateralToken.id,
      );
    } catch (error) {
      // If conversion fails (token not in Alchemy), try fallback to Uniswap
      try {
        const { getMostLiquidPoolPrice } = await import("./quote");
        // Try to get direct pool price between collateral and wrapped native token
        const poolData = await getMostLiquidPoolPrice({
          tokenA: vault.collateralToken.id,
          tokenB: WethContract.address,
          decimalsA: vault.collateralToken.decimals,
          decimalsB: 18,
        });

        if (poolData.price > 0) {
          // poolData.price is collateral/WETH, we need to convert using WETH USD price
          // First get WETH USD price from Alchemy
          const response = await fetch(
            `https://api.g.alchemy.com/prices/v1/${process.env.ALCHEMY_BEARER}/tokens/by-address`,
            {
              method: "POST",
              headers: {
                accept: "application/json",
                "content-type": "application/json",
              },
              body: JSON.stringify({
                addresses: [
                  { network: "eth-mainnet", address: WethContract.address },
                ],
              }),
            },
          );

          if (response.ok) {
            const data = (await response.json()) as {
              data: Array<{
                address: string;
                prices: Array<{ value: string; currency: string }>;
              }>;
            };
            const wethUsdPrice = parseFloat(
              data.data[0]?.prices[0]?.value ?? "0",
            );
            if (wethUsdPrice > 0) {
              // Convert: SIR -> WETH -> USD -> Collateral
              const sirUsdPrice = sirPriceInWrappedNativeToken * wethUsdPrice;
              const collateralUsdPrice = poolData.price * wethUsdPrice;
              sirPriceInCollateral = sirUsdPrice / collateralUsdPrice;
            }
          }
        }
      } catch (fallbackError) {
        console.log("Uniswap fallback also failed:", fallbackError);
      }
    }

    if (sirPriceInCollateral === 0) {
      console.warn(
        `Could not convert SIR price to collateral token ${vault.collateralToken.symbol} for vault ${vaultId}`,
      );
      return 0;
    }

    // Calculate annual SIR rewards value in collateral token
    const annualRewardsValue = annualSirRewards * sirPriceInCollateral;

    // Calculate APY as percentage: (annual rewards value / collateral) * 100
    const apy = (annualRewardsValue / vaultCollateral) * 100;

    return apy;
  } catch (error) {
    console.error("Error calculating SIR rewards APY:", error);
    return 0;
  }
}

/**
 * Get SIR price in wrapped native token from Uniswap V3
 */
async function getSirPriceInWrappedNativeToken(): Promise<number> {
  try {
    // Import the direct pool reading function
    const { getMostLiquidPoolPrice } = await import("./quote");

    // Get the most liquid pool price for SIR/wrapped native token
    const poolData = await getMostLiquidPoolPrice({
      tokenA: SirContract.address,
      tokenB: WethContract.address,
      decimalsA: 12, // SIR has 12 decimals
      decimalsB: 18, // wrapped native token has 18 decimals
    });

    return poolData.price;
  } catch (error) {
    console.error("Error fetching SIR price from Uniswap:", error);
    return 0;
  }
}

/**
 * Convert wrapped native token price to collateral token price
 */
async function convertWrappedNativeTokenPriceToCollateral(
  wrappedNativeTokenPrice: number,
  collateralTokenAddress: TAddressString,
): Promise<number> {
  try {
    // If collateral is wrapped native token, no conversion needed
    if (
      collateralTokenAddress.toLowerCase() ===
      WethContract.address.toLowerCase()
    ) {
      return wrappedNativeTokenPrice;
    }

    const chainId = parseInt(env.NEXT_PUBLIC_CHAIN_ID);
    const useCoinGecko = shouldUseCoinGecko(chainId);

    if (useCoinGecko) {
      // Use CoinGecko for HyperEVM chains
      const platformId = getCoinGeckoPlatformId(chainId);
      if (!platformId) {
        throw new Error(`No CoinGecko platform ID found for chain: ${chainId}`);
      }

      const headers: HeadersInit = {
        accept: "application/json",
      };

      if (process.env.COINGECKO_API_KEY) {
        headers["x-cg-demo-api-key"] = process.env.COINGECKO_API_KEY;
      }

      // Fetch both wrapped native token and collateral prices
      const contractAddresses = [WethContract.address, collateralTokenAddress]
        .map(addr => addr.toLowerCase())
        .join(',');
      const url = `https://api.coingecko.com/api/v3/simple/token_price/${platformId}?contract_addresses=${contractAddresses}&vs_currencies=usd&include_24hr_change=false`;

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = (await response.json()) as Record<string, { usd?: number }>;

      const wrappedNativeTokenUsdPrice = data[WethContract.address.toLowerCase()]?.usd;
      const collateralUsdPrice = data[collateralTokenAddress.toLowerCase()]?.usd;

      if (!wrappedNativeTokenUsdPrice || !collateralUsdPrice || collateralUsdPrice === 0) {
        throw new Error(`Missing price data from CoinGecko for ${collateralTokenAddress}`);
      }

      // Convert: SIR -> wrapped native token -> USD -> Collateral
      const sirUsdPrice = wrappedNativeTokenPrice * wrappedNativeTokenUsdPrice;
      const sirCollateralPrice = sirUsdPrice / collateralUsdPrice;

      return sirCollateralPrice;
    } else {
      // Use Alchemy for Ethereum chains
      const alchemyChain = getAlchemyChainString(chainId);

      const response = await fetch(
        `https://api.g.alchemy.com/prices/v1/${process.env.ALCHEMY_BEARER}/tokens/by-address`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            addresses: [
              { network: alchemyChain, address: WethContract.address },
              { network: alchemyChain, address: collateralTokenAddress },
            ],
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Alchemy API error: ${response.status}`);
      }

      const data = (await response.json()) as {
        data: Array<{
          address: string;
          prices: Array<{ value: string; currency: string }>;
        }>;
      };

      const wrappedNativeTokenData = data.data.find(
        (token) =>
          token.address.toLowerCase() === WethContract.address.toLowerCase(),
      );
      const collateralData = data.data.find(
        (token) =>
          token.address.toLowerCase() === collateralTokenAddress.toLowerCase(),
      );

      if (
        !wrappedNativeTokenData?.prices[0]?.value ||
        !collateralData?.prices[0]?.value
      ) {
        throw new Error("Price data not available from Alchemy");
      }

      const wrappedNativeTokenUsdPrice = parseFloat(
        wrappedNativeTokenData.prices[0].value,
      );
      const collateralUsdPrice = parseFloat(collateralData.prices[0].value);

      if (collateralUsdPrice === 0) {
        throw new Error("Collateral price is zero");
      }

      // Convert: SIR -> wrapped native token -> USD -> Collateral
      const sirUsdPrice = wrappedNativeTokenPrice * wrappedNativeTokenUsdPrice;
      const sirCollateralPrice = sirUsdPrice / collateralUsdPrice;

      return sirCollateralPrice;
    }
  } catch (error) {
    console.error(
      "Error converting wrapped native token price to collateral:",
      error,
    );
    return 0;
  }
}
/**
 * Batch fetch token prices from Alchemy (Ethereum) or CoinGecko (HyperEVM) to avoid redundant API calls
 */
async function batchGetTokenPrices(
  collateralTokens: TAddressString[],
): Promise<Map<string, number>> {
  const priceMap = new Map<string, number>();

  if (collateralTokens.length === 0) {
    return priceMap;
  }

  const chainId = parseInt(env.NEXT_PUBLIC_CHAIN_ID);
  const useCoinGecko = shouldUseCoinGecko(chainId);

  try {
    // Add wrapped native token to the list for price conversion
    const tokensToFetch = [WethContract.address, ...collateralTokens];

    if (useCoinGecko) {
      // Use CoinGecko for HyperEVM chains
      const platformId = getCoinGeckoPlatformId(chainId);
      if (!platformId) {
        console.error("No CoinGecko platform ID found for chain:", chainId);
        return priceMap;
      }

      const headers: HeadersInit = {
        accept: "application/json",
      };

      if (process.env.COINGECKO_API_KEY) {
        headers["x-cg-demo-api-key"] = process.env.COINGECKO_API_KEY;
      }

      // CoinGecko allows multiple addresses in a single request
      const contractAddresses = tokensToFetch.map(addr => addr.toLowerCase()).join(',');
      const url = `https://api.coingecko.com/api/v3/simple/token_price/${platformId}?contract_addresses=${contractAddresses}&vs_currencies=usd&include_24hr_change=false`;

      const response = await fetch(url, { headers });

      if (!response.ok) {
        console.error(`CoinGecko API error: ${response.status} ${response.statusText}`);
        const errorBody = await response.text();
        console.error("Error response body:", errorBody);
        return priceMap;
      }

      const data = (await response.json()) as Record<string, { usd?: number }>;

      // Store USD prices for all tokens
      Object.entries(data).forEach(([address, priceData]) => {
        if (priceData.usd) {
          priceMap.set(address.toLowerCase(), priceData.usd);
        }
      });

      return priceMap;
    } else {
      // Use Alchemy for Ethereum chains
      const alchemyChain = getAlchemyChainString(chainId);

      const response = await fetch(
        `https://api.g.alchemy.com/prices/v1/${process.env.ALCHEMY_BEARER}/tokens/by-address`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            addresses: tokensToFetch.map((addr) => ({
              network: alchemyChain,
              address: addr,
            })),
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Alchemy API error: ${response.status}`);
      }

      const data = (await response.json()) as {
        data: Array<{
          address: string;
          prices: Array<{ value: string; currency: string }>;
        }>;
      };

      // Store USD prices for all tokens
      data.data.forEach((tokenData) => {
        if (tokenData.prices[0]?.value) {
          priceMap.set(
            tokenData.address.toLowerCase(),
            parseFloat(tokenData.prices[0].value),
          );
        }
      });

      return priceMap;
    }
  } catch (error) {
    console.error("Error batch fetching token prices:", error);
    return priceMap;
  }
}

/**
 * Calculate SIR rewards APY using cached prices to avoid redundant API calls
 */
async function calculateSirRewardsApyWithCachedPrices(
  vault: VaultWithCollateral,
  sirPriceInWrappedNativeToken: number,
  tokenPrices: Map<string, number>,
): Promise<number> {
  try {
    if (!vault?.rate || parseFloat(vault.rate) === 0) {
      return 0; // No SIR rewards for this vault
    }

    // Convert rate from string to float (rate is already per second, scaled by 10^12)
    const ratePerSecond = parseFloat(vault.rate) / 1e12;

    // Convert to annual rate (seconds in a year = 365 * 24 * 60 * 60)
    const SECONDS_IN_YEAR = 365 * 24 * 60 * 60;
    const annualSirRewards = ratePerSecond * SECONDS_IN_YEAR;

    // Get vault collateral belonging to LPers (reserveLPers) and scale with decimals
    const totalLpCollateral =
      parseFloat(vault.reserveLPers) /
      Math.pow(10, vault.collateralToken.decimals);

    // Calculate external LP collateral (excluding POL)
    const teaSupply = parseFloat(vault.teaSupply);
    const lockedLiquidity = parseFloat(vault.lockedLiquidity);

    let vaultCollateral = totalLpCollateral;

    // If TEA supply exists, subtract POL portion
    if (teaSupply > 0) {
      // POL percentage = lockedLiquidity / teaSupply
      // External LP collateral = totalLpCollateral * (1 - POL%)
      const externalLpRatio = Math.max(0, (teaSupply - lockedLiquidity) / teaSupply);
      vaultCollateral = totalLpCollateral * externalLpRatio;
    } else if (totalLpCollateral > 0) {
      // If TEA supply is 0 but there's LP collateral, all of it is POL
      vaultCollateral = 0;
    }

    if (vaultCollateral === 0) {
      return 0; // No external LP collateral, can't calculate APY
    }

    // Check if the vault uses SIR as collateral (compare addresses case-insensitively)
    if (
      vault.collateralToken.id.toLowerCase() ===
      SirContract.address.toLowerCase()
    ) {
      // For SIR collateral vaults, no price conversion needed
      // APY is simply: (annual SIR rewards / external LP SIR collateral) * 100
      const apy = (annualSirRewards / vaultCollateral) * 100;
      return apy;
    }

    // For non-SIR collateral vaults, need price conversion
    if (sirPriceInWrappedNativeToken === 0) {
      return 0;
    }

    // Convert SIR price to vault's collateral token using cached prices
    let sirPriceInCollateral =
      convertWrappedNativeTokenPriceToCollateralCached(
        sirPriceInWrappedNativeToken,
        vault.collateralToken.id,
        tokenPrices,
      );

    // If conversion failed (token not in price cache), try Uniswap fallback
    if (sirPriceInCollateral === 0) {
      try {
        const { getMostLiquidPoolPrice } = await import("./quote");
        // Try to get direct pool price between collateral and wrapped native token
        const poolData = await getMostLiquidPoolPrice({
          tokenA: vault.collateralToken.id,
          tokenB: WethContract.address,
          decimalsA: vault.collateralToken.decimals,
          decimalsB: 18,
        });

        if (poolData.price > 0) {
          // poolData.price is collateral/WETH
          // Get WETH USD price from cache
          const wethUsdPrice = tokenPrices.get(WethContract.address.toLowerCase());

          if (wethUsdPrice && wethUsdPrice > 0) {
            // Convert: SIR -> WETH -> USD -> Collateral
            const sirUsdPrice = sirPriceInWrappedNativeToken * wethUsdPrice;
            const collateralUsdPrice = poolData.price * wethUsdPrice;
            sirPriceInCollateral = sirUsdPrice / collateralUsdPrice;
          }
        }
      } catch (fallbackError) {
        // Silently fail - no pool exists for this token pair
      }
    }

    if (sirPriceInCollateral === 0) {
      return 0;
    }

    // Calculate annual SIR rewards value in collateral token
    const annualRewardsValue = annualSirRewards * sirPriceInCollateral;

    // Calculate APY as percentage: (annual rewards value / collateral) * 100
    const apy = (annualRewardsValue / vaultCollateral) * 100;

    return apy;
  } catch (error) {
    console.error(
      "Error calculating SIR rewards APY with cached prices:",
      error,
    );
    return 0;
  }
}

/**
 * Convert wrapped native token price to collateral token price using cached price data
 */
function convertWrappedNativeTokenPriceToCollateralCached(
  wrappedNativeTokenPrice: number,
  collateralTokenAddress: TAddressString,
  tokenPrices: Map<string, number>,
): number {
  try {
    // If collateral is wrapped native token, no conversion needed
    if (
      collateralTokenAddress.toLowerCase() ===
      WethContract.address.toLowerCase()
    ) {
      return wrappedNativeTokenPrice;
    }

    const wrappedNativeTokenUsdPrice = tokenPrices.get(
      WethContract.address.toLowerCase(),
    );
    const collateralUsdPrice = tokenPrices.get(
      collateralTokenAddress.toLowerCase(),
    );

    if (
      !wrappedNativeTokenUsdPrice ||
      !collateralUsdPrice ||
      collateralUsdPrice === 0
    ) {
      return 0;
    }

    // Convert: SIR -> wrapped native token -> USD -> Collateral
    const sirUsdPrice = wrappedNativeTokenPrice * wrappedNativeTokenUsdPrice;
    const sirCollateralPrice = sirUsdPrice / collateralUsdPrice;

    return sirCollateralPrice;
  } catch (error) {
    console.error(
      "Error converting wrapped native token price to collateral with cached data:",
      error,
    );
    return 0;
  }
}

export const vaultRouter = createTRPCRouter({
  getVaults: publicProcedure
    .input(
      z
        .object({
          filterLeverage: z.string().optional(),
          filterDebtToken: z.string().optional(),
          filterCollateralToken: z.string().optional(),
          first: z.number().optional(),
          sortbyVaultId: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      if (input) {
        const {
          filterLeverage,
          filterDebtToken,
          first,
          filterCollateralToken,
          sortbyVaultId,
        } = input;
        const vaults = await executeVaultsQuery({
          filterLeverage,
          filterDebtToken,
          filterCollateralToken,
          first,
          sortbyVaultId,
        });
        return vaults;
      } else {
        const vaults = await executeVaultsQuery({});
        return vaults;
      }
    }),
  getVaultById: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const vaults = await executeVaultsQuery({
        sortbyVaultId: true,
      });

      // Input is decimal string from URL (e.g., "14")
      // Vault IDs in subgraph are hex strings (e.g., "0xe", "0x0e", etc.)
      // Compare numerically to handle both formats
      const inputIdNum = parseInt(input.id, 10); // Parse as decimal
      const vault = vaults.vaults.find((v) => {
        const vaultIdNum = parseInt(v.id); // parseInt auto-detects hex with "0x" prefix
        return vaultIdNum === inputIdNum;
      });

      return vault;
    }),
  getSearchVaults: publicProcedure
    .input(
      z.object({
        filters: ZVaultFilters.optional(),
        search: z.string(),
        type: z.union([z.literal("debt"), z.literal("collateral")]),
      }),
    )
    .query(async ({ input }) => {
      const result = await executeSearchVaultsQuery({
        ...input.filters,
        search: input.search,
        type: input.type,
      });
      return result;
    }),
  getTableVaults: publicProcedure
    .input(
      z
        .object({
          offset: z.number().optional(),
          filters: ZVaultFilters.extend({
            skip: z.number().optional(),
          }).optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const result = await getVaultsForTable(
        input?.offset ?? 0,
        input?.filters,
      );
      return result;
    }),
  getReserve: publicProcedure
    .input(z.object({ vaultId: z.number() }))
    .query(async ({ input }) => {
      const result = await readContract({
        ...AssistantContract,
        args: [[input.vaultId]],
        functionName: "getReserves",
      });
      return result;
    }),
  getDebtTokenMax: publicProcedure
    .input(
      z.object({
        debtToken: ZAddress,
        collateralToken: ZAddress,
        maxCollateralIn: z.string(),
        decimals: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const result = await readContract({
        ...AssistantContract,
        functionName: "quoteCollateralToDebtToken",
        args: [
          input.debtToken as TAddressString,
          input.collateralToken as TAddressString,
          parseUnits(input.maxCollateralIn, input.decimals),
        ],
      });
      return result;
    }),
  getReserves: publicProcedure
    .input(z.object({ vaultIds: z.array(z.number()).optional() }))
    .query(async ({ input }) => {
      if (!input.vaultIds) return [];
      const result = await readContract({
        ...AssistantContract,
        args: [input.vaultIds],
        functionName: "getReserves",
      });
      return result;
    }),
  getVaultExists: publicProcedure
    .input(
      z.object({
        debtToken: z.string().startsWith("0x"),
        collateralToken: z.string().startsWith("0x"),
        leverageTier: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const result = await readContract({
        ...AssistantContract,
        functionName: "getVaultStatus",
        args: [
          {
            debtToken: input.debtToken as TAddressString,
            collateralToken: input.collateralToken as TAddressString,
            leverageTier: input.leverageTier,
          },
        ],
      });
      return result;
    }),
  getApeParams: publicProcedure
    .input(z.object({ address: z.string().startsWith("0x") }))
    .query(async ({ input }) => {
      const result = await multicall({
        contracts: [
          {
            ...ApeContract,
            address: input.address as TAddressString,
            functionName: "leverageTier",
          },
          {
            ...ApeContract,
            address: input.address as TAddressString,
            functionName: "debtToken",
          },
          {
            ...ApeContract,
            address: input.address as TAddressString,
            functionName: "collateralToken",
          },
        ],
      });

      return {
        leverageTier: result[0].result,
        debtToken: result[1].result,
        collateralToken: result[2].result,
      };
    }),
  getTotalCollateralFeesInVault: publicProcedure
    .input(z.array(z.string().startsWith("0x").length(42)))
    .query(async ({ input }) => {
      const totalReservesResult = await multicall({
        contracts: input.map((address) => ({
          ...VaultContract,
          functionName: "totalReserves",
          args: [address],
        })),
      });

      const balanceResult = await multicall({
        contracts: input.map((address) => ({
          abi: erc20Abi,
          address: address as Address,
          functionName: "balanceOf",
          args: [VaultContract.address],
        })),
      });

      const tokenWithFeesMap = new Map<string, bigint>();
      input.forEach((token, index) => {
        const balance = BigInt(balanceResult[index]?.result ?? 0);
        const reserve = BigInt(
          (totalReservesResult[index]?.result as unknown as
            | bigint
            | undefined) ?? 0,
        );
        const fees = balance - reserve;
        if (fees > BigInt(0)) tokenWithFeesMap.set(token, fees);
      });

      return tokenWithFeesMap;
    }),

  quoteBurn: publicProcedure
    .input(
      z.object({
        debtToken: z.string().startsWith("0x"),
        collateralToken: z.string().startsWith("0x"),
        leverageTier: z.number(),
        amount: z.string(),
        isApe: z.boolean(),
        decimals: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const result = await readContract({
        ...AssistantContract,
        functionName: "quoteBurn",
        args: [
          input.isApe,
          {
            debtToken: input.debtToken as TAddressString,
            collateralToken: input.collateralToken as TAddressString,
            leverageTier: input.leverageTier,
          },
          parseUnits(input.amount, input.decimals),
        ],
      });

      return result;
    }),
  quoteMint: publicProcedure
    .input(
      z.object({
        debtToken: z.string().startsWith("0x").optional(),
        collateralToken: z.string().startsWith("0x").optional(),
        usingDebtToken: z.boolean(),
        leverageTier: z.number().optional(),
        amount: z.string().optional(),
        decimals: z.number(),
        isApe: z.boolean(),
      }),
    )
    .query(async ({ input }) => {
      if (
        !input.collateralToken ||
        !input.debtToken ||
        input.leverageTier === undefined ||
        input.amount === undefined
      ) {
        return;
      }

      if (input.usingDebtToken) {
        const quote = await readContract({
          abi: AssistantContract.abi,
          address: AssistantContract.address,
          functionName: "quoteMintWithDebtToken",
          args: [
            input.isApe,
            {
              debtToken: input.debtToken as TAddressString,
              collateralToken: input.collateralToken as TAddressString,
              leverageTier: input.leverageTier,
            },
            parseUnits(input.amount, input.decimals),
          ],
        });
        return quote;
      } else {
        const quote = await readContract({
          abi: AssistantContract.abi,
          address: AssistantContract.address,
          functionName: "quoteMint",
          args: [
            input.isApe,
            {
              debtToken: input.debtToken as TAddressString,
              collateralToken: input.collateralToken as TAddressString,
              leverageTier: input.leverageTier,
            },
            parseUnits(input.amount, input.decimals),
          ],
        });
        return [quote, 0n];
      }
    }),

  getVaultApy: publicProcedure
    .input(
      z.object({
        vaultId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { vaultId } = input;

      // Calculate timestamp for 1 month ago (30 days * 24 hours * 60 minutes * 60 seconds)
      const oneMonthAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;

      try {
        // Get fees APY
        const feesData = await executeGetVaultFees({
          vaultId,
          timestampThreshold: oneMonthAgo.toString(),
        });

        // Multiply all lpApy values from the past month
        const totalLpApy = feesData.fees.reduce((prod, fee) => {
          return prod * (1 + parseFloat(fee.lpApy));
        }, 1);

        // Convert to annualized percentage
        const feesApy = (totalLpApy ** (365 / 30) - 1) * 100;

        // Get SIR rewards APY
        const sirRewardsApy = await calculateSirRewardsApy(vaultId);

        // Total APY is the sum of fees APY and SIR rewards APY
        const totalApy = feesApy + sirRewardsApy;

        return {
          apy: totalApy,
          feesApy: feesApy,
          sirRewardsApy: sirRewardsApy,
          feesCount: feesData.fees.length,
        };
      } catch (error) {
        console.error("Error fetching vault APY:", error);
        return {
          apy: 0,
          feesApy: 0,
          sirRewardsApy: 0,
          feesCount: 0,
        };
      }
    }),

  // Optimized endpoint to get APY for multiple vaults with shared price data
  getVaultsApy: publicProcedure
    .input(
      z.object({
        vaultIds: z.array(z.string()),
      }),
    )
    .query(async ({ input }) => {
      const { vaultIds } = input;

      if (vaultIds.length === 0) {
        return {};
      }

      // Calculate timestamp for 1 month ago
      const oneMonthAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;

      try {
        // Fetch all vault data once
        const vaults = await executeVaultsQuery({});
        const vaultMap = new Map(vaults.vaults.map((v) => [v.id, v]));

        // Get SIR price in wrapped native token once (shared across all vaults, cached)
        // If it fails (e.g., no pool on HyperEVM), we'll still calculate fees APY
        let sirPriceInWrappedNativeToken = 0;
        try {
          sirPriceInWrappedNativeToken = await getCachedSirPrice();
        } catch (error) {
          sirPriceInWrappedNativeToken = 0;
        }

        // Get unique collateral tokens to batch price conversions
        const uniqueCollateralTokens = new Set(
          vaultIds
            .map((id) => vaultMap.get(id)?.collateralToken.id)
            .filter(Boolean),
        );

        // Batch fetch all token prices from Alchemy
        const tokenPrices = await batchGetTokenPrices([
          ...uniqueCollateralTokens,
        ] as TAddressString[]);

        // Process each vault
        const results: Record<
          string,
          {
            apy: number;
            feesApy: number;
            sirRewardsApy: number;
            feesCount: number;
          }
        > = {};

        await Promise.all(
          vaultIds.map(async (vaultId) => {
            try {
              const vault = vaultMap.get(vaultId);
              if (!vault) {
                results[vaultId] = {
                  apy: 0,
                  feesApy: 0,
                  sirRewardsApy: 0,
                  feesCount: 0,
                };
                return;
              }

              // Get fees APY
              const feesData = await executeGetVaultFees({
                vaultId,
                timestampThreshold: oneMonthAgo.toString(),
              });

              const totalLpApy = feesData.fees.reduce((prod, fee) => {
                return prod * (1 + parseFloat(fee.lpApy));
              }, 1);

              const feesApy = (totalLpApy ** (365 / 30) - 1) * 100;

              // Calculate SIR rewards APY using cached prices
              const sirRewardsApy =
                await calculateSirRewardsApyWithCachedPrices(
                  vault,
                  sirPriceInWrappedNativeToken,
                  tokenPrices,
                );

              const totalApy = feesApy + sirRewardsApy;

              results[vaultId] = {
                apy: totalApy,
                feesApy: feesApy,
                sirRewardsApy: sirRewardsApy,
                feesCount: feesData.fees.length,
              };
            } catch (error) {
              console.error(
                `Error calculating APY for vault ${vaultId}:`,
                error,
              );
              results[vaultId] = {
                apy: 0,
                feesApy: 0,
                sirRewardsApy: 0,
                feesCount: 0,
              };
            }
          }),
        );

        return results;
      } catch (error) {
        console.error("Error fetching vaults APY:", error);
        return Object.fromEntries(
          vaultIds.map((id) => [
            id,
            { apy: 0, feesApy: 0, sirRewardsApy: 0, feesCount: 0 },
          ]),
        );
      }
    }),
});

// FOR TESTING
// const vault: VaultFieldsFragment = {
//   vaultId: "1",
//   debtToken: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
//   collateralToken: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
//   leverageTier: 1,
//   debtSymbol: "test1",
//   collateralSymbol: "test2",
// };
// const vault2 = { ...vault, debtSymbol: "test3", collateralSymbol: "test4" };
// const vaults: TVaults = { vaults: { vaults: [vault] } };
// for (let i = 0; i < 11; i++) {
//   vaults.vaults.vaults.push(vault);
// }
// for (let i = 0; i < 11; i++) {
//   vaults.vaults.vaults.push(vault2);
// }
