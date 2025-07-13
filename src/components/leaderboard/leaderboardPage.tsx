"use client";
import React from "react";
import { Container } from "../ui/container";
import { EPage } from "@/lib/types";
import Explainer from "@/components/shared/explainer";
import { api } from "@/trpc/react";
import { Card } from "@/components/ui/card";
import { cn, formatNumber } from "@/lib/utils";
import AddressExplorerLink from "@/components/shared/addressExplorerLink";

import { Loader2 } from "lucide-react";
import ExpandablePositions from "@/components/leaderboard/expandablePositions";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import {
  AccordionItem,
  AccordionContent,
  AccordionTrigger,
  Accordion,
} from "@/components/ui/accordion";

const cellStyling = "px-2 md:px-4 py-3 col-span-2 flex items-center";
const LeaderboardPage = () => {
  const { data: closedApePositions, isLoading } =
    api.leaderboard.getClosedApePositions.useQuery();

  const { data: vaults } = api.vault.getVaults.useQuery({
    sortbyVaultId: true,
  });

  const closedArrs = Object.entries(closedApePositions ?? {});

  return (
    <div className="">
      <Container className="">
        <Explainer page={EPage.LEADERBOARD} />
        <Card className={"mx-auto w-full p-0 md:px-0 md:py-2"}>
          <div className="w-full">
            <div className="grid grid-cols-9 text-left text-sm font-normal text-foreground/60">
              <div className={cn(cellStyling, "col-span-1")}>Rank</div>
              <div className={cn(cellStyling, "col-span-4")}>Address</div>
              <div className={cellStyling}>PnL [USD]</div>
              <div className={cellStyling}>% PnL</div>
            </div>
            <div className="min-h-10 w-full">
              {isLoading ? (
                <Loader2 className="mx-auto mt-8 animate-spin" />
              ) : closedArrs.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {closedArrs.map(([address, { total, positions }], index) => (
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
