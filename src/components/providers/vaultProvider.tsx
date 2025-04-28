"use client";
import useVaultFilterStore from "@/lib/store";
import type { TVaults } from "@/lib/types";
import { parseAddress } from "@/lib/utils";
import { api } from "@/trpc/react";
import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import React, { createContext, useContext, useEffect, useState } from "react";

interface VaultProviderType {
  vaults: TVaults | undefined;
  isFetching: boolean;
  nextPage: () => void;
  prevPage: () => void;
  vaultLength: number;
  page: number;
}

const VaultContext = createContext<VaultProviderType | undefined>(undefined);
interface Props {
  children: React.ReactNode;
}

export const VaultProvider = ({ children }: Props) => {
  // used for pagination
  const [page, setPage] = useState(1);
  const filterCollateralToken = parseAddress(
    useVaultFilterStore((state) => state.long),
  );
  const filterDebtToken = parseAddress(
    useVaultFilterStore((state) => state.versus),
  );
  const filterLeverage = useVaultFilterStore((state) => state.leverageTier);
  useEffect(() => {
    setPage(1);
  }, [filterLeverage, filterDebtToken, filterCollateralToken]);
  const [vaultFilters, setFilters] = useState<{
    filterLeverage: string | undefined;
    filterDebtToken: string | undefined;
    filterCollateralToken: string | undefined;
  }>({
    filterCollateralToken: undefined,
    filterDebtToken: undefined,
    filterLeverage: undefined,
  });
  const { data, isLoading: isFetching } = api.vault.getTableVaults.useQuery(
    {
      filters: {
        ...vaultFilters,
        skip: (page - 1) * 10,
      },
    },
    {
      staleTime: 1000 * 60,
    },
  );
  const queryClient = useQueryClient();
  // grab vault from current vaults when all filters are selected
  // and set query data
  useEffect(() => {
    if (
      filterCollateralToken &&
      filterDebtToken &&
      filterLeverage &&
      data?.vaultQuery?.vaults.length !== 1
    ) {
      const found = data?.vaultQuery?.vaults.find((vault) => {
        if (
          vault.leverageTier === parseInt(filterLeverage) &&
          vault.debtToken === filterDebtToken &&
          vault.collateralToken === filterCollateralToken
        ) {
          return true;
        }
      });
      if (found) {
        const queryKey = getQueryKey(
          api.vault.getTableVaults,
          {
            filters: {
              filterLeverage,
              filterDebtToken,
              filterCollateralToken,
              skip: 0, // always is 0 bc setting filter sets 0
            },
          },
          "query",
        );
        console.log({ queryKey });
        queryClient.setQueryData(queryKey, { vaultQuery: { vaults: [found] } });
      }
    }

    setFilters({ filterCollateralToken, filterDebtToken, filterLeverage });
  }, [
    data,
    data?.vaultQuery?.vaults,
    filterCollateralToken,
    filterDebtToken,
    filterLeverage,
    page,
    queryClient,
  ]);
  const nextPage = () => {
    const length = data?.vaultQuery?.vaults.length;
    const vaults = data?.vaultQuery?.vaults;

    if (length === 10 && vaults) {
      if (vaults?.[length - 1]?.id) {
        setPage((page) => page + 1);
      }
    }
  };
  const prevPage = () => {
    if (page > 1) {
      if (page - 1 === 1) {
        setPage(1);
      } else {
        setPage(page - 1);
      }
    }
  };
  return (
    <VaultContext.Provider
      value={{
        nextPage,
        prevPage,
        page,
        vaults: data?.vaultQuery,
        isFetching,
        vaultLength: data?.vaultQuery?.vaults.length ?? 0,
      }}
    >
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
