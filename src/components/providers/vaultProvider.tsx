"use client";
import useVaultFilterStore from "@/lib/store";
import type { TVaults, VaultFieldFragment } from "@/lib/types";
import { api } from "@/trpc/react";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface VaultProviderType {
  vaults: TVaults | undefined;
  isFetching: boolean;
  nextPage: () => void;
  prevPage: () => void;
  vaultLength: number;
  page: number;
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
  // used for pagination
  const [page, setPage] = useState(1);
  const [lastId, setLastId] = useState("");
  const [pageIds, setPageIds] = useState<Record<string, string>>({});
  const filterCollateralToken = useVaultFilterStore(
    (state) => state.long,
  ).split(",")[0];
  const filterDebtToken = useVaultFilterStore((state) => state.versus).split(
    ",",
  )[0];
  console.log(lastId);
  const filterLeverage = useVaultFilterStore((state) => state.leverageTier);

  useEffect(() => {
    setPage(1);
    setLastId("");
  }, [filterLeverage, filterDebtToken, filterCollateralToken]);
  const { data, isFetching } = api.vault.getTableVaults.useQuery(
    {
      filters: {
        filterLeverage,
        filterDebtToken,
        filterCollateralToken,
        filterLastId: lastId,
      },
    },
    {
      staleTime: 1000 * 60,
    },
  );
  const nextPage = () => {
    const length = data?.vaultQuery?.vaults.length;
    const vaults = data?.vaultQuery?.vaults;

    if (length === 8 && vaults) {
      console.log("made it here");
      console.log(vaults[length - 1]);

      if (vaults?.[length - 1]?.id) {
        setLastId(vaults[length - 1]?.id ?? "0");
        setPageIds((ids) => ({ ...ids, [page.toString()]: lastId }));
        setPage((page) => page + 1);
      }
    }
  };
  const prevPage = () => {
    if (page > 1) {
      const id = pageIds[page - 1];

      if (id) {
        setLastId(id);
        setPage(page - 1);
      }
      if (page - 1 === 1) {
        setLastId("");
        setPage(1);
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
