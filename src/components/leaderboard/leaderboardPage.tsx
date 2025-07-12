"use client";
import React from "react";
import { Container } from "../ui/container";
import { EPage } from "@/lib/types";
import Explainer from "@/components/shared/explainer";
import { api } from "@/trpc/react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import AddressExplorerLink from "@/components/shared/addressExplorerLink";
import {
  CollapsibleTrigger,
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Loader2 } from "lucide-react";
import ExpandablePositions from "@/components/leaderboard/expandablePositions";

const cellStyling = "px-2 md:px-4 py-3 col-span-2 flex items-center";
const LeaderboardPage = () => {
  const { data: closedApePositions, isLoading } =
    api.leaderboard.getClosedApePositions.useQuery();

  const { data: vaults } = api.vault.getVaults.useQuery({
    sortbyVaultId: true,
  });

  return (
    <div className="">
      <Container className="">
        <Explainer page={EPage.LEADERBOARD} />
        <Card
          className={
            "mx-auto w-[calc(100vw-32px)] max-w-[1000px] p-0 md:px-0 md:py-2"
          }
        >
          <div className="w-full">
            <div className="grid grid-cols-9 text-left text-sm font-normal text-foreground/60">
              <div className={cn(cellStyling, "col-span-1")}>Rank</div>
              <div className={cn(cellStyling, "col-span-4")}>Address</div>
              <div className={cellStyling}>Absolute gain (USD)</div>
              <div className={cellStyling}>Relative gain (%)</div>
            </div>
            <div className="min-h-10 w-full space-y-8">
              {isLoading ? (
                <Loader2 className="mx-auto mt-8 animate-spin" />
              ) : (
                Object.entries(closedApePositions ?? {}).map(
                  ([address, { total, positions }], index) => (
                    <Collapsible
                      key={address}
                      className="border-collapse border-y border-foreground/15"
                    >
                      <CollapsibleTrigger asChild>
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
                            <AddressExplorerLink
                              address={address}
                              fontSize={14}
                            />
                          </div>
                          <div className={cellStyling}>
                            {total.pnlUsd.toFixed(2)} USD
                          </div>
                          <div className={cellStyling}>
                            {total.pnlUsdPercentage.toFixed(2)}%
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <ExpandablePositions
                          positions={positions}
                          vaults={vaults}
                        />
                      </CollapsibleContent>
                    </Collapsible>
                  ),
                )
              )}
            </div>
          </div>
        </Card>
      </Container>
    </div>
  );
};


export default LeaderboardPage;
