"use client";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import React, { createContext, useContext, useMemo } from "react";
import { getSirTokenMetadata } from "@/lib/assets";
interface TokenlistContextType {
  tokenlist: TToken[] | undefined;
  tokenMap: Map<string, TToken> | undefined; // Optimized O(1) lookup by address
}

const TokenlistContext = createContext<TokenlistContextType>({
  tokenlist: [],
  tokenMap: undefined,
});

export function TokenlistContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Load token list from assets.json - fail if not available
  const { data } = useQuery({
    queryKey: ["tokenlist"],
    queryFn: async () => {
      const response = await fetch('/assets.json');

      if (!response.ok) {
        throw new Error('Token list not found. Run "pnpm run fetch:tokens" to generate token list.');
      }

      const tokens = await response.json() as unknown;
      return tokenListSchema.parse(tokens);
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    retry: false, // Don't retry on failure - fail immediately
  });

  // Add SIR token dynamically to the tokenlist and create optimized Map for O(1) lookups
  const { enhancedTokenlist, tokenMap } = useMemo(() => {
    if (!data) {
      return { enhancedTokenlist: undefined, tokenMap: undefined };
    }

    const sirToken = getSirTokenMetadata();

    // Check if SIR token is already in the list (shouldn't be after our change)
    const hasSirToken = data.some(
      (token) => token.address.toLowerCase() === sirToken.address.toLowerCase()
    );

    // Add SIR token if not present
    const tokenlist = !hasSirToken ? [sirToken, ...data] : data; // Put SIR first for prominence in search

    // Create Map for O(1) address lookups (performance optimization)
    const map = new Map<string, TToken>();
    tokenlist.forEach((token) => {
      map.set(token.address.toLowerCase(), token);
    });

    return { enhancedTokenlist: tokenlist, tokenMap: map };
  }, [data]);

  return (
    <TokenlistContext.Provider value={{ tokenlist: enhancedTokenlist, tokenMap }}>
      {children}
    </TokenlistContext.Provider>
  );
}

export function useTokenlistContext() {
  return useContext(TokenlistContext);
}
const tokenSchema = z.object({
  name: z.string(),
  address: z.string(),
  symbol: z.string(),
  decimals: z.number().optional(), // Optional: some tokens don't properly implement decimals()
  chainId: z.number(),
  logoURI: z.string().optional(),
  isNative: z.boolean().optional(), // Flag for native tokens (ETH, HYPE)
  // Market data from CoinGecko (optional)
  marketCap: z.number().optional(),
  currentPrice: z.number().optional(),
  priceChange24h: z.number().optional(),
  volume24h: z.number().optional(),
  rank: z.number().optional(),
  // Legacy extensions field
  extensions: z
    .object({
      bridgeInfo: z
        .record(
          z.string(),
          z.object({
            tokenAddress: z.string(),
          }),
        )
        .optional(),
    })
    .optional(),
});

const tokenListSchema = z.array(tokenSchema);
export type TToken = z.infer<typeof tokenSchema>;
export { tokenSchema, tokenListSchema };
