import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import AddressExplorerLink from "@/components/shared/addressExplorerLink";
import { Loader2, ChevronUp, ChevronDown } from "lucide-react";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import {
  AccordionItem,
  AccordionContent,
  AccordionTrigger,
  Accordion,
} from "@/components/ui/accordion";
import { fromHex } from "viem";
import { api } from "@/trpc/react";
import { useAccount } from "wagmi";

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
    };
    userAddress?: `0x${string}` | undefined;
  }>;
  extractTotal: (item: T) => { pnlUsd: number; pnlUsdPercentage: number };
  extractPositions: (item: T) => P;
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
}: LeaderboardTableProps<T, P>) {
  const [sortField, setSortField] = useState<SortField>("pnlUsd");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isClient, setIsClient] = useState(false);
  const { address: userAddress, isConnected } = useAccount();

  const { data: vaults } = api.vault.getVaults.useQuery(
    {
      sortbyVaultId: true,
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      placeholderData: (previousData) => previousData,
    },
  );

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
    <Card className={"mx-auto w-full p-0 md:px-0 md:py-2"}>
      <div className="w-full">
        <div className="grid grid-cols-9 text-left text-sm font-normal text-foreground/60">
          <div className={cn(cellStyling, "col-span-1")}>Rank</div>
          <div className={cn(cellStyling, "col-span-4")}>Address</div>
          <div
            className={cn(cellStyling, "cursor-pointer hover:bg-foreground/5")}
            onClick={() => handleSort("pnlUsd")}
          >
            <span className="flex items-center">
              {pnlLabel}
              {getSortIcon("pnlUsd")}
            </span>
          </div>
          <div
            className={cn(cellStyling, "cursor-pointer hover:bg-foreground/5")}
            onClick={() => handleSort("pnlUsdPercentage")}
          >
            <span className="flex items-center">
              {pnlPercentageLabel}
              {getSortIcon("pnlUsdPercentage")}
            </span>
          </div>
        </div>
        <div className="min-h-10 w-full">
          {isLoading ? (
            <Loader2 className="mx-auto mt-8 animate-spin" />
          ) : sortedData.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {sortedData.map(([address, item], index) => {
                const total = extractTotal(item);
                const positions = extractPositions(item);

                return (
                  <AccordionItem
                    value={"item-" + index}
                    key={address}
                    className="border-collapse border-t-[1px] border-foreground/4 last:border-b-[1px]"
                  >
                    <AccordionTrigger>
                      <div className="grid w-full cursor-pointer grid-cols-9 font-geist text-sm font-medium hover:bg-foreground/5">
                        <div className={cn(cellStyling, "col-span-1")}>
                          {index + 1}
                        </div>
                        <div
                          className={cn(
                            cellStyling,
                            "pointer-events-none col-span-4",
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
                        <div className={cellStyling}>
                          <DisplayFormattedNumber num={total.pnlUsd} /> USD
                        </div>
                        <div className={cellStyling}>
                          <DisplayFormattedNumber
                            num={total.pnlUsdPercentage}
                          />
                          %
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
  );
}

export default LeaderboardTable;
