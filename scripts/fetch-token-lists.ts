#!/usr/bin/env node

/**
 * Fetch token lists during build time
 * Uses CoinGecko for discovery, RPC for on-chain decimals
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { createPublicClient, http, erc20Abi, type Chain } from "viem";
import * as viemChains from "viem/chains";
import buildData from "../public/build-data.json";
import chainsConfig from "../src/config/chains.json";

// Load environment variables from .env and .env.local
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

const apiKey = process.env.COINGECKO_API_KEY;
if (!apiKey) {
  throw new Error(
    "COINGECKO_API_KEY (demo) is required in .env or .env.local file",
  );
}

const RPC_URL = process.env.RPC_URL;
if (!RPC_URL) {
  throw new Error("RPC_URL is required in .env or .env.local file");
}

// Get the selected chain from environment
const rawChainId = process.env.NEXT_PUBLIC_CHAIN_ID;
const selectedChainId = parseInt(rawChainId ?? "");
if (!selectedChainId || isNaN(selectedChainId)) {
  throw new Error("NEXT_PUBLIC_CHAIN_ID is required in .env file");
}

// Type definitions

interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  market_cap: number;
}

interface CoinMarketSlim {
  id: string;
  symbol: string;
  name: string;
  image: string;
  marketCap: number;
}

interface CoinsListItem {
  id: string;
  symbol: string;
  name: string;
  platforms?: Record<string, string>;
}

interface PlatformToken {
  symbol: string;
  name: string;
  marketCap: number;
  address: string;
  decimals?: number;
  chainId: number;
  logoURI: string;
}


// Map chain IDs to viem chain objects
const viemChainMap: Record<number, Chain> = {
  1: viemChains.mainnet,
  11155111: viemChains.sepolia,
  // HyperEVM chains will use custom chain config below
};

/**
 * Make HTTPS request with promise (CoinGecko)
 */
async function httpsRequest<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-cg-demo-api-key": apiKey!,
      Accept: "application/json",
      "User-Agent": "sir-fe",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch one markets page (100 coins) and map to slim shape
 */
async function fetchMarketsPage(page: number): Promise<CoinMarketSlim[]> {
  const url =
    "https://api.coingecko.com/api/v3/coins/markets" +
    `?vs_currency=usd&order=market_cap_desc&per_page=100&page=${page}`;

  const rows = await httpsRequest<CoinMarket[]>(url);
  return rows.map(({ id, symbol, name, image, market_cap }) => ({
    id,
    symbol,
    name,
    image,
    marketCap: market_cap,
  }));
}

/**
 * Fetch the full coins list including platform mappings once.
 * Used to quickly check if a coin exists on the required platform.
 */
async function fetchCoinsListWithPlatforms(): Promise<CoinsListItem[]> {
  const url =
    "https://api.coingecko.com/api/v3/coins/list?include_platform=true";
  return httpsRequest<CoinsListItem[]>(url);
}

/**
 * On-chain: fetch decimals() for a single ERC-20
 */
async function fetchDecimalsForAddress(
  address: string,
  publicClient: ReturnType<typeof createPublicClient>,
): Promise<number | undefined> {
  try {
    const decimals = await publicClient.readContract({
      address: address as `0x${string}`,
      abi: erc20Abi,
      functionName: "decimals",
    });
    return Number(decimals);
  } catch (error) {
    // Log the error for debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(
      `    Warning: Could not fetch decimals for ${address}: ${errorMessage.split("\n")[0]}`,
    );
    return undefined;
  }
}

/**
 * Resolve decimals for a list of addresses in parallel batches
 */
async function fetchDecimalsMap(
  addresses: string[],
  publicClient: ReturnType<typeof createPublicClient>,
): Promise<Map<string, number | undefined>> {
  const map = new Map<string, number | undefined>();
  const BATCH_SIZE = 10; // Process 10 addresses in parallel at a time

  for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
    const batch = addresses.slice(i, i + BATCH_SIZE);

    // Fetch all decimals in this batch in parallel
    const batchResults = await Promise.all(
      batch.map(async (addr) => {
        try {
          const dec = await fetchDecimalsForAddress(addr, publicClient);
          return { addr, dec };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.log(`      Failed: ${addr} - ${msg}`);
          return { addr, dec: undefined };
        }
      }),
    );

    // Store results in map
    for (const { addr, dec } of batchResults) {
      map.set(addr.toLowerCase(), dec);
    }

    // Add delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < addresses.length) {
      await sleep(100); // Shorter delay since we're batching
    }
  }

  return map;
}

/**
 * Load tokens from assetsExtra.json for a specific chain
 */
function loadAssetsExtra(chainId: number): PlatformToken[] {
  try {
    const assetsExtraPath = path.join(
      process.cwd(),
      "private",
      "assetsExtra.json",
    );
    if (fs.existsSync(assetsExtraPath)) {
      const data = fs.readFileSync(assetsExtraPath, "utf-8");
      const tokensByChain = JSON.parse(data) as Record<string, PlatformToken[]>;

      // Get tokens for the specific chain, add chainId if missing
      const tokens = tokensByChain[chainId.toString()] ?? [];
      return tokens.map((token) => ({
        ...token,
        symbol: token.symbol.toUpperCase(),
        chainId: token.chainId ?? chainId,
      }));
    }
  } catch (error) {
    console.log("  Warning: Could not load assetsExtra.json:", error);
  }
  return [];
}

/**
 * Main
 * For testnets: Use only assetsExtra.json
 * For non-testnets: Fetch from CoinGecko and append assetsExtra.json
 */
