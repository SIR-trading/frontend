"use client";
import { cellStyling } from "@/components/leaderboard/closedApePositions";
import AddressExplorerLink from "@/components/shared/addressExplorerLink";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { Card } from "@/components/ui/card";
import { cn, formatNumber } from "@/lib/utils";
import { api } from "@/trpc/react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
type SortField = "pnlUsd" | "pnlUsdPercentage";
type SortDirection = "asc" | "desc";

const ActiveApePositions = () => {
  const [sortField, setSortField] = useState<SortField>("pnlUsd");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isClient, setIsClient] = useState(false);
  const { data: openApePositions, isLoading } =
    api.leaderboard.getActiveApePositions.useQuery(undefined, {
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Use placeholder data to improve perceived performance
      placeholderData: (previousData) => previousData,
    });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const sortedData = useMemo(() => {
    if (!openApePositions) return [];

    const entries = Object.entries(openApePositions);

    // Only sort on client side after hydration to avoid hydration mismatch
    if (!isClient) {
      return entries;
    }

    return entries.sort(([, a], [, b]) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (sortDirection === "desc") {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });
  }, [openApePositions, sortField, sortDirection, isClient]);

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
              Current PnL [USD]
              {getSortIcon("pnlUsd")}
            </span>
          </div>
          <div
            className={cn(cellStyling, "cursor-pointer hover:bg-foreground/5")}
            onClick={() => handleSort("pnlUsdPercentage")}
          >
            <span className="flex items-center">
              Current % PnL
              {getSortIcon("pnlUsdPercentage")}
            </span>
          </div>
        </div>
        <div className="min-h-10 w-full">
          {isLoading ? (
            <Loader2 className="mx-auto mt-8 animate-spin" />
          ) : sortedData.length > 0 ? (
            sortedData.map(([address, { pnlUsd, pnlUsdPercentage }], index) => (
              <div
                className="grid w-full cursor-pointer grid-cols-9 font-geist text-sm font-medium hover:bg-foreground/5"
                key={address}
              >
                <div className={cn(cellStyling, "col-span-1")}>{index + 1}</div>
                <div
                  className={cn(cellStyling, "pointer-events-none col-span-4")}
                >
                  <div className="pointer-events-auto max-lg:hidden">
                    <AddressExplorerLink
                      address={address}
                      fontSize={14}
                      shortenLength={0}
                    />
                  </div>
                  <div className="pointer-events-auto lg:hidden">
                    <AddressExplorerLink address={address} fontSize={14} />
                  </div>
                </div>
                <div className={cellStyling}>
                  <DisplayFormattedNumber num={formatNumber(pnlUsd)} /> USD
                </div>
                <div className={cellStyling}>
                  <DisplayFormattedNumber
                    num={formatNumber(pnlUsdPercentage)}
                  />
                  %
                </div>
              </div>
            ))
          ) : (
            <></>
          )}
        </div>
      </div>{" "}
    </Card>
  );
};

export default ActiveApePositions;
