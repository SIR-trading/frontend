"use client";
import useVaultFilterStore from "@/lib/store";
import type { TVaults, VaultFieldFragment } from "@/lib/types";
import { api } from "@/trpc/react";
import React, { createContext, useContext, useRef } from "react";

interface VaultProviderType {
  vaults: TVaults | undefined;
  isFetching: boolean;
}

const VaultContext = createContext<VaultProviderType | undefined>(undefined);
// Utils function to create an Hashmap for every TVault Index
// Ex. {'1':0, '2':0, ...}
const createNumberObject = (length: number): Record<string, number> => {
  const result: Record<string, number> = {};
  for (let i = 1; i <= length; i++) {
    result[i.toString()] = 0;
  }
  return result;
};
interface Props {
  children: React.ReactNode;
  graphVaults: VaultFieldFragment[];
}

export const VaultProvider = ({ children }: Props) => {
  const filterCollateralToken = useVaultFilterStore(
    (state) => state.long,
  ).split(",")[0];
  const filterDebtToken = useVaultFilterStore((state) => state.versus).split(
    ",",
  )[0];
  const filterLeverage = useVaultFilterStore((state) => state.leverageTier);
  console.log(
    filterCollateralToken,
    filterDebtToken,
    filterLeverage,
    "FILTERS",
  );
  const { data, isFetching } = api.vault.getTableVaults.useQuery({
    filters: {
      filterLeverage,
      filterDebtToken,
      filterCollateralToken,
    },
  });
  const callIds = useRef({});
  return (
    <VaultContext.Provider value={{ vaults: data?.vaultQuery, isFetching }}>
      {children}
    </VaultContext.Provider>
  );
};

// Custom hook to use the context
export const useVaultProvider = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error("useVaultProvider must be used within a MyProvider");
  }
  return context;
};

// Graph Vaults - Vaults from Subgraph query
// Have a global state with Graph Vaults
// For every page grab reserves
// Have loader on Vaults for reserve amounts
// ** Graph Vaults will remain the same, however, we will grab individual
// Full refresh will get all new Graph Vaults Though
