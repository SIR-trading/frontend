"use client";
import React, { useEffect, useState, useMemo } from "react";
import { VaultTableRow } from "./vaultTableRow";
import ToolTip from "@/components/ui/tooltip";
import { useVaultProvider } from "@/components/providers/vaultProvider";
import VaultRowSkeleton from "./vaultRowSkeleton";
import Show from "@/components/shared/show";
import { api } from "@/trpc/react";
import { getSirSymbol } from "@/lib/assets";
import { ChevronUp, ChevronDown } from "lucide-react";

type SortColumn = "id" | "tvl" | "apy" | "pol";
type SortDirection = "asc" | "desc";

export default function VaultTable({ isApe }: { isApe: boolean }) {
  const [hasMounted, setHasMounted] = useState(false);
  const [showTvlInUsd, setShowTvlInUsd] = useState(true); // Default to USD
  const [sortColumn, setSortColumn] = useState<SortColumn>("tvl");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Ensure component has mounted before accessing window or making queries
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const { vaults, isFetching, page } = useVaultProvider();

  // Handle column header click for sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      // New column: default to desc for tvl/apy/pol, asc for id
      setSortColumn(column);
      setSortDirection(column === "id" ? "asc" : "desc");
    }
  };

  // Get all vaults for sorting
  const allVaults = useMemo(() => vaults?.vaults ?? [], [vaults?.vaults]);

  // Extract ALL vault IDs for batch APY query (needed for APY sorting)
  const allVaultIds = useMemo(() => {
    return allVaults.map((vault) => vault.id);
  }, [allVaults]);

  // Batch fetch APY data for ALL vaults (only for liquidity page and after mount)
  const { data: batchApyData, isLoading: isBatchApyLoading } =
    api.vault.getVaultsApy.useQuery(
      { vaultIds: allVaultIds },
      {
        enabled: hasMounted && !isApe && allVaultIds.length > 0,
        refetchOnMount: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    );

  // Sort all vaults, then paginate
  const sortedVaults = useMemo(() => {
    const vaultsToSort = [...allVaults];

    vaultsToSort.sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case "id":
          comparison = parseInt(a.id) - parseInt(b.id);
          break;
        case "tvl":
          comparison =
            parseFloat(a.totalValueUsd || "0") -
            parseFloat(b.totalValueUsd || "0");
          break;
        case "pol": {
          // POL percentage: lockedLiquidity / teaSupply
          // Special case: if totalValue > 0 but teaSupply === 0, POL is 100%
          const aTeaSupply = parseFloat(a.teaSupply || "0");
          const bTeaSupply = parseFloat(b.teaSupply || "0");
          const aTotalValue = parseFloat(a.totalValue || "0");
          const bTotalValue = parseFloat(b.totalValue || "0");
          const aLocked = parseFloat(a.lockedLiquidity || "0");
          const bLocked = parseFloat(b.lockedLiquidity || "0");

          let aPol = 0;
          if (aTotalValue > 0 && aTeaSupply === 0) {
            aPol = 100;
          } else if (aLocked > 0 && aTeaSupply > 0) {
            aPol = (aLocked / aTeaSupply) * 100;
          }

          let bPol = 0;
          if (bTotalValue > 0 && bTeaSupply === 0) {
            bPol = 100;
          } else if (bLocked > 0 && bTeaSupply > 0) {
            bPol = (bLocked / bTeaSupply) * 100;
          }

          comparison = aPol - bPol;
          break;
        }
        case "apy": {
          // Use APY data if available, otherwise treat as 0
          const aApy = batchApyData?.[a.id]?.apy ?? 0;
          const bApy = batchApyData?.[b.id]?.apy ?? 0;
          comparison = aApy - bApy;
          break;
        }
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return vaultsToSort;
  }, [allVaults, sortColumn, sortDirection, batchApyData]);

  // Client-side pagination: slice the sorted vaults array based on current page
  const currentPageVaults = useMemo(() => {
    const startIndex = (page - 1) * 10;
    const endIndex = startIndex + 10;
    return sortedVaults.slice(startIndex, endIndex);
  }, [sortedVaults, page]);

  // Extract unique collateral tokens and decimals for batch price query
  const { collateralTokens, decimalsMap } = useMemo(() => {
    const uniqueTokens = new Set<string>();
    const decimals: Record<string, number> = {};

    currentPageVaults.forEach((vault) => {
      const tokenAddress = vault.collateralToken.id;
      uniqueTokens.add(tokenAddress);
      decimals[tokenAddress] = vault.collateralToken.decimals;
    });

    return {
      collateralTokens: Array.from(uniqueTokens),
      decimalsMap: decimals,
    };
  }, [currentPageVaults]);

  // Batch fetch collateral prices for all unique tokens on current page
  const { data: batchPriceData } = api.vault.getBatchCollateralPrices.useQuery(
    { collateralTokens, decimals: decimalsMap },
    {
      enabled: hasMounted && collateralTokens.length > 0,
      refetchOnMount: false,
      staleTime: 60 * 1000, // 1 minute
    },
  );

  // Show loading state until component has mounted
  if (!hasMounted) {
    return (
      <table className="w-full">
        <caption className="pb-6 text-left text-[20px] font-semibold leading-[24px]">
          Popular Vaults
        </caption>
        <thead>
          <VaultTableRowHeaders
            isApe={isApe}
            showTvlInUsd={showTvlInUsd}
            setShowTvlInUsd={setShowTvlInUsd}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        </thead>
        <tbody>
          <VaultRowSkeleton />
          <VaultRowSkeleton />
          <VaultRowSkeleton />
          <VaultRowSkeleton />
          <VaultRowSkeleton />
        </tbody>
      </table>
    );
  }

  return (
    <table className="w-full">
      <caption className="pb-6 text-left text-[20px] font-semibold leading-[24px]">
        Popular Vaults
      </caption>

      <thead>
        <VaultTableRowHeaders
          isApe={isApe}
          showTvlInUsd={showTvlInUsd}
          setShowTvlInUsd={setShowTvlInUsd}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      </thead>

      <tbody>
        <Show
          when={!isFetching && !!vaults}
          fallback={
            <>
              <VaultRowSkeleton />
              <VaultRowSkeleton />
              <VaultRowSkeleton />
              <VaultRowSkeleton />
              <VaultRowSkeleton />
              <VaultRowSkeleton />
              <VaultRowSkeleton />
              <VaultRowSkeleton />
            </>
          }
        >
          {currentPageVaults.map((pool, ind) => {
            // Calculate the correct row number based on current page
            const rowNumber = (page - 1) * 10 + ind + 1;
            return (
              <VaultTableRow
                key={pool.id}
                pool={pool}
                number={rowNumber.toString()}
                badgeVariant={{
                  variant: ind % 2 === 0 ? "yellow" : "default",
                }}
                isApe={isApe}
                apyData={batchApyData?.[pool.id]}
                isApyLoading={isBatchApyLoading}
                showTvlInUsd={showTvlInUsd}
                collateralUsdPrice={
                  batchPriceData?.[pool.collateralToken.id.toLowerCase()]
                }
              />
            );
          })}
        </Show>
      </tbody>
    </table>
  );
}

