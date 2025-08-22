import { ApeContract } from "@/contracts/ape";
import { AssistantContract } from "@/contracts/assistant";
import { getVaultsForTable } from "@/lib/getVaults";
import { ZAddress } from "@/lib/schemas";
import type { TAddressString, VaultFieldFragment } from "@/lib/types";
import { multicall, readContract } from "@/lib/viemClient";
import { rpcViemClient } from "@/lib/viemClient";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { executeSearchVaultsQuery } from "@/server/queries/searchVaults";
import { executeVaultsQuery } from "@/server/queries/vaults";
import { executeGetVaultFees } from "@/server/queries/fees";
import type { Address } from "viem";
import { erc20Abi, formatUnits } from "viem";
import { parseUnits } from "viem";
import { z } from "zod";
import { VaultContract } from "@/contracts/vault";
import { UniswapQuoterV2 } from "@/contracts/uniswap-quoterv2";
import { SirContract } from "@/contracts/sir";
import { WethContract } from "@/contracts/weth";

// Extended vault interface that includes the fields from GraphQL that are missing in VaultFieldFragment
interface VaultWithCollateral extends VaultFieldFragment {
  apeCollateral: string;
  teaCollateral: string;
}
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
  
  if (sirPriceCache && (now - sirPriceCache.timestamp) < SIR_PRICE_CACHE_DURATION) {
    return sirPriceCache.price;
  }
  
  const price = await getSirPriceInWeth();
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
    const vault = vaults.vaults.find(v => v.vaultId === vaultId) as VaultWithCollateral | undefined;
    
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
    console.log("Rate per day:", dailyRate);
    
    // Convert to annual rate (seconds in a year = 365 * 24 * 60 * 60)
    const SECONDS_IN_YEAR = 365 * 24 * 60 * 60;
    const annualSirRewards = ratePerSecond * SECONDS_IN_YEAR;
    
    // Get SIR price in WETH from Uniswap (cached)
    const sirPriceInWeth = await getCachedSirPrice();
    console.log("SIR price in WETH:", sirPriceInWeth);
    
    if (sirPriceInWeth === 0) {
      console.warn("Could not fetch SIR price from Uniswap");
      return 0;
    }

    // Convert SIR price to vault's collateral token
    const sirPriceInCollateral = await convertWethPriceToCollateral(
      sirPriceInWeth,
      vault.collateralToken as TAddressString
    );

    if (sirPriceInCollateral === 0) {
      console.warn("Could not convert SIR price to collateral token");
      return 0;
    }

    // Get vault collateral belonging to LPers (teaCollateral) and scale with decimals
    const gentlemenCollateral = parseFloat(vault.teaCollateral) / Math.pow(10, vault.apeDecimals);
    
    if (gentlemenCollateral === 0) {
      return 0; // No collateral, can't calculate APY
    }

    // Calculate annual SIR rewards value in collateral token
    const annualRewardsValue = annualSirRewards * sirPriceInCollateral;

    // Log the calculated values for debugging
    console.log(`Vault ${vaultId} - Annual rewards value:`, annualRewardsValue);
    console.log(`Vault ${vaultId} - TEA Collateral:`, gentlemenCollateral);
    
    // Calculate APY as percentage: (annual rewards value / collateral) * 100
    const apy = (annualRewardsValue / gentlemenCollateral) * 100;
    
    return apy;
  } catch (error) {
    console.error("Error calculating SIR rewards APY:", error);
    return 0;
  }
}

/**
 * Get SIR price in WETH from Uniswap V3
 */
async function getSirPriceInWeth(): Promise<number> {
  try {
    // Quote 1 SIR in WETH using Uniswap V3 Quoter
    const result = await rpcViemClient.simulateContract({
      ...UniswapQuoterV2,
      functionName: "quoteExactInputSingle",
      args: [
        {
          tokenIn: SirContract.address,
          tokenOut: WethContract.address,
          fee: 10000,
          amountIn: parseUnits("1", 12), // 1 SIR (12 decimals)
          sqrtPriceLimitX96: 0n,
        },
      ],
    });

    // Result is [amountOut, sqrtPriceX96, initializedTicksCrossed, gasEstimate]
    const [amountOut] = result.result;
    
    // Convert to number (WETH has 18 decimals)
    return Number(formatUnits(amountOut, 18));
  } catch (error) {
    console.error("Error fetching SIR price from Uniswap:", error);
    return 0;
  }
}

