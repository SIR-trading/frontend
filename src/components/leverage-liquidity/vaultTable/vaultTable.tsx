"use client";
import React from "react";
import { VaultTableRow } from "./vaultTableRow";
import { useSearchParams } from "next/navigation";
import ToolTip from "@/components/ui/tooltip";
import { useVaultProvider } from "@/components/providers/vaultProvider";
import VaultRowSkeleton from "./vaultRowSkeleton";
import Show from "@/components/shared/show";
export default function VaultTable({ isApe }: { isApe: boolean }) {
  const params = useSearchParams();
  const vaultPage = params.get("vault-page");
  let pagination = 1;
  if (vaultPage) {
    const x = Number.parseInt(vaultPage);
    if (isFinite(x)) pagination = x;
  }
  const { vaults, isFetching } = useVaultProvider();
  return (
    <table className="w-full">
      <caption className="pb-2 font-lora text-[24px] font-bold leading-[24px]">
        Popular Vaults
      </caption>

      <tbody className="space-y-2">
        <VaultTableRowHeaders />

        <Show
          when={!isFetching}
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
            .slice(pagination * 8 - 8, pagination * 8)
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
    <tr className="grid grid-cols-4 text-left text-[14px] font-normal text-gray-400 md:grid-cols-9">
      <th className="font-medium">ID</th>
      <th className="font-medium md:col-span-3">Vault</th>

      <th className="hidden items-center gap-x-1 font-medium md:flex">
        <span>POL</span>
        <ToolTip iconSize={15}>
          Protocol Owned Liquidity is liquidity that will never be withdrawn.
        </ToolTip>
      </th>
      <th className="gap hidden items-center gap-x-[2px] font-medium md:flex">
        Fees
        <ToolTip iconSize={15}>
          One-time APE minting fee. Half distributed to LPers at mint, and half
          at burn.
        </ToolTip>
      </th>
      <th className="relative z-10  flex items-center gap-x-[2px] font-medium">
        Leverage
        <ToolTip iconSize={15}>
          <div>
            SIR&apos;s returns increase as (price change)<sup>leverage</sup>.
          </div>
        </ToolTip>
      </th>
      <th className="relative  text-right font-medium md:col-span-2">TVL</th>
    </tr>
  );
}
