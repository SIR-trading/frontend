import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import AddressExplorerLink from "@/components/shared/addressExplorerLink";
import { Loader2, ChevronUp, ChevronDown } from "lucide-react";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import WinnerCard from "@/components/leaderboard/winnerCard";
import ShareToX from "@/components/shared/shareToX";
import {
  AccordionItem,
  AccordionContent,
  AccordionTrigger,
  Accordion,
} from "@/components/ui/accordion";
import { fromHex } from "viem";
import { useAccount } from "wagmi";
import { useVaultData } from "@/contexts/VaultDataContext";

export const cellStyling = "px-2 md:px-4 py-3 col-span-2 flex items-center";

type SortField = "pnlUsd" | "pnlUsdPercentage";
type SortDirection = "asc" | "desc";

interface LeaderboardTableProps<T, P> {
  data: Record<string, T> | undefined;
  isLoading: boolean;
  pnlLabel: string;
  pnlPercentageLabel: string;
  emptyStateMessage?: string;
  expandableComponent: React.ComponentType<{
    positions: P;
    vault: (_vaultId: `0x${string}`) => {
      vaultId: number;
      collateralSymbol: string;
      debtSymbol?: string;
      leverageTier?: number;
      collateralToken?: `0x${string}`;
      debtToken?: `0x${string}`;
    };
    userAddress?: `0x${string}` | undefined;
  }>;
  extractTotal: (item: T) => { pnlUsd: number; pnlUsdPercentage: number };
  extractPositions: (item: T) => P;
  extractRank: (_item: T) => number;
}