/**
 * Convert WETH price to collateral token price
 */
async function convertWethPriceToCollateral(
  wethPrice: number,
  collateralTokenAddress: TAddressString
): Promise<number> {
  try {
    // If collateral is WETH, no conversion needed
    if (collateralTokenAddress.toLowerCase() === WethContract.address.toLowerCase()) {
      return wethPrice;
    }

    // Get WETH/Collateral price from Alchemy
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
            { network: "eth-mainnet", address: collateralTokenAddress },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Alchemy API error: ${response.status}`);
    }

    const data = await response.json() as {
      data: Array<{
        address: string;
        prices: Array<{ value: string; currency: string }>;
      }>;
    };

    const wethData = data.data.find(
      (token) => token.address.toLowerCase() === WethContract.address.toLowerCase()
    );
    const collateralData = data.data.find(
      (token) => token.address.toLowerCase() === collateralTokenAddress.toLowerCase()
    );

    if (!wethData?.prices[0]?.value || !collateralData?.prices[0]?.value) {
      throw new Error("Price data not available");
    }

    const wethUsdPrice = parseFloat(wethData.prices[0].value);
    const collateralUsdPrice = parseFloat(collateralData.prices[0].value);

    if (collateralUsdPrice === 0) {
      throw new Error("Collateral price is zero");
    }

    console.log(`Eth USD price:`, wethUsdPrice);
    console.log(`Collateral USD price for ${collateralTokenAddress}:`, collateralUsdPrice);

    // Convert: SIR -> WETH -> USD -> Collateral
    const sirUsdPrice = wethPrice * wethUsdPrice;
    const sirCollateralPrice = sirUsdPrice / collateralUsdPrice;

    console.log(`SIR price in ${collateralTokenAddress}:`, sirCollateralPrice);

    return sirCollateralPrice;
  } catch (error) {
    console.error("Error converting WETH price to collateral:", error);
    return 0;
  }
}
/**
 * Batch fetch token prices from Alchemy to avoid redundant API calls
 */
async function batchGetTokenPrices(collateralTokens: TAddressString[]): Promise<Map<string, number>> {
  const priceMap = new Map<string, number>();
  
  if (collateralTokens.length === 0) {
    return priceMap;
  }
  
  try {
    // Add WETH to the list for price conversion
    const tokensToFetch = [WethContract.address, ...collateralTokens];
    
    const response = await fetch(
      `https://api.g.alchemy.com/prices/v1/${process.env.ALCHEMY_BEARER}/tokens/by-address`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          addresses: tokensToFetch.map(addr => ({ network: "eth-mainnet", address: addr })),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Alchemy API error: ${response.status}`);
    }

    const data = await response.json() as {
      data: Array<{
        address: string;
        prices: Array<{ value: string; currency: string }>;
      }>;
    };

    // Store USD prices for all tokens
    data.data.forEach(tokenData => {
      if (tokenData.prices[0]?.value) {
        priceMap.set(tokenData.address.toLowerCase(), parseFloat(tokenData.prices[0].value));
      }
    });

    return priceMap;
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
  sirPriceInWeth: number,
  tokenPrices: Map<string, number>
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
    
    // Get vault collateral belonging to LPers (teaCollateral) and scale with decimals
    const vaultCollateral = parseFloat(vault.teaCollateral) / Math.pow(10, vault.apeDecimals);
    
    if (vaultCollateral === 0) {
      return 0; // No collateral, can't calculate APY
    }

    // Check if the vault uses SIR as collateral (compare addresses case-insensitively)
    if (vault.collateralToken.toLowerCase() === SirContract.address.toLowerCase()) {
      // For SIR collateral vaults, no price conversion needed
      // APY is simply: (annual SIR rewards / SIR collateral) * 100
      // Note: SIR has 12 decimals, so we need to adjust the collateral scaling
      const sirVaultCollateral = parseFloat(vault.teaCollateral) / Math.pow(10, 12);
      const apy = (annualSirRewards / sirVaultCollateral) * 100;
      return apy;
    }

    // For non-SIR collateral vaults, need price conversion
    if (sirPriceInWeth === 0) {
      return 0;
    }

    // Convert SIR price to vault's collateral token using cached prices
    const sirPriceInCollateral = convertWethPriceToCollateralCached(
      sirPriceInWeth,
      vault.collateralToken as TAddressString,
      tokenPrices
    );

    if (sirPriceInCollateral === 0) {
      return 0;
    }

    // Calculate annual SIR rewards value in collateral token
    const annualRewardsValue = annualSirRewards * sirPriceInCollateral;
    
    // Calculate APY as percentage: (annual rewards value / collateral) * 100
    const apy = (annualRewardsValue / vaultCollateral) * 100;
    
    return apy;
  } catch (error) {
    console.error("Error calculating SIR rewards APY with cached prices:", error);
    return 0;
  }
}

