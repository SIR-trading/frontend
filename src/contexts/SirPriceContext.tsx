"use client";

import React, { createContext, useContext } from "react";
import { api } from "@/trpc/react";

interface SirPriceContextType {
  sirPrice: number | null | undefined;
  isLoading: boolean;
  error: unknown;
}

const SirPriceContext = createContext<SirPriceContextType | undefined>(undefined);

export function SirPriceProvider({ children }: { children: React.ReactNode }) {
  // Single query for SIR price, shared across all components
  const { data: sirPrice, isLoading, error } = api.price.getSirPriceInUsd.useQuery(
    undefined,
    {
      staleTime: 60000, // 1 minute cache
      refetchInterval: 60000, // Refetch every minute
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnMount: false, // Don't refetch when components mount
    }
  );

  return (
    <SirPriceContext.Provider value={{ sirPrice, isLoading, error }}>
      {children}
    </SirPriceContext.Provider>
  );
}

export function useSirPrice() {
  const context = useContext(SirPriceContext);
  if (context === undefined) {
    throw new Error("useSirPrice must be used within a SirPriceProvider");
  }
  return context;
}