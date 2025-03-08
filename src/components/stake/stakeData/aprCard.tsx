import { executeGetDividendGreaterThan } from "@/server/queries/dividendsPaid";
import { api } from "@/trpc/server";
import React from "react";
import AprDisplay from "./aprDisplay";
import { syncDividends } from "@/lib/dividendsSync";

import ToolTip from "@/components/ui/tooltip";

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
    <div className="flex flex-col items-center justify-center gap-2 rounded-md bg-secondary py-2">
      <div className="flex w-full flex-row items-center justify-center">
        <div className="px-2 text-sm text-gray-300">Staking APR</div>
        <ToolTip size="300">
          <div className="rounded-sm bg-white text-[13px] font-medium text-gray-800">
            <span>
              The APR is estimated using the past month&apos;s dividend data.
              Since SIR isn&apos;t traded yet, the presale price of $0.000165
              per SIR is used.
            </span>
          </div>
        </ToolTip>
      </div>
      <div className="text-2xl font-normal ">
        <AprDisplay currentApr={apr} />
      </div>
    </div>
  );
}
