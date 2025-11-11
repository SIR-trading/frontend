"use client";
import React, { useEffect, useState, useMemo } from "react";
import { VaultTableRow } from "./vaultTableRow";
import ToolTip from "@/components/ui/tooltip";
import { useVaultProvider } from "@/components/providers/vaultProvider";
import VaultRowSkeleton from "./vaultRowSkeleton";
import Show from "@/components/shared/show";
import { api } from "@/trpc/react";
import { getSirSymbol } from "@/lib/assets";

export default function VaultTable({ isApe }: { isApe: boolean }) {
  const [hasMounted, setHasMounted] = useState(false);
  const [showTvlInUsd, setShowTvlInUsd] = useState(true); // Default to USD

  // Ensure component has mounted before accessing window or making queries
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const { vaults, isFetching, page } = useVaultProvider();

  // Client-side pagination: slice the vaults array based on current page
  const currentPageVaults = useMemo(() => {
    const allVaults = vaults?.vaults ?? [];
    const startIndex = (page - 1) * 10;
    const endIndex = startIndex + 10;
    return allVaults.slice(startIndex, endIndex);
  }, [vaults, page]);

  // Extract vault IDs for batch APY query
  const vaultIds = useMemo(() => {
    return currentPageVaults.map((vault) => vault.id);
  }, [currentPageVaults]);

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

  // Batch fetch APY data for all vaults on current page (only for liquidity page and after mount)
  const { data: batchApyData, isLoading: isBatchApyLoading } =
    api.vault.getVaultsApy.useQuery(
      { vaultIds },
      {
        enabled: hasMounted && !isApe && vaultIds.length > 0, // Only fetch after mount and if we need to show APY
        refetchOnMount: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
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

function VaultTableRowHeaders({
  isApe,
  showTvlInUsd,
  setShowTvlInUsd,
}: {
  isApe: boolean;
  showTvlInUsd: boolean;
  setShowTvlInUsd: (value: boolean) => void;
}) {
  return (
    <tr className="text-left text-[14px] font-normal text-muted-foreground">
      <th className="pb-1 pl-3 pr-4 font-medium">Id</th>
      <th className="pb-1 pr-4 font-medium">Vault</th>

      {!isApe ? (
        <th className="pb-1 pr-4 font-medium">
          <div className="flex items-center gap-x-1">
            <span>APY</span>
            <ToolTip iconSize={12}>
              Annualized Percentage Yield including LP fees from the last 30
              days and {getSirSymbol()} token rewards.
            </ToolTip>
          </div>
        </th>
      ) : (
        <th className="pb-1 pr-4 font-medium">
          <div className="flex items-center gap-x-1">
            <span>Fee</span>
            <ToolTip iconSize={12}>
              One-time APE minting fee. Half distributed to LPers at mint, and
              half at burn.
            </ToolTip>
          </div>
        </th>
      )}
      <th className="hidden pb-1 pr-4 font-medium min-[375px]:table-cell">
        <div className="flex items-center gap-x-1">
          <span>POL</span>
          <ToolTip iconSize={12}>
            Protocol Owned Liquidity is liquidity that will never be withdrawn.
          </ToolTip>
        </div>
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
          <span>TVL</span>
          <button
            onClick={() => setShowTvlInUsd(!showTvlInUsd)}
            className="cursor-pointer rounded p-0.5 transition-colors hover:text-foreground dark:hover:bg-primary/20"
            title={
              showTvlInUsd ? "Click to show in tokens" : "Click to show in USD"
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
        </div>
      </th>
    </tr>
  );
}