// Sortable header component
function SortableHeader({
  column,
  label,
  currentColumn,
  direction,
  onSort,
  children,
  className,
}: {
  column: SortColumn;
  label: string;
  currentColumn: SortColumn;
  direction: SortDirection;
  onSort: (column: SortColumn) => void;
  children?: React.ReactNode;
  className?: string;
}) {
  const isActive = currentColumn === column;

  return (
    <button
      onClick={() => onSort(column)}
      className={`flex cursor-pointer items-center gap-x-1 transition-colors hover:text-foreground ${className ?? ""}`}
    >
      <span>{label}</span>
      {children}
      <span className="flex flex-col">
        <ChevronUp
          className={`-mb-1 h-3 w-3 ${isActive && direction === "asc" ? "text-foreground" : "text-muted-foreground/40"}`}
        />
        <ChevronDown
          className={`h-3 w-3 ${isActive && direction === "desc" ? "text-foreground" : "text-muted-foreground/40"}`}
        />
      </span>
    </button>
  );
}

function VaultTableRowHeaders({
  isApe,
  showTvlInUsd,
  setShowTvlInUsd,
  sortColumn,
  sortDirection,
  onSort,
}: {
  isApe: boolean;
  showTvlInUsd: boolean;
  setShowTvlInUsd: (value: boolean) => void;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
}) {
  return (
    <tr className="text-left text-[14px] font-normal text-muted-foreground">
      <th className="pb-1 pl-3 pr-4 font-medium">
        <SortableHeader
          column="id"
          label="Id"
          currentColumn={sortColumn}
          direction={sortDirection}
          onSort={onSort}
        />
      </th>
      <th className="pb-1 pr-4 font-medium">Vault</th>

      {!isApe ? (
        <th className="pb-1 pr-4 font-medium">
          <SortableHeader
            column="apy"
            label="APY"
            currentColumn={sortColumn}
            direction={sortDirection}
            onSort={onSort}
          >
            <ToolTip iconSize={12}>
              Annualized Percentage Yield including LP fees from the last 30
              days and {getSirSymbol()} token rewards.
            </ToolTip>
          </SortableHeader>
        </th>
      ) : (
        <th className="pb-1 pr-4 font-medium">
          <div className="flex items-center gap-x-1">
            <span>Fee</span>
            <ToolTip iconSize={12} size="300">
              <div className="space-y-2">
                <div>
                  <span className="font-medium">One-time fee</span> — no funding
                  rates, no liquidations.
                </div>
                <div>
                  SIR combines leverage tokens with option-like pricing: convex
                  returns without volatility decay.*
                </div>
                <div className="text-[10px] italic opacity-60">
                  *Volatility decay ay occur in saturation (low liquidity)
                </div>
              </div>
            </ToolTip>
          </div>
        </th>
      )}
      <th className="hidden pb-1 pr-4 font-medium min-[375px]:table-cell">
        <SortableHeader
          column="pol"
          label="POL"
          currentColumn={sortColumn}
          direction={sortDirection}
          onSort={onSort}
        >
          <ToolTip iconSize={12}>
            Protocol Owned Liquidity is liquidity that will never be withdrawn.
          </ToolTip>
        </SortableHeader>
      </th>
      <th className="hidden pb-1 pr-4 font-medium xl:table-cell">
        <div className="flex items-center gap-x-1">
          <span>Leverage</span>
          <ToolTip iconSize={12}>
            SIR&apos;s returns increase as (price change)<sup>leverage</sup>.
          </ToolTip>
        </div>
      </th>
      <th className="pb-1 text-right font-medium">
        <div className="flex items-center justify-end gap-1">
          <SortableHeader
            column="tvl"
            label="TVL"
            currentColumn={sortColumn}
            direction={sortDirection}
            onSort={onSort}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTvlInUsd(!showTvlInUsd);
              }}
              className="cursor-pointer rounded p-0.5 transition-colors hover:text-foreground dark:hover:bg-primary/20"
              title={
                showTvlInUsd
                  ? "Click to show in tokens"
                  : "Click to show in USD"
              }
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
            </button>
          </SortableHeader>
        </div>
      </th>
    </tr>
  );
}