async function main(): Promise<void> {
  console.log("🚀 Starting token list fetch script...");
  console.log(`Chain ID: ${process.env.NEXT_PUBLIC_CHAIN_ID}`);

  const config = chainsConfig[selectedChainId.toString() as keyof typeof chainsConfig];
  if (!config) throw new Error(`Unsupported chain ID: ${selectedChainId}`);

  let platformTokens: PlatformToken[] = [];

  // For testnets, only use assetsExtra.json
  if (config.isTestnet) {
    console.log(`  Using testnet mode`);
    platformTokens = loadAssetsExtra(config.chainId);
    console.log(
      `  Added ${platformTokens.length} tokens from assetsExtra.json`,
    );
  } else {
    // For non-testnets, fetch from CoinGecko
    const platformId = config.coingecko.platformId;
    if (!platformId) {
      throw new Error(
        "No platformId for selected chain. Provide a platformId or adjust logic for manual list.",
      );
    }

    // Create viem public client for the current chain
    const publicClient = createPublicClient({
      chain: viemChainMap[config.chainId],
      transport: http(RPC_URL),
    });

    const indexed = await fetchCoinsListWithPlatforms();
    const platformMap = new Map<string, string>(); // coinId -> address
    for (const item of indexed) {
      const addr = item.platforms?.[platformId];
      if (addr) platformMap.set(item.id, addr);
    }

    const TARGET = 80;
    const MAX_PAGES = 30;

    for (let page = 1; page <= MAX_PAGES; page++) {
      const pageCoins = await fetchMarketsPage(page);

      // filter to coins present on our platform
      const pageMatches = pageCoins.filter((c) => platformMap.has(c.id));

      if (pageMatches.length > 0) {
        // addresses for this page
        const pageAddresses = pageMatches
          .map((c) => platformMap.get(c.id))
          .filter((a): a is string => Boolean(a));

        // on-chain decimals lookup
        const decimalsByAddr = await fetchDecimalsMap(
          pageAddresses,
          publicClient,
        );

        // merge into tokens
        for (const c of pageMatches) {
          const address = platformMap.get(c.id)!;
          const decimals = decimalsByAddr.get(address.toLowerCase());

          platformTokens.push({
            symbol: c.symbol.toUpperCase(),
            name: c.name,
            marketCap: c.marketCap,
            address,
            decimals,
            chainId: config.chainId,
            logoURI: c.image ?? "",
          });

          if (platformTokens.length >= TARGET) break;
        }
      }

      if (platformTokens.length >= TARGET) {
        break;
      }

      // gentle pacing for CoinGecko calls
      if (page < MAX_PAGES) await sleep(120);
    }

    // For non-testnets, also append tokens from assetsExtra.json
    const extraTokens = loadAssetsExtra(config.chainId);

    // Deduplicate by address - assetsExtra tokens should not overlap with CoinGecko
    const existingAddresses = new Set(
      platformTokens.map((t) => t.address.toLowerCase()),
    );

    const additionalTokens = extraTokens.filter(
      (token) => !existingAddresses.has(token.address.toLowerCase()),
    );

    const coingeckoCount = platformTokens.length;
    platformTokens.push(...additionalTokens);

    console.log(`  Added ${coingeckoCount} tokens from CoinGecko`);
    console.log(
      `  Added ${additionalTokens.length} tokens from assetsExtra.json`,
    );
  }

  // sort by market cap desc before writing
  platformTokens.sort((a, b) => b.marketCap - a.marketCap);

  // Add SIR token and wrapped token at the beginning
  const sirToken: PlatformToken = {
    symbol:
      config.chainId === 999 || config.chainId === 998 ? "HyperSIR" : "SIR",
    name: "Synthetics Implemented Right",
    marketCap: 0, // Will be at the top regardless
    address: buildData.contractAddresses.sir,
    decimals: 12,
    chainId: config.chainId,
    logoURI: "", // Let the app handle SIR logo with its special logic
  };

  // Check if wrapped token is already in platformTokens
  const chainConfig = chainsConfig[config.chainId.toString() as keyof typeof chainsConfig];
  const wrappedTokenAddress = chainConfig?.wrappedNativeToken?.address;
  const isWrappedTokenInList =
    wrappedTokenAddress &&
    platformTokens.some(
      (t) => t.address.toLowerCase() === wrappedTokenAddress.toLowerCase(),
    );

  const wrappedToken: PlatformToken | undefined =
    wrappedTokenAddress && !isWrappedTokenInList && chainConfig
      ? {
          symbol: chainConfig.wrappedNativeToken.symbol,
          name: chainConfig.wrappedNativeToken.name,
          marketCap: 0, // Will be at the top
          address: wrappedTokenAddress,
          decimals: 18,
          chainId: config.chainId,
          logoURI: "", // Let the app handle wrapped token logo from Trust Wallet
        }
      : undefined;

  // Combine tokens: SIR first, then wrapped token, then the rest
  const finalTokens = [
    sirToken,
    ...(wrappedToken ? [wrappedToken] : []),
    ...platformTokens,
  ];

  // Write file
  const outputDir = path.join(process.cwd(), "public");
  const outputFile = path.join(outputDir, "assets.json");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(finalTokens, null, 2));

  console.log(`✅ Asset list generated with ${finalTokens.length} tokens`);
}

// Run the script
main().catch((error: unknown) => {
  const msg = error instanceof Error ? error.message : String(error);
  console.error("✗ Failed to fetch token list:", msg);
  process.exit(1);
});
