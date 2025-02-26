import { env } from "@/env";
import { executeGetDividendGreaterThan } from "@/server/queries/dividendsPaid";
import { api } from "@/trpc/server";
import { headers } from "next/headers";
import React from "react";
import AprDisplay from "./aprDisplay";
export const dynamic = "force-dynamic";
export default async function AprCard() {
  const list = headers();
  const aprUrl = list.get("host");
  const scheme = process.env.NODE_ENV === "production" ? "https" : "http";
  const apr = await api.divends.getApr();
  console.log(apr, "APR");
  const dividendsPaidRequest = await executeGetDividendGreaterThan({
    timestamp: apr?.latestTimestamp ?? 0,
  });
  console.log({ dividendsPaidRequest });
  let sync = false;
  if (dividendsPaidRequest.length) {
    console.log(`${scheme}://${aprUrl}/api/dividends`);
    sync = true;
    await fetch(`${scheme}://${aprUrl}/api/dividends`, {
      headers: {
        Authorization: `Bearer ${env.SECRET_KEY}`,
      },
    })
      .then((r) => r.text())
      .catch((e) => {
        console.log(e, "ERROR");
      });
    // sync apr with new events
    // **DON'T BLOCK THREAD WITH AWAIT
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md bg-secondary py-2">
      <div className="flex w-full flex-row items-center justify-center">
        <div className="px-2 text-sm text-gray-300">Staking APR</div>
      </div>
      <div className="font-lora text-2xl ">
        <AprDisplay currentApr={apr} sync={sync} />
      </div>
    </div>
  );
}
