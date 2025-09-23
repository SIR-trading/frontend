"use client";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import AddressExplorerLink from "@/components/shared/addressExplorerLink";
import { Loader2, ChevronUp, ChevronDown } from "lucide-react";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { fromHex } from "viem";
import { api } from "@/trpc/react";
import { useAccount } from "wagmi";
import type { TCurrentApePositions, TAddressString } from "@/lib/types";
import { TokenImage } from "@/components/shared/TokenImage";
import Show from "@/components/shared/show";
import { Button } from "@/components/ui/button";
import { BurnFormModal } from "@/components/portfolio/burnTable/burnFormModal";
import BurnForm from "@/components/portfolio/burnForm/burnForm";
import { useVaultData } from "@/contexts/VaultDataContext";

const cellStyling = "pr-2 md:pr-4 py-2.5 flex-1 flex items-center";

type SortField = "pnlUsd" | "pnlUsdPercentage";
type SortDirection = "asc" | "desc";

interface ActiveApePositionsTableProps {
  data: TCurrentApePositions | undefined;
  isLoading: boolean;
}

export const ActiveApePositionsTable: React.FC<
  ActiveApePositionsTableProps
> = ({ data, isLoading }) => {
  const [sortField, setSortField] = useState<SortField>("pnlUsdPercentage");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isClient, setIsClient] = useState(false);
  const { address: userAddress, isConnected } = useAccount();
  const [selectedPosition, setSelectedPosition] = useState<{
    vaultId: string;
    isApe: boolean;
    isClaiming: boolean;
    positionAddress: string;
  } | null>(null);

  const { allVaults: vaultsData } = useVaultData();

  // Transform the vault data to match the expected format
  const vaults = useMemo(() => {
    if (!vaultsData) return undefined;
    return { vaults: vaultsData };
  }, [vaultsData]);

  const { data: userBalancesInVaults } =
    api.user.getUserBalancesInVaults.useQuery(
      { address: userAddress },
      { enabled: Boolean(userAddress) },
    );

  const { data: apePositions } = api.user.getApePositions.useQuery(
    { address: userAddress },
    { enabled: Boolean(userAddress) },
  );

  const getUserApeBalance = (vaultId: number) => {
    if (!userBalancesInVaults) return 0n;
    return userBalancesInVaults.apeBalances[vaultId - 1] ?? 0n;
  };

  const getUserApePosition = (vaultId: number) => {
    return apePositions?.apePositions.find(
      (pos) => fromHex(pos.vault.id as `0x${string}`, "number") === vaultId,
    );
  };

  const selectedApePosition = selectedPosition
    ? getUserApePosition(+selectedPosition.vaultId)
    : null;

  const getVaultInfo = useCallback(
    (_vaultId: `0x${string}`, position?: { 
      collateralSymbol?: string; 
      debtSymbol?: string; 
      collateralToken?: string; 
      debtToken?: string;
    }) => {
      const vaultId = fromHex(_vaultId, "number");
      
      // First check if the position itself has the symbol information
      if (position?.collateralSymbol && position?.debtSymbol) {
        return {
          vaultId,
          collateralSymbol: position.collateralSymbol,
          debtSymbol: position.debtSymbol,
          collateralToken: (position.collateralToken ?? "0x0000000000000000000000000000000000000000") as TAddressString,
          debtToken: (position.debtToken ?? "0x0000000000000000000000000000000000000000") as TAddressString,
        };
      }
      
      // Find the vault by its actual vaultId, not by array index
      const vaultData = vaults?.vaults.find(v => parseInt(v.id) === vaultId);
      
      if (!vaultData) {
        console.warn(`Vault not found for vaultId: ${vaultId}. Available vaults:`, vaults?.vaults?.map(v => v.id));
        return {
          vaultId,
          collateralSymbol: "Unknown",
          debtSymbol: "Unknown",
          collateralToken:
            "0x0000000000000000000000000000000000000000" as TAddressString,
          debtToken:
            "0x0000000000000000000000000000000000000000" as TAddressString,
        };
      }
      
      return {
        vaultId,
        collateralSymbol: vaultData.collateralToken.symbol ?? 'Unknown',
        debtSymbol: vaultData.debtToken.symbol ?? 'Unknown',
        collateralToken: vaultData.collateralToken.id,
        debtToken: vaultData.debtToken.id,
      };
    },
    [vaults],
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  const sortedData = useMemo(() => {
    if (!data) return [];

    const entries = Object.entries(data);

    // Only sort on client side after hydration to avoid hydration mismatch
    if (!isClient) {
      return entries;
    }

    return entries.sort(([, a], [, b]) => {
      const aValue = a.position[sortField];
      const bValue = b.position[sortField];

      if (sortDirection === "desc") {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });
  }, [data, sortField, sortDirection, isClient]);

  const dataWithUserOnTop = useMemo(() => {
    const totalCount = sortedData.length;
    
    // If user is not connected, return sortedData with ranks
    if (!isConnected || !userAddress) {
      return sortedData.map(
        ([key, item], index) => {
          // If ascending order (worst to best), reverse the ranking
          const rank = sortDirection === "asc" ? totalCount - index : index + 1;
          return [key, item, rank] as [string, typeof item, number];
        },
      );
    }

    // Find all user positions and store their original ranks
    const userPositions: Array<[string, (typeof sortedData)[0][1], number]> =
      [];
    const otherPositions: Array<[string, (typeof sortedData)[0][1], number]> =
      [];

    sortedData.forEach(([key, item], index) => {
      const { position } = item;
      // If ascending order (worst to best), reverse the ranking
      const originalRank = sortDirection === "asc" ? totalCount - index : index + 1;

      if (
        position &&
        position.user.toLowerCase() === userAddress.toLowerCase()
      ) {
        userPositions.push([key, item, originalRank]);
      } else {
        otherPositions.push([key, item, originalRank]);
      }
    });

    // Return user positions first (with original ranks), then others
    return [...userPositions, ...otherPositions];
  }, [sortedData, userAddress, isConnected, sortDirection]);

  const hasUserPositions = useMemo(() => {
    if (!isConnected || !userAddress) return false;

    return dataWithUserOnTop.some(([, item]) => {
      const { position } = item;
      return (
        position && position.user.toLowerCase() === userAddress.toLowerCase()
      );
    });
  }, [dataWithUserOnTop, userAddress, isConnected]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (!isClient || sortField !== field) return null;
    return sortDirection === "desc" ? (
      <ChevronDown className="ml-1 h-4 w-4" />
    ) : (
      <ChevronUp className="ml-1 h-4 w-4" />
    );
  };

  // Show empty state if no data and not loading
  if (!isLoading && (!data || Object.keys(data).length === 0)) {
    return (
      <Card className="mx-auto w-full p-8 text-center">
        <p className="text-foreground/60">No active APE positions found.</p>
      </Card>
    );
  }

  return (
    <>
      {selectedPosition && selectedApePosition && (
        <BurnFormModal reset={() => setSelectedPosition(null)}>
          <BurnForm
            balance={getUserApeBalance(parseInt(selectedPosition.vaultId))}
            row={{
              ...selectedApePosition,
              // Flattened properties for backwards compatibility
              decimals: selectedApePosition.vault.ape?.decimals ?? selectedApePosition.vault.collateralToken.decimals,
              collateralSymbol: selectedApePosition.vault.collateralToken.symbol ?? 'Unknown',
              debtSymbol: selectedApePosition.vault.debtToken.symbol ?? 'Unknown',
              collateralToken: selectedApePosition.vault.collateralToken.id,
              debtToken: selectedApePosition.vault.debtToken.id,
              leverageTier: selectedApePosition.vault.leverageTier.toString(),
              vaultId: selectedApePosition.vault.id,
            }}
            isApe={true}
            close={() => setSelectedPosition(null)}
            teaRewardBalance={0n}
            isClaiming={false}
            levTier={selectedApePosition.vault.leverageTier.toString()}
          />
        </BurnFormModal>
      )}
      <Card className="mx-auto w-full p-0 md:px-0 md:py-2">
        <div className="w-full">
          <div className="">
            {/* Table Header */}
            <div className="flex border-b border-foreground/10 text-left text-sm font-normal text-foreground/60">
              <div className={cn(cellStyling, "w-14 flex-none pl-2")}>Rank</div>
              <div className={cn(cellStyling, "min-w-[80px] md:min-w-[160px]")}>
                Vault
              </div>
              <div className={cn(cellStyling, "min-w-[120px]")}>Address</div>
              <div className={cn(cellStyling, "hidden sm:flex")}>Deposit</div>
              <div
                className={cn(
                  cellStyling,
                  " cursor-pointer hover:bg-foreground/5",
                )}
                onClick={() => handleSort("pnlUsdPercentage")}
              >
                <span className="flex items-center">
                  Current % PnL
                  {getSortIcon("pnlUsdPercentage")}
                </span>
              </div>
              <div
                className={cn(
                  cellStyling,
                  " cursor-pointer hover:bg-foreground/5",
                  hasUserPositions ? "" : "flex-grow",
                )}
                onClick={() => handleSort("pnlUsd")}
              >
                <span className="flex items-center">
                  Current PnL
                  {getSortIcon("pnlUsd")}
                </span>
              </div>
              {hasUserPositions && (
                <div className={cn(cellStyling, "flex-none pr-0 md:pr-0")}>
                  <span className={"w-[45px]"}></span>
                </div>
              )}
            </div>

            {/* Table Body */}
            <div className="min-h-10 w-full">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin" />
                </div>
              ) : dataWithUserOnTop.length > 0 ? (
                <div className="w-full">
                  {dataWithUserOnTop.map(([key, item, realRank]) => {
                    const { position } = item;
                    if (!position) return null;

                    const vaultInfo = getVaultInfo(position.vaultId, position);
                    const isUserPosition =
                      isConnected &&
                      userAddress &&
                      position.user.toLowerCase() === userAddress.toLowerCase();

                    return (
                      <div
                        key={key}
                        className={cn(
                          "flex border-b border-foreground/5 text-sm font-medium hover:bg-foreground/5",
                          isUserPosition &&
                            "bg-primary/5 hover:bg-foreground/15 dark:bg-primary",
                        )}
                      >
                        {/* Rank - Shows real rank from sorted list */}
                        <div className={cn(cellStyling, "w-14 flex-none pl-2")}>
                          {realRank}
                        </div>

                        {/* Vault */}
                        <div
                          className={cn(
                            cellStyling,
                            "min-w-[80px] overflow-hidden md:min-w-[160px]",
                          )}
                        >
                          <div className="flex items-center overflow-hidden">
                            {/* Mobile: Show token logos with separator and leverage */}
                            <div className="flex items-center md:hidden">
                              <TokenImage
                                address={vaultInfo.collateralToken}
                                className="h-6 w-6 flex-shrink-0 rounded-full"
                                width={24}
                                height={24}
                                alt="Collateral token"
                              />
                              <span className="mx-1 flex-shrink-0 text-xs font-normal">/</span>
                              <TokenImage
                                address={vaultInfo.debtToken}
                                className="h-6 w-6 flex-shrink-0 rounded-full"
                                width={24}
                                height={24}
                                alt="Debt token"
                              />
                              <sup className="ml-0.5 flex-shrink-0 text-[10px] font-semibold">
                                {1 + Math.pow(2, position.leverageTier)}
                              </sup>
                            </div>

                            {/* Desktop: Show logo+symbol for each token */}
                            <div className="hidden items-center overflow-hidden md:flex">
                              <TokenImage
                                address={vaultInfo.collateralToken}
                                className="h-5 w-5 flex-shrink-0 rounded-full"
                                width={20}
                                height={20}
                                alt="Collateral token"
                              />
                              <span className="ml-1 truncate text-xs font-normal">
                                {vaultInfo.collateralSymbol}
                              </span>
                              <span className="mx-1 flex-shrink-0 text-xs font-normal">
                                /
                              </span>
                              <TokenImage
                                address={vaultInfo.debtToken}
                                className="h-5 w-5 flex-shrink-0 rounded-full"
                                width={20}
                                height={20}
                                alt="Debt token"
                              />
                              <span className="ml-1 truncate text-xs font-normal">
                                {vaultInfo.debtSymbol}
                              </span>
                              <sup className="ml-0.5 flex-shrink-0 text-[10px] font-semibold">
                                {1 + Math.pow(2, position.leverageTier)}
                              </sup>
                            </div>
                          </div>
                        </div>

                        {/* Address */}
                        <div className={cn(cellStyling, "min-w-[120px]")}>
                          <div className="flex w-full items-center justify-between">
                            <AddressExplorerLink
                              address={position.user}
                              fontSize={12}
                            />
                          </div>
                        </div>

                        {/* Deposit */}
                        <div className={cn(cellStyling, "hidden sm:flex")}>
                          <div className="flex flex-col text-xs">
                            <span>
                              <DisplayFormattedNumber
                                num={position.dollarTotal}
                              />{" "}
                              USD
                            </span>
                            <span className="text-foreground/60">
                              (
                              <DisplayFormattedNumber
                                num={+position.collateralTotal}
                              />{" "}
                              {vaultInfo.collateralSymbol})
                            </span>
                          </div>
                        </div>

                        {/* Current % PnL */}
                        <div className={cn(cellStyling, "")}>
                          <div className="flex flex-col text-xs">
                            <span
                              className={
                                position.pnlUsdPercentage > 0
                                  ? "text-accent-600 dark:text-accent-100"
                                  : ""
                              }
                            >
                              <DisplayFormattedNumber
                                num={position.pnlUsdPercentage}
                              />
                              %
                            </span>
                            <span className="text-foreground/60">
                              (
                              <span className={
                                position.pnlCollateralPercentage > 0
                                  ? "text-accent-600/70 dark:text-accent-100/70"
                                  : ""
                              }>
                                <DisplayFormattedNumber
                                  num={position.pnlCollateralPercentage}
                                />
                                %
                              </span>
                              {" in "}{vaultInfo.collateralSymbol})
                            </span>
                          </div>
                        </div>

                        {/* Current PnL */}
                        <div
                          className={cn(
                            cellStyling,
                            hasUserPositions ? "" : "flex-grow",
                          )}
                        >
                          <div className="flex flex-col text-xs">
                            <span
                              className={
                                position.pnlUsd > 0
                                  ? "text-accent-600 dark:text-accent-100"
                                  : ""
                              }
                            >
                              <DisplayFormattedNumber num={position.pnlUsd} />{" "}
                              USD
                            </span>
                            <span className="text-foreground/60">
                              (
                              <span className={
                                position.pnlCollateral > 0
                                  ? "text-accent-600/70 dark:text-accent-100/70"
                                  : ""
                              }>
                                <DisplayFormattedNumber
                                  num={position.pnlCollateral}
                                />
                                {" "}{vaultInfo.collateralSymbol}
                              </span>
                              )
                            </span>
                          </div>
                        </div>

                        {/* User Action - Only show when user has positions */}
                        {hasUserPositions && (
                          <div
                            className={cn(
                              cellStyling,
                              "relative flex-none pr-0 md:pr-0",
                            )}
                          >
                            <Show
                              when={!!isUserPosition}
                              fallback={<span className={"w-[45px]"}></span>}
                            >
                              <Button
                                onClick={() =>
                                  setSelectedPosition({
                                    vaultId: position.vaultId.toString(),
                                    isApe: true,
                                    isClaiming: false,
                                    positionAddress: position.user,
                                  })
                                }
                                type="button"
                                className="h-7 w-[45px] -translate-x-2 rounded-full p-1 text-[12px] md:-translate-x-4"
                              >
                                Burn
                              </Button>
                            </Show>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <></>
              )}
            </div>
          </div>
        </div>
      </Card>
    </>
  );
};
