import type { TCurrentApePositions, VaultFieldFragment } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";
import { useCallback } from "react";
import { fromHex } from "viem";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";

const cellStyling = "px-1 md:px-4 py-2.5 flex-1 flex items-center";

const ExpandableActivePositions = ({
  positions,
  vaults,
}: {
  positions: TCurrentApePositions[string]["positions"];
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
        <div className={cn(cellStyling, "flex-none")}>Token</div>
        <div className={cn(cellStyling)}>Collateral</div>
        <div className={cn(cellStyling)}>Deposited [USD]</div>
        <div className={cn(cellStyling)}>Net Position [USD]</div>
        <div className={cn(cellStyling)}>Current PnL [USD]</div>
        <div className={cn(cellStyling)}>Current % PnL</div>
      </div>
      <div className="w-full space-y-[2px]">
        {positions.map((position, index) => {
          const vaultData = vault(position.vaultId);
          return (
            <div
              key={index}
              className="flex bg-primary/5 pl-2 text-left text-xs font-normal md:pl-6 dark:bg-primary/50"
            >
              <div className={cn(cellStyling, "flex-none")}>
                APE-{vaultData.vaultId}
              </div>
              <div className={cn(cellStyling)}>
                {vaultData.collateralSymbol}
              </div>
              <div className={cn(cellStyling)}>
                <DisplayFormattedNumber
                  num={formatNumber(+position.dollarTotal)}
                />{" "}
                USD
              </div>
              <div className={cn(cellStyling)}>
                <DisplayFormattedNumber
                  num={formatNumber(position.netCollateralPosition)}
                />{" "}
                USD
              </div>
              <div className={cn(cellStyling)}>
                <DisplayFormattedNumber num={formatNumber(position.pnlUsd)} />{" "}
                USD
              </div>
              <div className={cn(cellStyling)}>
                <DisplayFormattedNumber
                  num={formatNumber(position.pnlUsdPercentage)}
                />
                %
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default ExpandableActivePositions;
