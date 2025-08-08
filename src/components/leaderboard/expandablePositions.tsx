import type { TClosedApePositions } from "@/lib/types";
import { cn } from "@/lib/utils";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { TokenImage } from "@/components/shared/TokenImage";

const cellStyling = "px-2 md:px-4 py-3 flex items-center";
const ExpandablePositions = ({
  positions,
  vault,
}: {
  positions: TClosedApePositions[string]["positions"];
  vault: (_vaultId: `0x${string}`) => {
    vaultId: number;
    collateralSymbol: string;
    debtSymbol?: string;
    leverageTier?: number;
    collateralToken?: `0x${string}`;
    debtToken?: `0x${string}`;
  };
}) => {
  return (
    <>
      <div className="flex bg-primary/10 text-left text-xs font-medium text-foreground/70 dark:bg-primary">
        <div className={cn(cellStyling, "w-[180px] flex-none pl-2 md:pl-6")}>Vault</div>
        <div className={cn(cellStyling, "flex-1")}>Time it closed</div>
        <div className={cn(cellStyling, "flex-1")}>Deposit</div>
        <div className={cn(cellStyling, "flex-1")}>% PnL</div>
        <div className={cn(cellStyling, "flex-1")}>PnL</div>
      </div>
      <div className="w-full space-y-[2px]">
        {positions.map((position, index) => {
          const vaultData = vault(position.vaultId);
          return (
            <div
              key={index}
              className="flex bg-primary/5 text-left text-xs font-normal dark:bg-primary/50"
            >
              {/* Vault Column */}
              <div className={cn(cellStyling, "w-[180px] flex-none pl-2 md:pl-6")}>
                <div className="flex items-center overflow-hidden">
                  {vaultData.collateralToken && (
                    <TokenImage
                      address={vaultData.collateralToken}
                      className="h-5 w-5 flex-shrink-0 rounded-full"
                      width={20}
                      height={20}
                      alt="Collateral token"
                    />
                  )}
                  <span className="ml-1 truncate text-xs font-medium">
                    {vaultData.collateralSymbol ?? 'Unknown'}
                  </span>
                  <span className="mx-1 flex-shrink-0 text-xs font-medium">/</span>
                  {vaultData.debtToken && (
                    <TokenImage
                      address={vaultData.debtToken}
                      className="h-5 w-5 flex-shrink-0 rounded-full"
                      width={20}
                      height={20}
                      alt="Debt token"
                    />
                  )}
                  <span className="ml-1 truncate text-xs font-medium">
                    {vaultData.debtSymbol ?? 'Unknown'}
                  </span>
                  {vaultData.leverageTier !== undefined && (
                    <sup className="ml-0.5 flex-shrink-0 text-[10px] font-semibold">
                      {1 + Math.pow(2, vaultData.leverageTier)}
                    </sup>
                  )}
                </div>
              </div>
              
              {/* Time it closed */}
              <div className={cn(cellStyling, "flex-1")}>
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
              
              {/* Deposit */}
              <div className={cn(cellStyling, "flex-1")}>
                <div className="flex flex-col">
                  <span>
                    <DisplayFormattedNumber num={position.dollarDeposited} /> USD
                  </span>
                  <span className="text-foreground/60">
                    (<DisplayFormattedNumber num={position.collateralDeposited} /> {vaultData.collateralSymbol})
                  </span>
                </div>
              </div>
              
              {/* % PnL - Stacked */}
              <div className={cn(cellStyling, "flex-1")}>
                <div className="flex flex-col">
                  <span className={position.pnlUsdPercentage >= 0 ? "text-green-500" : "text-red-500"}>
                    <DisplayFormattedNumber num={position.pnlUsdPercentage} />%
                  </span>
                  <span className="text-foreground/60">
                    (<DisplayFormattedNumber num={position.pnlCollateralPercentage} />% in {vaultData.collateralSymbol})
                  </span>
                </div>
              </div>
              
              {/* PnL - Stacked */}
              <div className={cn(cellStyling, "flex-1")}>
                <div className="flex flex-col">
                  <span className={position.pnlUsd >= 0 ? "text-green-500" : "text-red-500"}>
                    <DisplayFormattedNumber num={position.pnlUsd} /> USD
                  </span>
                  <span className="text-foreground/60">
                    (<DisplayFormattedNumber num={position.pnlCollateral} /> {vaultData.collateralSymbol})
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default ExpandablePositions;
