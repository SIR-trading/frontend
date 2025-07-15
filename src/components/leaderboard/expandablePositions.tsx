import type { TClosedApePositions, VaultFieldFragment } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";
import { useCallback } from "react";
import { fromHex } from "viem";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";

const cellStyling = "px-1 md:px-4 py-2.5 flex-1 flex items-center";
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
          vaultId,
          collateralSymbol: "Unknown",
        };
      }
      const vaultData = vaults?.vaults[vaultId - 1];
      if (!vaultData) {
        return {
          vaultId,
          collateralSymbol: "Unknown",
        };
      }
      const { collateralSymbol } = vaultData;
      return {
        vaultId,
        collateralSymbol,
      };
    },
    [vaults],
  );

  return (
    <>
      <div className="flex bg-primary/10 pl-2 text-left text-xs font-medium text-foreground/70 md:pl-6 dark:bg-primary">
        <div className={cn(cellStyling, "w-[44px] flex-none md:w-[68px]")}>
          Token
        </div>
        <div className={cn(cellStyling, "w-[65px] flex-none md:w-[89px]")}>
          Collateral
        </div>
        <div className={cn(cellStyling)}>Time it closed</div>
        <div className={cn(cellStyling)}>PnL [USD]</div>
        <div className={cn(cellStyling)}>PnL [Collateral]</div>
        <div className={cn(cellStyling)}>% PnL [USD]</div>
        <div className={cn(cellStyling)}>% PnL [Collateral]</div>
      </div>
      <div className="w-full space-y-[2px]">
        {positions.map((position, index) => {
          const vaultData = vault(position.vaultId);
          return (
            <div
              key={index}
              className="flex bg-primary/5 pl-2 text-left text-xs font-normal md:pl-6 dark:bg-primary/50"
            >
              <div
                className={cn(cellStyling, "w-[44px] flex-none md:w-[68px]")}
              >
                APE-{vaultData.vaultId}
              </div>
              <div
                className={cn(cellStyling, "w-[65px] flex-none md:w-[89px]")}
              >
                {vaultData.collateralSymbol}
              </div>
              <div className={cn(cellStyling)}>
                {(() => {
                  const date = new Date(position.timestamp * 1000);
                  const hours = date.getHours().toString().padStart(2, "0");
                  const minutes = date.getMinutes().toString().padStart(2, "0");
                  const day = date.getDate();
                  const month = date.toLocaleString("default", {
                    month: "long",
                  });
                  const year = date.getFullYear();
                  return `${hours}:${minutes}, ${month} ${day}, ${year}`;
                })()}
              </div>
              <div className={cn(cellStyling)}>
                {formatNumber(position.pnlUsd, 3)} USD
              </div>
              <div className={cn(cellStyling)}>
                {formatNumber(position.pnlCollateral, 3)}{" "}
                {vaultData.collateralSymbol}
              </div>
              <div className={cn(cellStyling)}>
                {formatNumber(position.pnlUsdPercentage, 3)}%
              </div>
              <div className={cn(cellStyling)}>
                {formatNumber(position.pnlCollateralPercentage, 3)} %
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default ExpandablePositions;
