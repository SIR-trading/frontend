import { getCoinUsdPriceOnDate } from "@/lib/coingecko";
import {
  insertOrUpdateCurrentApr,
  insertPayout,
} from "@/lib/db/queries/insert";
import {
  selectLastWeekPayouts,
  selectLastPayout,
} from "@/lib/db/queries/select";
import { executeGetDividendGreaterThan } from "@/server/queries/dividendsPaid";
import { NextResponse } from "next/server";
import { formatUnits, parseUnits } from "viem";

import { kv } from "@vercel/kv";
import { SIR_USD_PRICE } from "@/data/constants";
//sleep

export async function syncDividends() {
  console.log("RUNNING!");
  // Using Key Value for 'Process Ids'
  // To prevent duplicate syncs
  // TODO: maybe a better way to do this
  // Use a queue system to prevent multiple syncs
  try {
    const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID ?? "1");
    const contractAddress = process.env.NEXT_PUBLIC_SIR_ADDRESS;
    
    if (!contractAddress) {
      throw new Error("NEXT_PUBLIC_SIR_ADDRESS is not set");
    }

    const lastPayout = await selectLastPayout(chainId, contractAddress);
    if (lastPayout[0]) {
      await syncPayouts({ 
        timestamp: lastPayout[0].timestamp, 
        chainId, 
        contractAddress 
      });
    } else {
      await syncPayouts({ 
        timestamp: 0, 
        chainId, 
        contractAddress 
      });
    }
    console.log({ lastPayout });
    const apr = await getAndCalculateLastMonthApr(chainId, contractAddress);
    console.log({ apr });
    if (!apr) return;
    const lastPayoutA = await selectLastPayout(chainId, contractAddress);
    if (lastPayoutA[0]) {
      await insertOrUpdateCurrentApr({
        latestTimestamp: lastPayoutA[0].timestamp,
        apr: apr.toString(),
        chainId,
        contractAddress,
      });
    } else {
      console.error("Something went wrong.");
      await insertOrUpdateCurrentApr({
        latestTimestamp: 0,
        apr: apr.toString(),
        chainId,
        contractAddress,
      });
    }
    await kv.set("syncId", null);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    await kv.set("syncId", null);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

async function syncPayouts({ 
  timestamp, 
  chainId, 
  contractAddress 
}: { 
  timestamp: number; 
  chainId: number; 
  contractAddress: string; 
}) {
  const dividendPaidEvents = await executeGetDividendGreaterThan({
    timestamp,
  });
  for (const e of dividendPaidEvents) {
    console.log(e);
    const ethPrice = await getCoinUsdPriceOnDate({
      timestamp: parseInt(e.timestamp),
      id: "ethereum",
    });

    // const sirPrice = await getCoinUsdPriceOnDate({
    //   timestamp: parseInt(e.timestamp),
    //   id: "sir",
    // });
    if (!ethPrice) {
      throw new Error("Could not get eth price!");
    }

    if (!e.ethAmount || !e.stakedAmount) return;
    const sirUsdPrice =
      parseUnits(e.sirUsdPrice, 6) > 0n
        ? parseUnits(e.sirUsdPrice, 6)
        : parseUnits(SIR_USD_PRICE, 12);
    const ethParsed = parseUnits(e.ethAmount, 0);
    const sirParsed = parseUnits(e.stakedAmount, 0);
    const sirUsdPriceBig = sirUsdPrice; // sir already in usdc decimals(6)
    const ethUsdPriceBig = parseUnits(ethPrice.toString(), 18);

    const ethDecimals = 10n ** 18n;
    const sirDecimals = 10n ** 12n;
    if (
      ethParsed === 0n ||
      ethUsdPriceBig === 0n ||
      sirParsed === 0n ||
      sirUsdPriceBig === 0n
    )
      return;
    const ethInUsd = (ethParsed * ethUsdPriceBig) / ethDecimals;
    const sirInUSD = (sirParsed * sirUsdPriceBig) / sirDecimals;
    console.log(formatUnits(BigInt(e.sirUsdPrice), 6), "SIR USD PRICE");
    console.log(formatUnits(BigInt(e.stakedAmount), 12), "STAKED AMOUNT");
    console.log(formatUnits(BigInt(e.ethAmount), 18), "ETH AMOUNT");
    console.log(formatUnits(sirInUSD, 12));
    if (!ethPrice) continue;
    const a = await insertPayout({
      timestamp: parseInt(e.timestamp),
      sirInUSD: sirInUSD.toString(),
      ethInUSD: ethInUsd.toString(),
      chainId,
      contractAddress,
    });
    if (a === null) {
      // a duplicate insert was attempted
      return;
    }
  }
}

async function getAndCalculateLastMonthApr(chainId: number, contractAddress: string) {
  const payouts = await selectLastWeekPayouts(chainId, contractAddress);
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
  console.log(result);
  return result;
}
// because webpack is terrible
function divide(a: bigint, b: bigint) {
  if (a === 0n || b === 0n) return 0n;
  return a / b;
}
