import type { TClosedApePositions } from "@/lib/types";
import { cn } from "@/lib/utils";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { TokenImage } from "@/components/shared/TokenImage";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TwitterIcon } from "@/components/ui/icons/twitter-icon";
import { SharePositionModal } from "@/components/portfolio/burnTable/SharePositionModal";
import { getLogoAssetWithFallback } from "@/lib/assets";
import { useTokenlistContext } from "@/contexts/tokenListProvider";

const cellStyling = "px-2 md:px-4 py-3 flex items-center";
const ExpandablePositions = ({
  positions,
  vault,
  userAddress,
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
  userAddress?: `0x${string}` | undefined;
}) => {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<TClosedApePositions[string]["positions"][0] | null>(null);
  const [selectedVaultData, setSelectedVaultData] = useState<ReturnType<typeof vault> | null>(null);
  const { tokenMap } = useTokenlistContext();
  return (
    <>
      <div className="flex bg-primary/10 text-left text-xs font-medium text-foreground/70 dark:bg-primary">
        <div className={cn(cellStyling, "w-[80px] sm:w-[180px] flex-none pl-2 md:pl-6")}>Vault</div>
        <div className={cn(cellStyling, "flex-1")}>Time it closed</div>
        <div className={cn(cellStyling, "flex-1 hidden sm:flex")}>Deposit</div>
        <div className={cn(cellStyling, "flex-1")}>% PnL</div>
        <div className={cn(cellStyling, "flex-1")}>PnL</div>
        {userAddress && <div className="pl-2 md:pl-4 pr-4 md:pr-8 py-3 flex items-center w-[80px] flex-none"></div>}
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
              <div className={cn(cellStyling, "w-[80px] sm:w-[180px] flex-none pl-2 md:pl-6")}>
                {/* Mobile view - images with separator */}
                <div className="flex items-center md:hidden">
                  {vaultData.collateralToken && (
                    <TokenImage
                      address={vaultData.collateralToken}
                      className="h-5 w-5 flex-shrink-0 rounded-full"
                      width={20}
                      height={20}
                      alt="Collateral token"
                    />
                  )}
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
                  {vaultData.leverageTier !== undefined && (
                    <sup className="ml-0.5 flex-shrink-0 text-[10px] font-semibold">
                      {1 + Math.pow(2, vaultData.leverageTier)}
                    </sup>
                  )}
                </div>
                
                {/* Desktop view - images with symbols */}
                <div className="hidden items-center overflow-hidden md:flex">
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
              <div className={cn(cellStyling, "flex-1 hidden sm:flex")}>
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
                  <span className={position.pnlUsdPercentage > 0 ? "text-accent-600 dark:text-accent-100" : ""}>
                    <DisplayFormattedNumber num={position.pnlUsdPercentage} />%
                  </span>
                  <span className="text-foreground/60">
                    (
                    <span className={
                      position.pnlCollateralPercentage > 0
                        ? "text-accent-600 dark:text-accent-100"
                        : ""
                    }>
                      <DisplayFormattedNumber num={position.pnlCollateralPercentage} />%
                    </span>
                    {" in "}{vaultData.collateralSymbol})
                  </span>
                </div>
              </div>
              
              {/* PnL - Stacked */}
              <div className={cn(cellStyling, "flex-1")}>
                <div className="flex flex-col">
                  <span className={position.pnlUsd > 0 ? "text-accent-600 dark:text-accent-100" : ""}>
                    <DisplayFormattedNumber num={position.pnlUsd} /> USD
                  </span>
                  <span className="text-foreground/60">
                    (
                    <span className={
                      position.pnlCollateral > 0
                        ? "text-accent-600 dark:text-accent-100"
                        : ""
                    }>
                      <DisplayFormattedNumber num={position.pnlCollateral} />
                      {" "}{vaultData.collateralSymbol}
                    </span>
                    )
                  </span>
                </div>
              </div>

              {/* Share Button - Only for user's positions */}
              {userAddress && (
                <div className="pl-2 md:pl-4 pr-4 md:pr-8 py-3 flex items-center w-[80px] flex-none justify-center">
                  <Button
                    onClick={() => {
                      setSelectedPosition(position);
                      setSelectedVaultData(vaultData);
                      setShareModalOpen(true);
                    }}
                    className="h-7 rounded-md px-3 text-[12px]"
                  >
                    <TwitterIcon className="mr-1.5 h-3.5 w-3.5" />
                    Share
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Share Position Modal */}
      {selectedPosition && selectedVaultData && (
        <SharePositionModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedPosition(null);
            setSelectedVaultData(null);
          }}
          position={{
            isApe: true,
            collateralSymbol: selectedVaultData.collateralSymbol,
            debtSymbol: selectedVaultData.debtSymbol ?? "Unknown",
            leverageTier: selectedVaultData.leverageTier?.toString() ?? "0",
            pnlCollateral: selectedPosition.pnlCollateral,
            pnlDebtToken: 0, // Not available for closed positions
            currentCollateral: selectedPosition.collateralDeposited + selectedPosition.pnlCollateral,
            currentDebtTokenValue: 0, // Not available for closed positions
            initialCollateral: selectedPosition.collateralDeposited,
            initialDebtTokenValue: 0, // Not available for closed positions
            // Calculate prices from deposited/redeemed amounts
            averageEntryPrice: selectedPosition.collateralDeposited > 0
              ? selectedPosition.dollarDeposited / selectedPosition.collateralDeposited
              : 0,
            currentPrice: (selectedPosition.collateralDeposited + selectedPosition.pnlCollateral) > 0
              ? (selectedPosition.dollarDeposited + selectedPosition.pnlUsd) / (selectedPosition.collateralDeposited + selectedPosition.pnlCollateral)
              : 0,
            vaultLink: `/leverage/${selectedVaultData.vaultId}`,
            collateralLogoUrl: getLogoAssetWithFallback(selectedVaultData.collateralToken ?? "0x0", tokenMap).fallback ?? "",
            debtLogoUrl: getLogoAssetWithFallback(selectedVaultData.debtToken ?? "0x0", tokenMap).fallback ?? "",
            pnlUsdPercentage: selectedPosition.pnlUsdPercentage,
            pnlCollateralPercentage: selectedPosition.pnlCollateralPercentage,
          }}
          isLeaderboard={true}
        />
      )}
    </>
  );
};

export default ExpandablePositions;
