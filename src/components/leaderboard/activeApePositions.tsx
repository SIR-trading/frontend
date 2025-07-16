import { cellStyling } from "@/components/leaderboard/closedApePositions";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import React from "react";

const ActiveApePositions = () => {
  return (
    <Card className={"mx-auto w-full p-0 md:px-0 md:py-2"}>
      <div className="w-full">
        <div className="grid grid-cols-9 text-left text-sm font-normal text-foreground/60">
          <div className={cn(cellStyling, "col-span-1")}>Rank</div>
          <div className={cn(cellStyling, "col-span-4")}>Address</div>
          <div
            className={cn(cellStyling, "cursor-pointer hover:bg-foreground/5")}
            // onClick={() => handleSort("pnlUsd")}
          >
            <span className="flex items-center">
              Current PnL [USD]
              {/* {getSortIcon("pnlUsd")} */}
            </span>
          </div>
          <div
            className={cn(cellStyling, "cursor-pointer hover:bg-foreground/5")}
            // onClick={() => handleSort("pnlUsdPercentage")}
          >
            <span className="flex items-center">
              Current % PnL
              {/* {getSortIcon("pnlUsdPercentage")} */}
            </span>
          </div>
        </div>
        <div className="min-h-10 w-full"></div>
      </div>{" "}
    </Card>
  );
};

export default ActiveApePositions;
