"use client";
import React, { useEffect } from "react";
import type { TVaults } from "@/lib/types";
import { VaultTableRow } from "./vaultTableRow";
import { useSearchParams } from "next/navigation";
import ToolTip from "@/components/ui/tooltip";
import { useVaultProvider } from "@/components/providers/vaultProvider";
import useVaultFilterStore from "@/lib/store";
export default function VaultTable({
  isApe,
}: {
  vaultQuery: TVaults;
  isApe: boolean;
}) {
  const params = useSearchParams();
  const vaultPage = params.get("vault-page");
  let pagination = 1;
  if (vaultPage) {
    const x = parseInt(vaultPage);
    if (isFinite(x)) pagination = x;
  }
  const { vaults } = useVaultProvider();
  return (
    <table className="w-full">
      <caption className="pb-2 font-lora text-[32px] font-bold">
        Popular Vaults
      </caption>

      <tbody className="space-y-2">
        <VaultTableRowHeaders />
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
      </tbody>
    </table>
  );
}

function VaultTableRowHeaders() {
  return (
    <tr className="grid grid-cols-4 px-1 text-left text-[14px] font-normal text-gray-400 md:grid-cols-9">
      <th className="font-medium">#</th>
      <th className="font-medium md:col-span-3">Vault</th>

      <th className="hidden items-center gap-x-1 font-medium md:flex">
        <span>POL</span>
        <ToolTip size={15}>
          Protocol Owned Liquidity is liquidity that will never be withdrawn.
        </ToolTip>
      </th>
      <th className="hidden items-center gap-x-1 font-medium md:flex">
        Fees
        <ToolTip size={15}>
          Fee charged to apes when minting or burning.
        </ToolTip>
      </th>
      <th className="pl-2 font-medium">Leverage</th>
      <th className="text-right font-medium md:col-span-2">TVL</th>
    </tr>
  );
}