/**
 * Convert WETH price to collateral token price using cached price data
 */
function convertWethPriceToCollateralCached(
  wethPrice: number,
  collateralTokenAddress: TAddressString,
  tokenPrices: Map<string, number>
): number {
  try {
    // If collateral is WETH, no conversion needed
    if (collateralTokenAddress.toLowerCase() === WethContract.address.toLowerCase()) {
      return wethPrice;
    }

    const wethUsdPrice = tokenPrices.get(WethContract.address.toLowerCase());
    const collateralUsdPrice = tokenPrices.get(collateralTokenAddress.toLowerCase());

    if (!wethUsdPrice || !collateralUsdPrice || collateralUsdPrice === 0) {
      console.warn(`Missing price data for ${collateralTokenAddress}`);
      return 0;
    }

    // Convert: SIR -> WETH -> USD -> Collateral
    const sirUsdPrice = wethPrice * wethUsdPrice;
    const sirCollateralPrice = sirUsdPrice / collateralUsdPrice;

    return sirCollateralPrice;
  } catch (error) {
    console.error("Error converting WETH price to collateral with cached data:", error);
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
      console.log(input, "INPUT");
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
      })
    )
    .query(async ({ input }) => {
      const { vaultId } = input;
      
      // Calculate timestamp for 1 month ago (30 days * 24 hours * 60 minutes * 60 seconds)
      const oneMonthAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
      
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
      })
    )
    .query(async ({ input }) => {
      const { vaultIds } = input;
      
      if (vaultIds.length === 0) {
        return {};
      }
      
      // Calculate timestamp for 1 month ago
      const oneMonthAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
      
      try {
        // Fetch all vault data once
        const vaults = await executeVaultsQuery({});
        const vaultMap = new Map(vaults.vaults.map(v => [v.vaultId, v as VaultWithCollateral]));
        
        // Get SIR price in WETH once (shared across all vaults, cached)
        const sirPriceInWeth = await getCachedSirPrice();
        
        if (sirPriceInWeth === 0) {
          console.warn("Could not fetch SIR price from Uniswap");
          // Return zero APY for all vaults
          return Object.fromEntries(
            vaultIds.map(id => [id, { apy: 0, feesApy: 0, sirRewardsApy: 0, feesCount: 0 }])
          );
        }
        
        // Get unique collateral tokens to batch price conversions
        const uniqueCollateralTokens = new Set(
          vaultIds.map(id => vaultMap.get(id)?.collateralToken).filter(Boolean)
        );
        
        // Batch fetch all token prices from Alchemy
        const tokenPrices = await batchGetTokenPrices([...uniqueCollateralTokens] as TAddressString[]);
        
        // Process each vault
        const results: Record<string, { apy: number; feesApy: number; sirRewardsApy: number; feesCount: number }> = {};
        
        await Promise.all(
          vaultIds.map(async (vaultId) => {
            try {
              const vault = vaultMap.get(vaultId);
              if (!vault) {
                results[vaultId] = { apy: 0, feesApy: 0, sirRewardsApy: 0, feesCount: 0 };
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
              const sirRewardsApy = await calculateSirRewardsApyWithCachedPrices(
                vault,
                sirPriceInWeth,
                tokenPrices
              );
              
              const totalApy = feesApy + sirRewardsApy;
              
              results[vaultId] = {
                apy: totalApy,
                feesApy: feesApy,
                sirRewardsApy: sirRewardsApy,
                feesCount: feesData.fees.length,
              };
            } catch (error) {
              console.error(`Error calculating APY for vault ${vaultId}:`, error);
              results[vaultId] = { apy: 0, feesApy: 0, sirRewardsApy: 0, feesCount: 0 };
            }
          })
        );
        
        return results;
      } catch (error) {
        console.error("Error fetching vaults APY:", error);
        return Object.fromEntries(
          vaultIds.map(id => [id, { apy: 0, feesApy: 0, sirRewardsApy: 0, feesCount: 0 }])
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