function LeaderboardTable<T, P>({
  data,
  isLoading,
  pnlLabel,
  pnlPercentageLabel,
  emptyStateMessage,
  expandableComponent: ExpandableComponent,
  extractTotal,
  extractPositions,
  extractRank: _extractRank,
}: LeaderboardTableProps<T, P>) {
  const [sortField, setSortField] = useState<SortField>("pnlUsd");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isClient, setIsClient] = useState(false);
  const { address: userAddress, isConnected } = useAccount();

  const { allVaults: vaultsData } = useVaultData();

  // Transform the vault data to match the expected format
  const vaults = useMemo(() => {
    if (!vaultsData) return undefined;
    return { vaults: vaultsData };
  }, [vaultsData]);

  const vault = useCallback(
    (_vaultId: `0x${string}`) => {
      const vaultId = fromHex(_vaultId, "number");
      
      // Find the vault by its actual vaultId, not by array index
      const vaultData = vaults?.vaults.find(v => parseInt(v.id) === vaultId);
      
      if (!vaultData) {
        return {
          vaultId,
          collateralSymbol: "Unknown",
          debtSymbol: "Unknown",
          leverageTier: 0,
          collateralToken: undefined,
          debtToken: undefined,
        };
      }
      
      return {
        vaultId,
        collateralSymbol: vaultData.collateralToken.symbol ?? 'Unknown',
        debtSymbol: vaultData.debtToken.symbol ?? 'Unknown',
        leverageTier: vaultData.leverageTier,
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
      const aTotal = extractTotal(a);
      const bTotal = extractTotal(b);
      const aValue = aTotal[sortField];
      const bValue = bTotal[sortField];

      if (sortDirection === "desc") {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });
  }, [data, sortField, sortDirection, isClient, extractTotal]);

  const dataWithUserOnTop = useMemo(() => {
    if (!isConnected || !userAddress) return sortedData;

    const userEntryIndex = sortedData.findIndex(
      ([address]) => address.toLowerCase() === userAddress.toLowerCase(),
    );

    if (userEntryIndex === -1) return sortedData;

    const userEntry = sortedData[userEntryIndex];
    if (!userEntry) return sortedData;

    const otherEntries = sortedData.filter(
      (_, index) => index !== userEntryIndex,
    );

    return [userEntry, ...otherEntries];
  }, [sortedData, userAddress, isConnected]);

  // Identify PnL and % PnL leaders
  const { pnlLeader, percentageLeader } = useMemo(() => {
    if (!data || Object.keys(data).length === 0) {
      return { pnlLeader: null, percentageLeader: null };
    }

    let maxPnl = { address: "", amount: -Infinity };
    let maxPercentage = { address: "", percentage: -Infinity };

    Object.entries(data).forEach(([address, item]) => {
      const total = extractTotal(item);
      if (total.pnlUsd > maxPnl.amount) {
        maxPnl = { address, amount: total.pnlUsd };
      }
      if (total.pnlUsdPercentage > maxPercentage.percentage) {
        maxPercentage = { address, percentage: total.pnlUsdPercentage };
      }
    });

    return {
      pnlLeader: maxPnl.amount > -Infinity ? maxPnl : null,
      percentageLeader: maxPercentage.percentage > -Infinity ? maxPercentage : null,
    };
  }, [data, extractTotal]);

  // Create maps for both PnL and % PnL rankings
  const { pnlRanks, percentageRanks } = useMemo((): {
    pnlRanks: Map<string, number>;
    percentageRanks: Map<string, number>;
  } => {
    if (!data || Object.keys(data).length === 0) {
      return { pnlRanks: new Map<string, number>(), percentageRanks: new Map<string, number>() };
    }

    // Sort by PnL
    const pnlSorted = Object.entries(data).sort(([, a], [, b]) => {
      const aTotal = extractTotal(a);
      const bTotal = extractTotal(b);
      return bTotal.pnlUsd - aTotal.pnlUsd;
    });

    // Sort by % PnL
    const percentageSorted = Object.entries(data).sort(([, a], [, b]) => {
      const aTotal = extractTotal(a);
      const bTotal = extractTotal(b);
      return bTotal.pnlUsdPercentage - aTotal.pnlUsdPercentage;
    });

    const pnlRankMap = new Map<string, number>();
    const percentageRankMap = new Map<string, number>();

    pnlSorted.forEach(([address], index) => {
      pnlRankMap.set(address.toLowerCase(), index + 1);
    });

    percentageSorted.forEach(([address], index) => {
      percentageRankMap.set(address.toLowerCase(), index + 1);
    });

    return { pnlRanks: pnlRankMap, percentageRanks: percentageRankMap };
  }, [data, extractTotal]);

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
        <p className="text-foreground/60">
          {emptyStateMessage ?? "No positions found."}
        </p>
      </Card>
    );
  }

  return (
    <>
      <WinnerCard
        pnlLeader={pnlLeader}
        percentageLeader={percentageLeader}
        isLoading={isLoading}
      />
      <Card className={"mx-auto w-full p-0 md:px-0 md:py-2"}>
        <div className="w-full">
        <div className="grid grid-cols-7 text-left text-sm font-normal text-foreground/60">
          <div className={cn(cellStyling, "col-span-1")}>Rank</div>
          <div className={cn(cellStyling, "col-span-3")}>Address</div>
          <div
            className={cn(cellStyling, "col-span-1 cursor-pointer hover:bg-foreground/5")}
            onClick={() => handleSort("pnlUsdPercentage")}
          >
            <span className="flex items-center">
              {pnlPercentageLabel}
              {getSortIcon("pnlUsdPercentage")}
            </span>
          </div>
          <div
            className={cn(cellStyling, "col-span-1 cursor-pointer hover:bg-foreground/5")}
            onClick={() => handleSort("pnlUsd")}
          >
            <span className="flex items-center">
              {pnlLabel}
              {getSortIcon("pnlUsd")}
            </span>
          </div>
          <div className={cn(cellStyling, "col-span-1")}></div>
        </div>
        <div className="min-h-10 w-full">
          {isLoading ? (
            <Loader2 className="mx-auto mt-8 animate-spin" />
          ) : sortedData.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {dataWithUserOnTop.map(([address, item], index) => {
                const total = extractTotal(item);
                const positions = extractPositions(item);
                const isUserRow =
                  isConnected &&
                  userAddress &&
                  address.toLowerCase() === userAddress.toLowerCase();
                const pnlRank = pnlRanks.get(address.toLowerCase()) ?? 0;
                const percentageRank = percentageRanks.get(address.toLowerCase()) ?? 0;

                return (
                  <AccordionItem
                    value={"item-" + index}
                    key={address}
                    className="border-collapse border-t-[1px] border-foreground/4 last:border-b-[1px]"
                  >
                    <AccordionTrigger>
                      <div
                        className={cn(
                          "grid w-full cursor-pointer grid-cols-7 font-geist text-sm font-medium hover:bg-foreground/5",
                          isUserRow &&
                            "bg-primary/5 hover:bg-foreground/15 dark:bg-primary/50",
                        )}
                      >
                        <div className={cn(cellStyling, "col-span-1")}>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">%:</span>
                              <span className="text-sm font-medium">{percentageRank}</span>
                              {percentageLeader?.address.toLowerCase() === address.toLowerCase() && (
                                <span className="text-sm">🎖️</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">$:</span>
                              <span className="text-sm font-medium">{pnlRank}</span>
                              {pnlLeader?.address.toLowerCase() === address.toLowerCase() && (
                                <span className="text-sm">🏆</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div
                          className={cn(
                            cellStyling,
                            "pointer-events-none col-span-3",
                            isUserRow && "font-semibold",
                          )}
                        >
                          <div
                            className="pointer-events-auto max-lg:hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <AddressExplorerLink
                              address={address}
                              fontSize={14}
                              shortenLength={0}
                            />
                          </div>
                          <div
                            className="pointer-events-auto lg:hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <AddressExplorerLink
                              address={address}
                              fontSize={14}
                            />
                          </div>
                        </div>
                        <div className={cn(cellStyling, "col-span-1")}>
                          <span className={
                            total.pnlUsdPercentage > 0
                              ? "text-accent-600 dark:text-accent-100"
                              : ""
                          }>
                            <DisplayFormattedNumber
                              num={total.pnlUsdPercentage}
                            />
                            %
                          </span>
                        </div>
                        <div className={cn(cellStyling, "col-span-1")}>
                          <span className={
                            total.pnlUsd > 0
                              ? "text-accent-600 dark:text-accent-100"
                              : ""
                          }>
                            <DisplayFormattedNumber num={total.pnlUsd} /> USD
                          </span>
                        </div>
                        <div className={cn(cellStyling, "col-span-1 justify-center")}>
                          {isUserRow && (
                            <div onClick={(e) => e.stopPropagation()} className="ml-2 mr-6">
                              <ShareToX
                                text={`Leveraging like a sir🧐 in the ${new Date().toLocaleDateString("en-US", { month: "long" })} competition:\n\n🏆 Rank #${Math.min(percentageRank, pnlRank)}\n${
                                  total.pnlUsdPercentage > 0 ? "📈" : "📉"
                                } ${total.pnlUsdPercentage > 0 ? "+" : ""}${total.pnlUsdPercentage.toFixed(1)}% realized gains\n\nNo liquidations. No funding fees. Convex returns without decay.\n\nJoin the monthly competition 👇\n`}
                                hashtags={[]}
                                iconOnly={true}
                                className="md:hidden"
                              />
                              <ShareToX
                                text={`Leveraging like a sir🧐 in the ${new Date().toLocaleDateString("en-US", { month: "long" })} competition:\n\n🏆 Rank #${Math.min(percentageRank, pnlRank)}\n${
                                  total.pnlUsdPercentage > 0 ? "📈" : "📉"
                                } ${total.pnlUsdPercentage > 0 ? "+" : ""}${total.pnlUsdPercentage.toFixed(1)}% realized gains\n\nNo liquidations. No funding fees. Convex returns without decay.\n\nJoin the monthly competition 👇\n`}
                                hashtags={[]}
                                className="hidden md:inline-flex"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent asChild>
                      <ExpandableComponent
                        positions={positions}
                        vault={vault}
                        userAddress={isConnected ? userAddress : undefined}
                      />
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
            <></>
          )}
        </div>
      </div>
    </Card>
    </>
  );
}

export default LeaderboardTable;
