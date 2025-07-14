"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Container } from "../ui/container";
import { EPage } from "@/lib/types";
import Explainer from "@/components/shared/explainer";
import { api } from "@/trpc/react";
import { Card } from "@/components/ui/card";
import { cn, formatNumber } from "@/lib/utils";
import AddressExplorerLink from "@/components/shared/addressExplorerLink";

import { Loader2, ChevronUp, ChevronDown } from "lucide-react";
import ExpandablePositions from "@/components/leaderboard/expandablePositions";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import {
  AccordionItem,
  AccordionContent,
  AccordionTrigger,
  Accordion,
} from "@/components/ui/accordion";

const cellStyling = "px-2 md:px-4 py-3 col-span-2 flex items-center";

type SortField = "pnlUsd" | "pnlUsdPercentage";
type SortDirection = "asc" | "desc";

const LeaderboardPage = () => {
  const [sortField, setSortField] = useState<SortField>("pnlUsd");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isClient, setIsClient] = useState(false);

  const { data: closedApePositions, isLoading } =
    api.leaderboard.getClosedApePositions.useQuery(undefined, {
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Use placeholder data to improve perceived performance
      placeholderData: (previousData) => previousData,
    });

  const { data: vaults } = api.vault.getVaults.useQuery({
    sortbyVaultId: true,
  }, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const sortedData = useMemo(() => {
    if (!closedApePositions) return [];
    
    const entries = Object.entries(closedApePositions);
    
    // Only sort on client side after hydration to avoid hydration mismatch
    if (!isClient) {
      return entries;
    }
    
    return entries.sort(([, a], [, b]) => {
      const aValue = a.total[sortField];
      const bValue = b.total[sortField];
      
      if (sortDirection === "desc") {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });
  }, [closedApePositions, sortField, sortDirection, isClient]);

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
    <div className="">
      <Container className="">
        <Explainer page={EPage.LEADERBOARD} />
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
                  PnL [USD]
                  {getSortIcon("pnlUsd")}
                </span>
              </div>
              <div 
                className={cn(cellStyling, "cursor-pointer hover:bg-foreground/5")}
                onClick={() => handleSort("pnlUsdPercentage")}
              >
                <span className="flex items-center">
                  % PnL
                  {getSortIcon("pnlUsdPercentage")}
                </span>
              </div>
            </div>
            <div className="min-h-10 w-full">
              {isLoading ? (
                <Loader2 className="mx-auto mt-8 animate-spin" />
              ) : sortedData.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {sortedData.map(([address, { total, positions }], index) => (
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
                            <div className="pointer-events-auto max-lg:hidden">
                              <AddressExplorerLink
                                address={address}
                                fontSize={14}
                                shortenLength={0}
                              />
                            </div>
                            <div className="pointer-events-auto lg:hidden">
                              <AddressExplorerLink
                                address={address}
                                fontSize={14}
                              />
                            </div>
                          </div>
                          <div className={cellStyling}>
                            <DisplayFormattedNumber num={formatNumber(total.pnlUsd)} /> USD
                          </div>
                          <div className={cellStyling}>
                            <DisplayFormattedNumber num={formatNumber(total.pnlUsdPercentage)} />%
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent asChild>
                        <ExpandablePositions
                          positions={positions}
                          vaults={vaults}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <></>
              )}
            </div>
          </div>
        </Card>
      </Container>
    </div>
  );
};


export default LeaderboardPage;
