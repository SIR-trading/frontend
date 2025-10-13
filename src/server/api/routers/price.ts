import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { ZTokenPrices } from "@/lib/schemas";
import { SirContract } from "@/contracts/sir";
import { env } from "@/env";
import { shouldUseCoinGecko, getCoinGeckoPlatformId, getAlchemyChainString } from "@/lib/chains";
import { getWrappedNativeTokenAddress } from "@/config/chains";

// Cache configuration
const CACHE_DURATION = 1 * 60 * 1000; // 1 minute cache for all prices

// Cache for SIR price in USD
let sirPriceUsdCache: { price: number; timestamp: number } | null = null;

// Cache for token prices (Alchemy and CoinGecko)
const tokenPriceCache = new Map<string, { price: number | null; timestamp: number }>();

// Helper function to get cache key
function getCacheKey(type: 'alchemy' | 'coingecko', chain: string, address: string): string {
  return `${type}_${chain}_${address.toLowerCase()}`;
}

export const priceRouter = createTRPCRouter({
  // Get token price from CoinGecko (with caching)
  getCoinGeckoPrice: publicProcedure
    .input(
      z.object({
        platformId: z.string(),
        contractAddress: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { platformId, contractAddress } = input;

      // Check cache first
      const cacheKey = getCacheKey('coingecko', platformId, contractAddress);
      const now = Date.now();
      const cached = tokenPriceCache.get(cacheKey);

      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        return cached.price;
      }

      console.log("getCoinGeckoPrice called with:", {
        platformId,
        contractAddress,
      });

      const headers: HeadersInit = {
        accept: "application/json",
      };

      // Add CoinGecko API key if available
      const apiKey = process.env.COINGECKO_API_KEY;
      if (apiKey) {
        headers["x-cg-demo-api-key"] = apiKey;
      }

      try {
        const url = `https://api.coingecko.com/api/v3/simple/token_price/${platformId}?contract_addresses=${contractAddress.toLowerCase()}&vs_currencies=usd&include_24hr_change=false`;

        const response = await fetch(url, { headers });

        if (!response.ok) {
          console.error(
            `CoinGecko API error: ${response.status} ${response.statusText}`,
          );
          const errorBody = await response.text();
          console.error("Error response body:", errorBody);
          // Cache null response to avoid hammering the API
          tokenPriceCache.set(cacheKey, { price: null, timestamp: Date.now() });
          return null;
        }

        const data = (await response.json()) as Record<
          string,
          { usd?: number }
        >;
        const price = data[contractAddress.toLowerCase()]?.usd ?? null;

        // Cache the result
        tokenPriceCache.set(cacheKey, { price, timestamp: Date.now() });

        return price;
      } catch (error) {
        console.error("Failed to fetch CoinGecko price:", error);
        // Cache null response to avoid hammering the API
        tokenPriceCache.set(cacheKey, { price: null, timestamp: Date.now() });
        return null;
      }
    }),
  // Returns the latest price for vault tokens by symbol
  getVaultPrices: publicProcedure
    .input(
      z.object({
        collateralToken: z.string(),
        debtToken: z.string(),
        chain: z.string().default("eth-mainnet"),
      }),
    )
    .query(async ({ input }) => {
      const { collateralToken, debtToken, chain } = input;

      const options = {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          addresses: [
            { network: chain, address: collateralToken },
            { network: chain, address: debtToken },
          ],
        }),
      };

      const response = await fetch(
        `https://api.g.alchemy.com/prices/v1/${process.env.ALCHEMY_BEARER}/tokens/by-address`,
        options,
      );
      // Parse and validate the fetched JSON using ZVaultPrices
      return ZTokenPrices.parse(await response.json());
    }),

  // Get token price by address (with caching)
  getTokenPrice: publicProcedure
    .input(z.object({ chain: z.string(), contractAddress: z.string() }))
    .query(async ({ input }) => {
      const { chain, contractAddress } = input;

      // Check cache first
      const cacheKey = getCacheKey('alchemy', chain, contractAddress);
      const now = Date.now();
      const cached = tokenPriceCache.get(cacheKey);

      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        // Return cached data in the expected format
        if (cached.price !== null) {
          return {
            data: [{
              address: contractAddress,
              prices: [{ value: cached.price.toString() }]
            }]
          };
        }
        return { data: [] };
      }

      const options = {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          addresses: [{ network: chain, address: contractAddress }],
        }),
      };

      const response = await fetch(
        `https://api.g.alchemy.com/prices/v1/${process.env.ALCHEMY_BEARER}/tokens/by-address`,
        options,
      );

      // Parse and validate the fetched JSON using ZVaultPrices
      const result = ZTokenPrices.parse(await response.json());

      // Cache the price
      const price = result.data?.[0]?.prices?.[0]?.value
        ? Number(result.data[0].prices[0].value)
        : null;
      tokenPriceCache.set(cacheKey, { price, timestamp: Date.now() });

      return result;
    }),

  getTokenPrices: publicProcedure
    .input(
      z.object({
        addresses: z.array(z.string()),
        chain: z.string().default("eth-mainnet"),
      }),
    )
    .query(async ({ input }) => {
      const { addresses, chain } = input;

      const options = {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          addresses: addresses.map((address) => ({ network: chain, address })),
        }),
      };

      const response = await fetch(
        `https://api.g.alchemy.com/prices/v1/${process.env.ALCHEMY_BEARER}/tokens/by-address`,
        options,
      );
      // Parse and validate the fetched JSON using ZTokenPrices
      const result = ZTokenPrices.parse(await response.json());

      // Convert result to the object format {address: result}
      return result.data.reduce(
        (acc, token) => {
          acc[token.address] = token;
          return acc;
        },
        {} as Record<string, (typeof result.data)[0]>,
      );
    }),

  // Get SIR price in USD by reusing existing logic from vault router
  getSirPriceInUsd: publicProcedure.query(async () => {
    try {
      // Check cache first
      const now = Date.now();
      if (sirPriceUsdCache && (now - sirPriceUsdCache.timestamp) < CACHE_DURATION) {
        return sirPriceUsdCache.price;
      }

      // Import the necessary functions from vault router
      const { getMostLiquidPoolPrice } = await import("./quote");

      const chainId = parseInt(env.NEXT_PUBLIC_CHAIN_ID);
      const wrappedTokenAddress = getWrappedNativeTokenAddress(chainId);

      // Get SIR price in wrapped native token (WETH/WHYPE) from Uniswap
      const poolData = await getMostLiquidPoolPrice({
        tokenA: SirContract.address,
        tokenB: wrappedTokenAddress,
        decimalsA: 12, // SIR has 12 decimals
        decimalsB: 18, // WETH/WHYPE have 18 decimals
      });

      const sirPriceInWrappedToken = poolData.price;

      if (sirPriceInWrappedToken === 0) {
        console.warn("Could not fetch SIR price from Uniswap");
        return null;
      }

      // Get wrapped token price in USD
      let wrappedTokenPriceInUsd: number | null = null;

      if (shouldUseCoinGecko(chainId)) {
        // Use CoinGecko for HyperEVM chains (WHYPE price)
        const platformId = getCoinGeckoPlatformId(chainId);

        const headers: HeadersInit = {
          accept: "application/json",
        };

        const apiKey = process.env.COINGECKO_API_KEY;
        if (apiKey) {
          headers["x-cg-demo-api-key"] = apiKey;
        }

        const url = `https://api.coingecko.com/api/v3/simple/token_price/${platformId}?contract_addresses=${wrappedTokenAddress.toLowerCase()}&vs_currencies=usd&include_24hr_change=false`;

        const response = await fetch(url, { headers });

        if (response.ok) {
          const data = (await response.json()) as Record<string, { usd?: number }>;
          wrappedTokenPriceInUsd = data[wrappedTokenAddress.toLowerCase()]?.usd ?? null;
        }
      } else {
        // Use Alchemy for Ethereum chains (WETH price)
        const alchemyChain = getAlchemyChainString(chainId);

        const options = {
          method: "POST",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            addresses: [{ network: alchemyChain, address: wrappedTokenAddress }],
          }),
        };

        const response = await fetch(
          `https://api.g.alchemy.com/prices/v1/${process.env.ALCHEMY_BEARER}/tokens/by-address`,
          options,
        );

        if (response.ok) {
          const result = ZTokenPrices.parse(await response.json());
          wrappedTokenPriceInUsd = result.data?.[0]?.prices?.[0]?.value
            ? Number(result.data[0].prices[0].value)
            : null;
        }
      }

      if (wrappedTokenPriceInUsd === null) {
        console.warn("Could not fetch wrapped token price in USD");
        return null;
      }

      // Calculate SIR price in USD
      const sirPriceInUsd = sirPriceInWrappedToken * wrappedTokenPriceInUsd;

      // Cache the result
      sirPriceUsdCache = { price: sirPriceInUsd, timestamp: Date.now() };

      return sirPriceInUsd;
    } catch (error) {
      console.error("Failed to fetch SIR price in USD:", error);
      return null;
    }
  }),

  // Get token price with Uniswap fallback for exotic tokens
  getTokenPriceWithFallback: publicProcedure
    .input(
      z.object({
        tokenAddress: z.string(),
        tokenDecimals: z.number().default(18),
      }),
    )
    .query(async ({ input }) => {
      const { tokenAddress, tokenDecimals } = input;
      const chainId = parseInt(env.NEXT_PUBLIC_CHAIN_ID);

      console.log(`\n🔍 [getTokenPriceWithFallback] Starting price fetch for ${tokenAddress} (decimals: ${tokenDecimals})`);

      // First try external APIs (Alchemy/CoinGecko)
      const cacheKey = shouldUseCoinGecko(chainId)
        ? getCacheKey('coingecko', getCoinGeckoPlatformId(chainId), tokenAddress)
        : getCacheKey('alchemy', getAlchemyChainString(chainId), tokenAddress);

      const now = Date.now();
      const cached = tokenPriceCache.get(cacheKey);

      if (cached && (now - cached.timestamp) < CACHE_DURATION && cached.price !== null) {
        console.log(`✅ [Cache Hit] Returning cached price: $${cached.price}`);
        return cached.price;
      }

      // Try external API first
      let externalPrice: number | null = null;

      if (shouldUseCoinGecko(chainId)) {
        // Try CoinGecko
        console.log(`🌐 [CoinGecko] Attempting to fetch price...`);
        try {
          const headers: HeadersInit = {
            accept: "application/json",
          };

          if (process.env.COINGECKO_API_KEY) {
            headers["x-cg-demo-api-key"] = process.env.COINGECKO_API_KEY;
          }

          const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/token_price/${getCoinGeckoPlatformId(chainId)}?contract_addresses=${tokenAddress}&vs_currencies=usd`,
            { headers }
          );

          if (response.ok) {
            const data = (await response.json()) as Record<string, { usd?: number }>;
            externalPrice = data[tokenAddress.toLowerCase()]?.usd ?? null;
            console.log(`${externalPrice ? '✅' : '❌'} [CoinGecko] Price: ${externalPrice ? `$${externalPrice}` : 'not found'}`);
          } else {
            console.log(`❌ [CoinGecko] HTTP ${response.status} - ${response.statusText}`);
          }
        } catch (error) {
          console.log(`❌ [CoinGecko] Error:`, error);
          console.log("Will try Uniswap fallback");
        }
      } else {
        // Try Alchemy
        console.log(`🌐 [Alchemy] Attempting to fetch price...`);
        try {
          const options = {
            method: "POST",
            headers: {
              accept: "application/json",
              "content-type": "application/json",
            },
            body: JSON.stringify({
              addresses: [{ network: getAlchemyChainString(chainId), address: tokenAddress }],
            }),
          };

          const response = await fetch(
            `https://api.g.alchemy.com/prices/v1/${process.env.ALCHEMY_BEARER}/tokens/by-address`,
            options,
          );

          if (response.ok) {
            const result = ZTokenPrices.parse(await response.json());
            if (result.data?.[0]?.prices?.[0]?.value) {
              externalPrice = Number(result.data[0].prices[0].value);
            }
            console.log(`${externalPrice ? '✅' : '❌'} [Alchemy] Price: ${externalPrice ? `$${externalPrice}` : 'not found'}`);
          } else {
            console.log(`❌ [Alchemy] HTTP ${response.status} - ${response.statusText}`);
          }
        } catch (error) {
          console.log(`❌ [Alchemy] Error:`, error);
          console.log("Will try Uniswap fallback");
        }
      }

      if (externalPrice !== null) {
        // Cache and return external price
        console.log(`✅ [Final] Returning external API price: $${externalPrice}`);
        tokenPriceCache.set(cacheKey, { price: externalPrice, timestamp: now });
        return externalPrice;
      }

      // Fallback to Uniswap
      console.log(`\n🦄 [Uniswap Fallback] Starting Uniswap pool price lookup...`);
      try {
        const { getMostLiquidPoolPrice } = await import("./quote");
        const wrappedTokenAddress = getWrappedNativeTokenAddress(chainId);
        console.log(`   Wrapped token address: ${wrappedTokenAddress}`);

        // Common stablecoin addresses (mainnet and common test networks)
        const USDC_ADDRESSES: Record<number, string> = {
          1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Mainnet USDC
          11155111: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Sepolia USDC
          998: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff", // HyperEVM mainnet USDC
          999: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff", // HyperEVM testnet USDC (assumed same)
        };

        const usdcAddress = USDC_ADDRESSES[chainId];

        // Try WETH pair first
        let tokenPriceInUsd: number | null = null;

        console.log(`   Trying WETH pair...`);
        try {
          const wethPoolData = await getMostLiquidPoolPrice({
            tokenA: tokenAddress,
            tokenB: wrappedTokenAddress,
            decimalsA: tokenDecimals,
            decimalsB: 18,
          });

          console.log(`   WETH pool data:`, {
            price: wethPoolData.price,
            liquidity: wethPoolData.liquidity.toString(),
            poolAddress: wethPoolData.poolAddress,
            fee: wethPoolData.fee
          });

          if (wethPoolData.price > 0) {
            // Get WETH price in USD
            let wethPriceUsd: number | null = null;

            // Try to get WETH price from external API
            if (shouldUseCoinGecko(chainId)) {
              console.log(`   Fetching WETH price from CoinGecko...`);
              try {
                const response = await fetch(
                  `https://api.coingecko.com/api/v3/simple/token_price/${getCoinGeckoPlatformId(chainId)}?contract_addresses=${wrappedTokenAddress}&vs_currencies=usd`,
                  { headers: process.env.COINGECKO_API_KEY ? { "x-cg-demo-api-key": process.env.COINGECKO_API_KEY } : {} }
                );
                if (response.ok) {
                  const data = (await response.json()) as Record<string, { usd?: number }>;
                  wethPriceUsd = data[wrappedTokenAddress.toLowerCase()]?.usd ?? null;
                  console.log(`   ${wethPriceUsd ? '✅' : '❌'} WETH price from CoinGecko: ${wethPriceUsd ? `$${wethPriceUsd}` : 'not found'}`);
                }
              } catch (error) {
                console.log(`   ❌ Failed to fetch WETH price from CoinGecko:`, error);
              }
            } else {
              // Use hardcoded fallback prices for wrapped tokens if API fails
              wethPriceUsd = chainId === 1 || chainId === 11155111 ? 3000 : 0.001; // Approximate ETH and HYPE prices
              console.log(`   Using hardcoded WETH price: $${wethPriceUsd}`);
            }

            if (wethPriceUsd) {
              tokenPriceInUsd = wethPoolData.price * wethPriceUsd;
              console.log(`   ✅ Calculated token price: ${wethPoolData.price} WETH * $${wethPriceUsd} = $${tokenPriceInUsd}`);
            } else {
              console.log(`   ❌ Could not get WETH price in USD`);
            }
          } else {
            console.log(`   ❌ WETH pool price is 0`);
          }
        } catch (error) {
          console.log(`   ❌ WETH pair lookup failed:`, error);
          console.log("   Trying USDC pair...");
        }

        // If WETH pair didn't work, try USDC pair
        if (!tokenPriceInUsd && usdcAddress) {
          console.log(`   Trying USDC pair... (USDC address: ${usdcAddress})`);
          try {
            const usdcPoolData = await getMostLiquidPoolPrice({
              tokenA: tokenAddress,
              tokenB: usdcAddress,
              decimalsA: tokenDecimals,
              decimalsB: 6, // USDC has 6 decimals
            });

            console.log(`   USDC pool data:`, {
              price: usdcPoolData.price,
              liquidity: usdcPoolData.liquidity.toString(),
              poolAddress: usdcPoolData.poolAddress,
              fee: usdcPoolData.fee
            });

            if (usdcPoolData.price > 0) {
              // USDC price is approximately 1 USD
              tokenPriceInUsd = usdcPoolData.price;
              console.log(`   ✅ Calculated token price from USDC pool: ${usdcPoolData.price} USDC ≈ $${tokenPriceInUsd}`);
            } else {
              console.log(`   ❌ USDC pool price is 0`);
            }
          } catch (error) {
            console.log(`   ❌ USDC pair lookup failed:`, error);
          }
        }

        if (tokenPriceInUsd) {
          // Cache and return Uniswap price
          console.log(`✅ [Final] Returning Uniswap-derived price: $${tokenPriceInUsd}`);
          tokenPriceCache.set(cacheKey, { price: tokenPriceInUsd, timestamp: now });
          return tokenPriceInUsd;
        } else {
          console.log(`❌ [Uniswap Fallback] All pool lookups failed`);
        }
      } catch (error) {
        console.error("❌ [Uniswap Fallback] Fatal error:", error);
      }

      // Cache null result to avoid repeated failed attempts
      console.log(`❌ [Final] All price sources failed - returning null`);
      tokenPriceCache.set(cacheKey, { price: null, timestamp: now });
      return null;
    }),
});
