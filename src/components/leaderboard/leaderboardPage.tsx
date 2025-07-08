"use client";
import React from "react";
import { Container } from "../ui/container";
import { EPage } from "@/lib/types";
import Explainer from "@/components/shared/explainer";
import { api } from "@/trpc/react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import AddressExplorerLink from "@/components/shared/addressExplorerLink";

const cellStyling = "px-2 py-3";
const LeaderboardPage = () => {
  const { data: closedApePositions } =
    api.leaderboard.getClosedApePositions.useQuery();

  console.log(closedApePositions, "closedApePositions");
  return (
    <div className="">
      <Container className="">
        <Explainer page={EPage.LEADERBOARD} />
        <Card className={"mx-auto w-full max-w-[1000px]"}>
          <table className={"table w-full"}>
            <thead>
              <tr
                className={`table-row text-left  text-sm font-normal text-foreground/60`}
              >
                <th className={cellStyling}>Rank</th>
                <th className={cn("col-span-2", cellStyling)}>Address</th>
                <th className={cellStyling}>Absolute gain (USD)</th>
                <th className={cellStyling}>Relative gain (%)</th>
              </tr>
            </thead>
            <tbody className="space-y-8">
              {Object.entries(closedApePositions ?? {}).map(
                ([address, { total }], index) => {
                  return (
                    <tr
                      key={address}
                      className={`table-row font-geist text-sm font-medium`}
                    >
                      <td className={cellStyling}>{index + 1}</td>
                      <td className={cn("col-span-2", cellStyling)}>
                        <AddressExplorerLink address={address} fontSize={14} />
                      </td>
                      <td className={cellStyling}>
                        {total.pnlUsd.toFixed(2)} USD
                      </td>
                      <td className={cellStyling}>
                        {total.pnlUsdPercentage.toFixed(2)}%
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </Card>
      </Container>
    </div>
  );
};

export default LeaderboardPage;
