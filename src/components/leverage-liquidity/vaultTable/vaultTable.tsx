"use client";
import React, { useEffect, useState, useMemo } from "react";
import { VaultTableRow } from "./vaultTableRow";
import ToolTip from "@/components/ui/tooltip";
import { useVaultProvider } from "@/components/providers/vaultProvider";
import VaultRowSkeleton from "./vaultRowSkeleton";
import Show from "@/components/shared/show";
import { api } from "@/trpc/react";

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
    return currentPageVaults.map(vault => vault.vaultId);
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
                  key={pool.vaultId}
                  pool={pool}
                  number={ind.toString()}
                  badgeVariant={{
                    variant: ind % 2 === 0 ? "yellow" : "default",
                  }}
                  isApe={isApe}
                  apyData={batchApyData?.[pool.vaultId]}
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
    <tr className="grid grid-cols-4 text-left text-[14px] font-normal text-foreground/60 md:grid-cols-9">
      <th className="font-medium">Id</th>
      <th className="font-medium md:col-span-3">Vault</th>

      {!isApe ? (
        <th className="hidden items-center gap-x-1 font-medium md:flex">
          <span>APY</span>
          <ToolTip iconSize={12}>
            Annualized Percentage Yield including LP fees from the last 30 days and SIR token rewards.
          </ToolTip>
        </th>
      ) : (
        <th className="hidden items-center gap-x-1 font-medium md:flex">
          <span>Pol</span>
          <ToolTip iconSize={12}>
            Protocol Owned Liquidity is liquidity that will never be withdrawn.
          </ToolTip>
        </th>
      )}
      <th className="gap hidden items-center gap-x-1 font-medium md:flex">
        Fees
        <ToolTip iconSize={12}>
          One-time APE minting fee. Half distributed to LPers at mint, and half
          at burn.
        </ToolTip>
      </th>
      <th className="relative z-10  flex items-center gap-x-1 font-medium">
        Leverage
        <ToolTip iconSize={12}>
          <div>
            SIR&apos;s returns increase as (price change)<sup>leverage</sup>.
          </div>
        </ToolTip>
      </th>
      <th className="relative  text-right font-medium md:col-span-2">TVL</th>
    </tr>
  );
}
