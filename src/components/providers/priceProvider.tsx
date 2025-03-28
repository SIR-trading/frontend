"use client";
import type { ZTokenPricesSchema } from "@/lib/schemas";
import { api } from "@/trpc/react";
import React, { createContext, useContext, useEffect, useState } from "react";
import type { z } from "zod";
export type TPrice = {
  address: string,
  price: string
}
export type TPriceList = TPrice[]

export interface PriceProviderType {
  prices: TPriceList | undefined;
  isFetching: boolean;
}

const PriceContext = createContext<PriceProviderType | undefined>(undefined);
interface Props {
  tokens: string[];
  children: React.ReactNode;
}

export const PriceProvider = ({ children, tokens }: Props) => {
  console.log("TOKEN_LIST________", tokens);
  const { data, isFetching } = api.price.getTokenListPrices.useQuery(
    {
      chain: 'eth-mainnet',
      contractAddressList: tokens
    },
    {
      staleTime: 3000
    }
  );

  const formattedPrices = data ? formatPrices(data) : undefined;

  console.log(formattedPrices);
  return (
    <PriceContext.Provider
      value={{
        prices: formattedPrices,
        isFetching,
      }}
    >
      {children}
    </PriceContext.Provider>
  );
};

// Custom hook to use the context
export const usePriceProvider = () => {
  const context = useContext(PriceContext);
  if (!context) {
    throw new Error("useVaultProvider must be used within a MyProvider");
  }
  return context;
};

function formatPrices(response: z.infer<typeof ZTokenPricesSchema>): TPriceList {
  return response.data.map(token => {
    const price = token.prices[0]?.value ?? '0';
    return { address: token.address, price };
  });
}
