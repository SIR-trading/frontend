"use client";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import React, { createContext, useContext, useMemo } from "react";
import { getSirTokenMetadata } from "@/lib/assets";
interface TokenlistContextType {
  tokenlist: TToken[] | undefined;
}

const TokenlistContext = createContext<TokenlistContextType>({
  tokenlist: [],
});

export function TokenlistContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data } = useQuery({
    queryKey: ["tokenlist"],
    queryFn: async () => {
      const tokensResp = (await fetch("/assets.json").then((r) =>
        r.json(),
      )) as unknown;
      const tokensList = tokenListSchema.parse(tokensResp);
      return tokensList;
    },
  });
  
  // Add SIR token dynamically to the tokenlist
  const enhancedTokenlist = useMemo(() => {
    if (!data) return undefined;
    
    const sirToken = getSirTokenMetadata();
    
    // Check if SIR token is already in the list (shouldn't be after our change)
    const hasSirToken = data.some(
      (token) => token.address.toLowerCase() === sirToken.address.toLowerCase()
    );
    
    // Add SIR token if not present
    if (!hasSirToken) {
      return [sirToken, ...data]; // Put SIR first for prominence in search
    }
    
    return data;
  }, [data]);
  
  return (
    <TokenlistContext.Provider value={{ tokenlist: enhancedTokenlist }}>
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
  decimals: z.number(),
  chainId: z.number(),
  logoURI: z.string(),
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
