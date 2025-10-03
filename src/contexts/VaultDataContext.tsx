"use client";
import React, { createContext, useContext, type ReactNode, useMemo } from "react";
import { api } from "@/trpc/react";
import type { TVault } from "@/lib/types";

interface VaultDataContextType {
  allVaults: TVault[] | undefined;
  allVaultsLoading: boolean;
  getVaultById: (vaultId: string) => TVault | undefined;
  getVaultsByCollateral: (collateralToken: string) => TVault[];
  getVaultsByDebt: (debtToken: string) => TVault[];
}

const VaultDataContext = createContext<VaultDataContextType | undefined>(undefined);

export function VaultDataProvider({ children }: { children: ReactNode }) {
  // Fetch all vaults once - this replaces the 5 separate calls
  const { data, isLoading: allVaultsLoading } = api.vault.getVaults.useQuery(
    { sortbyVaultId: true, first: 300 }, // Fetch up to 300 vaults (optimized limit)
    {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    }
  );

  // Extract vaults array from the response
  const allVaults = data?.vaults;

  // Memoized helper functions
  const getVaultById = useMemo(() =>
    (vaultId: string) => allVaults?.find((v: TVault) => v.id === vaultId),
    [allVaults]
  );

  const getVaultsByCollateral = useMemo(() =>
    (collateralToken: string) =>
      allVaults?.filter((v: TVault) => v.collateralToken.id.toLowerCase() === collateralToken.toLowerCase()) ?? [],
    [allVaults]
  );

  const getVaultsByDebt = useMemo(() =>
    (debtToken: string) =>
      allVaults?.filter((v: TVault) => v.debtToken.id.toLowerCase() === debtToken.toLowerCase()) ?? [],
    [allVaults]
  );

  const value = useMemo(() => ({
    allVaults,
    allVaultsLoading,
    getVaultById,
    getVaultsByCollateral,
    getVaultsByDebt,
  }), [allVaults, allVaultsLoading, getVaultById, getVaultsByCollateral, getVaultsByDebt]);

  return (
    <VaultDataContext.Provider value={value}>
      {children}
    </VaultDataContext.Provider>
  );
}

export function useVaultData() {
  const context = useContext(VaultDataContext);
  if (context === undefined) {
    throw new Error("useVaultData must be used within a VaultDataProvider");
  }
  return context;
}

// Hook for backward compatibility with components expecting the old format
export function useVaults(filters?: {
  filterDebtToken?: string;
  filterCollateralToken?: string;
  filterLeverage?: string;
}) {
  const { allVaults, allVaultsLoading } = useVaultData();

  const filteredVaults = useMemo(() => {
    if (!allVaults) return undefined;
    if (!filters) return allVaults;

    return allVaults.filter(vault => {
      if (filters.filterDebtToken && vault.debtToken.id !== filters.filterDebtToken) return false;
      if (filters.filterCollateralToken && vault.collateralToken.id !== filters.filterCollateralToken) return false;
      if (filters.filterLeverage && vault.leverageTier !== parseInt(filters.filterLeverage)) return false;
      return true;
    });
  }, [allVaults, filters]);

  return {
    data: filteredVaults,
    isLoading: allVaultsLoading,
  };
}