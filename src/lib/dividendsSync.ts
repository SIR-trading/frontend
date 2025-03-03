import { SIR_USD_PRICE } from "@/data/constants";
import { getCoinUsdPriceOnDate } from "@/lib/coingecko";
import {
  insertOrUpdateCurrentApr,
  insertPayout,
} from "@/lib/db/queries/insert";
import {
  selectLastMonthPayouts,
  selectLastPayout,
} from "@/lib/db/queries/select";
import { executeGetDividendGreaterThan } from "@/server/queries/dividendsPaid";
import { NextResponse } from "next/server";
import { formatUnits, parseUnits } from "viem";

import { kv } from "@vercel/kv";
import { randomInt } from "crypto";
//sleep
function sleep(ms = 0) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function syncDividends() {
  // Using Key Value for 'Process Ids'
  // To prevent duplicate syncs
  // TODO: maybe a better way to do this
  // Use a queue system to prevent multiple syncs
  const uid = randomInt(0, 10000000000);
  const currentSyncId = await kv.get("syncId");
  console.log({ currentSyncId });
  if (currentSyncId !== null) {
    return NextResponse.json({ success: false }, { status: 200 });
  }
  await kv.set("syncId", uid);
  await sleep(600);
  const foundId = await kv.get("syncId");
  console.log(foundId);
  if (foundId !== uid) {
    return NextResponse.json({ success: false }, { status: 200 });
  }
  try {
    const lastPayout = await selectLastPayout();
    if (lastPayout[0]) {
      await syncPayouts({ timestamp: lastPayout[0].timestamp });
    } else {
      await syncPayouts({ timestamp: 0 });
    }
    console.log({ lastPayout });
    const apr = await getAndCalculateLastMonthApr();
    console.log({ apr });
    if (!apr) return;
    const lastPayoutA = await selectLastPayout();
    console.log({ lastPayoutA });
    if (lastPayoutA[0]) {
      await insertOrUpdateCurrentApr({
        latestTimestamp: lastPayoutA[0].timestamp,
        apr: apr.toString(),
      });
    } else {
      console.error("Something went wrong.");
      await insertOrUpdateCurrentApr({
        latestTimestamp: 0,
        apr: apr.toString(),
      });
    }
    console.log("success");
    await kv.set("syncId", null);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    await kv.set("syncId", null);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

async function syncPayouts({ timestamp }: { timestamp: number }) {
  const dividendPaidEvents = await executeGetDividendGreaterThan({
    timestamp,
  });
  for (const e of dividendPaidEvents) {
    const ethPrice = await getCoinUsdPriceOnDate({
      timestamp: parseInt(e.timestamp),
      id: "ethereum",
    });
    const sirPrice = await getCoinUsdPriceOnDate({
      timestamp: parseInt(e.timestamp),
      id: "sir",
    });
    if (!ethPrice) {
      throw new Error("Could not get eth price!");
    }
    if (!sirPrice) {
      throw new Error("Could not get sir price!");
    }
    console.log(e.ethAmount, e.stakedAmount, "ETH");
    if (!e.ethAmount || !e.stakedAmount) return;
    const ethParsed = parseUnits(e.ethAmount, 0);
    const sirParsed = parseUnits(e.stakedAmount, 0);
    const sirUsdPriceBig = parseUnits(sirPrice.toString(), 12);
    const ethUsdPriceBig = parseUnits(ethPrice.toString(), 18);

    const ethDecimals = 10n ** 18n;
    const sirDecimals = 10n ** 12n;
    console.log({ ethParsed, ethUsdPriceBig, sirParsed, sirUsdPriceBig });
    if (
      ethParsed === 0n ||
      ethUsdPriceBig === 0n ||
      sirParsed === 0n ||
      sirUsdPriceBig === 0n
    )
      return;
    const ethInUsd = (ethParsed * ethUsdPriceBig) / ethDecimals;
    const sirInUSD = (sirParsed * sirUsdPriceBig) / sirDecimals;
    if (!ethPrice) continue;
    await insertPayout({
      timestamp: parseInt(e.timestamp),
      sirInUSD: sirInUSD.toString(),
      ethInUSD: ethInUsd.toString(),
    });
  }
}

async function getAndCalculateLastMonthApr() {
  const payouts = await selectLastMonthPayouts();
  console.log({ payouts });
  if (!payouts.length) return;

  let result = 0n;
  payouts.forEach((payout) => {
    if (payout.sirInUSD && payout.ethInUSD) {
      const sirInUsd = parseUnits(payout.sirInUSD, 0);
      const ethInUsd = parseUnits(payout.ethInUSD, 0);
      result += divide(100n * 12n * ethInUsd, sirInUsd);
    }
  });
  return result;
}
// because webpack is terrible
function divide(a: bigint, b: bigint) {
  if (a === 0n || b === 0n) return 0n;
  return a / b;
}
