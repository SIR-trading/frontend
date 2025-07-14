"use client";
import React, { useEffect, useState } from "react";
import { VaultTableRow } from "./vaultTableRow";
import ToolTip from "@/components/ui/tooltip";
import { useVaultProvider } from "@/components/providers/vaultProvider";
import VaultRowSkeleton from "./vaultRowSkeleton";
import Show from "@/components/shared/show";

export default function VaultTable({ isApe }: { isApe: boolean }) {
  const [pagination, setPagination] = useState(1);
  
  // Get pagination from URL search params on client side only
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const vaultPage = params.get("vault-page");
      if (vaultPage) {
        const x = Number.parseInt(vaultPage);
        if (isFinite(x)) {
          setPagination(x);
        }
      }
    }
  }, []);
  
  const { vaults, isFetching } = useVaultProvider();
  
  return (
    <table className="w-full">
      <caption className="pb-6 text-left text-[20px] font-semibold leading-[24px]">
        Popular Vaults
      </caption>

      <tbody className="space-y-2">
        <VaultTableRowHeaders />

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
          {vaults?.vaults
            .slice(pagination * 10 - 10, pagination * 10)
            .map((pool, ind) => {
              return (
                <VaultTableRow
                  key={pool.vaultId}
                  pool={pool}
                  number={ind.toString()}
                  badgeVariant={{
                    variant: ind % 2 === 0 ? "yellow" : "default",
                  }}
                  isApe={isApe}
                />
              );
            })}
        </Show>
      </tbody>
    </table>
  );
}

function VaultTableRowHeaders() {
  return (
    <tr className="grid grid-cols-4 text-left text-[14px] font-normal text-foreground/60 md:grid-cols-9">
      <th className="font-medium">Id</th>
      <th className="font-medium md:col-span-3">Vault</th>

      <th className="hidden items-center gap-x-1 font-medium md:flex">
        <span>Pol</span>
        <ToolTip iconSize={12}>
          Protocol Owned Liquidity is liquidity that will never be withdrawn.
        </ToolTip>
      </th>
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
