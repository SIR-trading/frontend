import { executeGetDividendGreaterThan } from "@/server/queries/dividendsPaid";
import { api } from "@/trpc/server";
import React from "react";
import AprDisplay from "./aprDisplay";
import { syncDividends } from "@/lib/dividendsSync";

import ToolTip from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";

export const revalidate = 60 * 15; // 15 minutes
export default async function AprCard() {
  let apr = await api.divends.getApr();
  const dividendsPaidRequest = await executeGetDividendGreaterThan({
    timestamp: apr?.latestTimestamp ?? 0,
  });
  if (dividendsPaidRequest.length) {
    await syncDividends();
    apr = await api.divends.getApr();
  }

  return (
    <Card className="flex flex-col items-center justify-center gap-2 rounded-md bg-secondary py-2">
      <div className="flex w-full flex-row items-center justify-center">
        <div className="text-gray-300 px-2 text-sm">Staking APR</div>
        <ToolTip size="300">
          <div className="rounded-sm bg-primary/5 text-[13px] font-medium backdrop-blur-xl dark:bg-primary">
            <span>
              The APR is estimated using the past month&apos;s dividend data.
            </span>
          </div>
        </ToolTip>
      </div>
      <div className="text-2xl font-normal ">
        <AprDisplay currentApr={apr} />
      </div>
    </Card>
  );
}
