"use client";
import { ASSET_REPO } from "@/data/constants";
import { env } from "@/env";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import React, { createContext, useContext } from "react";
interface TokenlistContextType {
  tokenlist: TToken[] | undefined;
}

const TokenlistContext = createContext<TokenlistContextType>({
  tokenlist: [],
});

const getChainName = () => {
  const chainId = env.NEXT_PUBLIC_CHAIN_ID;
  if (chainId === "1") {
    return "ethereum";
  }
  if (chainId === "11155111") {
    return "sepolia";
  }
  if (chainId === "17000") {
    return "holesky";
  }
};

// "https://raw.githubusercontent.com/SIR-trading/assets/master";
//https://raw.githubusercontent.com/fusionxx23/assets/refs/heads/master/blockchains/ethereum/assets/0x0000000000085d4780B73119b644AE5ecd22b376/logo.png
export function TokenlistContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data, error, isLoading } = useQuery({
    queryKey: ["tokenlist"],
    queryFn: async () => {
      const tokensResp = (await fetch("/assets.json").then((r) =>
        r.json(),
      )) as unknown;
      const tokensList = tokenListSchema.parse(tokensResp);
      return tokensList;
    },
  });
  console.log(data, error, isLoading, "TOKENS DATA");
  return (
    <TokenlistContext.Provider value={{ tokenlist: data }}>
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
