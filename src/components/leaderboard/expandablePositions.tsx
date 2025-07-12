import type { TClosedApePositions, VaultFieldFragment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCallback } from "react";
import { fromHex } from "viem";

const cellStyling = "px-2 md:px-4 py-2.5 col-span-2 flex items-center";
const ExpandablePositions = ({
  positions,
  vaults,
}: {
  positions: TClosedApePositions[string]["positions"];
  vaults:
    | {
        vaults: VaultFieldFragment[];
      }
    | undefined;
}) => {
  const vault = useCallback(
    (_vaultId: `0x${string}`) => {
      const vaultId = fromHex(_vaultId, "number");
      const totalVaults = vaults?.vaults.length ?? 0;
      if (vaultId <= 0 || vaultId > totalVaults) {
        return {
          name: "Unknown Vault",
          vaultId,
          collateralSymbol: "Unknown",
        };
      }
      const vaultData = vaults?.vaults[vaultId - 1];
      if (!vaultData) {
        return {
          name: "Unknown Vault",
          vaultId,
          collateralSymbol: "Unknown",
        };
      }
      const { collateralSymbol, taxAmount } = vaultData;
      return {
        name: Number(taxAmount) > 0n ? "TEA" : "APE",
        vaultId,
        collateralSymbol,
      };
    },
    [vaults],
  );

  return (
    <div className="w-full">
      <div className="grid grid-cols-9 bg-primary/10 pl-8 text-left text-xs font-medium text-foreground/70 dark:bg-primary">
        <div className={cn(cellStyling, "col-span-1")}>Token</div>
        <div className={cn(cellStyling, "col-span-2")}>Collateral</div>
        <div className={cn(cellStyling, "col-span-2")}>Time it closed</div>
        <div className={cn(cellStyling, "col-span-2")}>PnL (USD)</div>
        <div className={cn(cellStyling, "col-span-2")}>PnL (Collateral)</div>
      </div>
      <div className="w-full space-y-[2px]">
        {positions.map((position, index) => {
          const vaultData = vault(position.vaultId);
          return (
            <div
              key={index}
              className="grid grid-cols-9 bg-primary/5 pl-8 text-left text-xs font-normal dark:bg-primary/50"
            >
              <div className={cn(cellStyling, "col-span-1")}>
                {vaultData.name}-{vaultData.vaultId}
              </div>
              <div className={cn(cellStyling, "col-span-2")}>
                {vaultData.collateralSymbol}
              </div>
              <div className={cn(cellStyling, "col-span-2")}>
                {(() => {
                  const date = new Date(position.timestamp * 1000);
                  const hours = date.getHours().toString().padStart(2, "0");
                  const minutes = date.getMinutes().toString().padStart(2, "0");
                  const day = date.getDate();
                  const month = date.toLocaleString("default", {
                    month: "long",
                  });
                  const year = date.getFullYear();
                  return `${hours}:${minutes}, ${month} ${day},${year}`;
                })()}
              </div>
              <div className={cn(cellStyling, "col-span-2")}>
                {position.pnlUsd.toFixed(4)} USD
              </div>
              <div className={cn(cellStyling, "col-span-2")}>
                {position.pnlCollateral.toFixed(8)} CLT
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExpandablePositions;
