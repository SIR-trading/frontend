import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { ZTokenPrices } from "@/lib/schemas";
import { SirContract } from "@/contracts/sir";
import { env } from "@/env";
import { shouldUseCoinGecko, getCoinGeckoPlatformId, getAlchemyChainString } from "@/lib/chains";

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
      const wrappedTokenAddress = env.NEXT_PUBLIC_WRAPPED_TOKEN_ADDRESS;

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
});
