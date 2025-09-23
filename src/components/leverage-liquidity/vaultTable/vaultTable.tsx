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
  const [pagination, setPagination] = useState(1);
  const [hasMounted, setHasMounted] = useState(false);
  
  // Ensure component has mounted before accessing window or making queries
  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  // Get pagination from URL search params on client side only
  useEffect(() => {
    if (typeof window !== "undefined" && hasMounted) {
      const params = new URLSearchParams(window.location.search);
      const vaultPage = params.get("vault-page");
      if (vaultPage) {
        const x = Number.parseInt(vaultPage);
        if (isFinite(x)) {
          setPagination(x);
        }
      }
    }
  }, [hasMounted]);
  
  const { vaults, isFetching } = useVaultProvider();
  
  // Get current page vaults
  const currentPageVaults = useMemo(() => {
    return vaults?.vaults.slice(pagination * 10 - 10, pagination * 10) ?? [];
  }, [vaults, pagination]);
  
  // Extract vault IDs for batch APY query
  const vaultIds = useMemo(() => {
    return currentPageVaults.map(vault => vault.id);
  }, [currentPageVaults]);
  
  // Batch fetch APY data for all vaults on current page (only for liquidity page and after mount)
  const { data: batchApyData, isLoading: isBatchApyLoading } = api.vault.getVaultsApy.useQuery(
    { vaultIds },
    {
      enabled: hasMounted && !isApe && vaultIds.length > 0, // Only fetch after mount and if we need to show APY
      refetchOnMount: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
  
  // Show loading state until component has mounted
  if (!hasMounted) {
    return (
      <table className="w-full">
        <caption className="pb-6 text-left text-[20px] font-semibold leading-[24px]">
          Popular Vaults
        </caption>
        <tbody className="space-y-2">
          <VaultTableRowHeaders isApe={isApe} />
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

      <tbody className="space-y-2">
        <VaultTableRowHeaders isApe={isApe} />

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
              return (
                <VaultTableRow
                  key={pool.id}
                  pool={pool}
                  number={ind.toString()}
                  badgeVariant={{
                    variant: ind % 2 === 0 ? "yellow" : "default",
                  }}
                  isApe={isApe}
                  apyData={batchApyData?.[pool.id]}
                  isApyLoading={isBatchApyLoading}
                />
              );
            })}
        </Show>
      </tbody>
    </table>
  );
}

function VaultTableRowHeaders({ isApe }: { isApe: boolean }) {
  return (
    <tr className="flex items-center justify-between text-left text-[14px] font-normal text-muted-foreground">
      <th className="font-medium flex-shrink-0 w-12 sm:w-14 pl-3">Id</th>
      <th className="font-medium flex-shrink-0 w-24 min-[650px]:flex-1 min-[650px]:min-w-0 lg:w-24 lg:flex-shrink-0 min-[1130px]:flex-1 lg:max-w-none min-[650px]:max-w-[200px] text-left">
        Vault
      </th>

      {!isApe ? (
        <th className="flex items-center gap-x-1 font-medium pl-2 sm:pl-3 flex-shrink-0 w-16 sm:w-20">
          <span>APY</span>
          <ToolTip iconSize={12}>
            Annualized Percentage Yield including LP fees from the last 30 days and {getSirSymbol()} token rewards.
          </ToolTip>
        </th>
      ) : (
        <th className="flex items-center gap-x-1 font-medium pl-2 sm:pl-3 flex-shrink-0 w-16 sm:w-20">
          <span>Fee</span>
          <ToolTip iconSize={12}>
            One-time APE minting fee. Half distributed to LPers at mint, and half
            at burn.
          </ToolTip>
        </th>
      )}
      <th className="hidden items-center gap-x-1 font-medium min-[450px]:flex flex-shrink-0 w-16 pl-2">
        Pol
        <ToolTip iconSize={12}>
          Protocol Owned Liquidity is liquidity that will never be withdrawn.
        </ToolTip>
      </th>
      <th className="hidden relative z-10 items-center gap-x-1 font-medium xl:flex flex-shrink-0 w-20">
        <span>Leverage</span>
        <ToolTip iconSize={12}>
          SIR&apos;s returns increase as (price change)<sup>leverage</sup>.
        </ToolTip>
      </th>
      <th className="font-medium text-right flex-shrink-0 w-20 min-[450px]:w-28 min-[650px]:w-24 md:w-28 lg:w-24">TVL</th>
    </tr>
  );
}
