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
import { parseUnits } from "viem";

import { kv } from "@vercel/kv";
import { SIR_USD_PRICE } from "@/data/constants";
import { parse } from "path";

/**
 * Main function to synchronize dividend data from blockchain events
 * Processes new dividend payments and calculates APR based on recent payouts
 */
export async function syncDividends() {
  console.log("Starting dividend synchronization...");
  
  try {
    // Get configuration from environment variables
    const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID ?? "1");
    const contractAddress = process.env.NEXT_PUBLIC_SIR_ADDRESS;
    
    if (!contractAddress) {
      throw new Error("NEXT_PUBLIC_SIR_ADDRESS environment variable is not set");
    }

    // Get the last processed payout to determine sync starting point
    const lastProcessedPayout = await selectLastPayout(chainId, contractAddress);
    const startTimestamp = lastProcessedPayout[0]?.timestamp ?? 0;
    
    // Sync new dividend payouts from the blockchain
    await syncPayouts({ 
      timestamp: startTimestamp, 
      chainId, 
      contractAddress 
    });
    
    console.log("Last processed payout:", lastProcessedPayout);
    
    // Calculate and store the current APR based on recent payouts
    const weeklyApr = await calculateLastWeekApr(chainId, contractAddress);
    console.log("Calculated weekly APR:", weeklyApr);
    
    if (weeklyApr !== null) {
      const latestPayout = await selectLastPayout(chainId, contractAddress);
      const latestTimestamp = latestPayout[0]?.timestamp ?? 0;
      
      await insertOrUpdateCurrentApr({
        latestTimestamp,
        apr: weeklyApr.toString(),
        chainId,
        contractAddress,
      });
    }
    
    // Clear the sync lock
    await kv.set("syncId", null);
    return NextResponse.json({ success: true }, { status: 200 });
    
  } catch (error) {
    console.error("Error during dividend synchronization:", error);
    // Ensure sync lock is cleared even on failure
    await kv.set("syncId", null);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

/**
 * Fetches and processes dividend payout events from the blockchain
 * @param timestamp - Starting timestamp to fetch events from
 * @param chainId - Blockchain network ID
 * @param contractAddress - SIR contract address
 */
async function syncPayouts({ 
  timestamp, 
  chainId, 
  contractAddress 
}: { 
  timestamp: number; 
  chainId: number; 
  contractAddress: string; 
}) {
  // Fetch dividend events that occurred after the given timestamp
  const dividendPaidEvents = await executeGetDividendGreaterThan({ timestamp });
  
  for (const dividendEvent of dividendPaidEvents) {
    console.log("Processing dividend event:", dividendEvent);
    
    // Get ETH price at the time of the dividend event
    const ethPriceUsd = await getCoinUsdPriceOnDate({
      timestamp: parseInt(dividendEvent.timestamp),
      id: "ethereum",
    });

    if (!ethPriceUsd) {
      throw new Error(`Could not fetch ETH price for timestamp: ${dividendEvent.timestamp}`);
    }

    // Skip events with missing essential data
    if (!dividendEvent.ethAmount || !dividendEvent.stakedAmount) {
      console.warn("Skipping event with missing amount data");
      continue;
    }
    
    // Determine SIR USD price: use event price if available, otherwise fallback to constant
    const sirUsdPriceRaw = parseUnits(dividendEvent.sirUsdPrice, 0) > 0n
      ? dividendEvent.sirUsdPrice
      : SIR_USD_PRICE;
    
    // Parse amounts from the event (already in their respective decimal formats)
    const ethAmountWei = parseUnits(dividendEvent.ethAmount, 0);
    const sirAmountUnits = parseUnits(dividendEvent.stakedAmount, 0);
    
    // Convert prices to appropriate decimal precision
    const sirUsdPriceBigInt = parseUnits(sirUsdPriceRaw, 18);
    const ethUsdPriceBigInt = parseUnits(ethPriceUsd.toString(), 18);

    // Define decimal constants for calculations
    const ETH_DECIMALS = 10n ** 18n;
    const SIR_DECIMALS = 10n ** 18n;
    
    // Skip calculations if any value is zero (would cause division by zero or invalid data)
    if (ethAmountWei === 0n || ethUsdPriceBigInt === 0n || sirAmountUnits === 0n || sirUsdPriceBigInt === 0n) {
      console.warn("Skipping event with zero values");
      continue;
    }
    
    // Calculate USD values for both ETH dividends and SIR staked amounts
    const ethDividendsUsd = (ethAmountWei * ethUsdPriceBigInt) / ETH_DECIMALS;
    const sirStakedUsd = (sirAmountUnits * sirUsdPriceBigInt) / SIR_DECIMALS;
    
    // Insert the calculated payout data into the database
    const insertResult = await insertPayout({
      timestamp: parseInt(dividendEvent.timestamp),
      sirInUSD: sirStakedUsd.toString(),
      ethInUSD: ethDividendsUsd.toString(),
      chainId,
      contractAddress,
    });
    
    // If insert returns null, it means this payout was already processed
    if (insertResult === null) {
      console.log("Duplicate payout detected, stopping sync");
      return;
    }
  }
}

/**
 * Calculates the annualized percentage return (APR) based on the last week's payouts
 * @param chainId - Blockchain network ID
 * @param contractAddress - SIR contract address
 * @returns Calculated APR as bigint, or null if insufficient data
 */
async function calculateLastWeekApr(chainId: number, contractAddress: string): Promise<bigint | null> {
  const weeklyPayouts = await selectLastWeekPayouts(chainId, contractAddress);
  console.log("Weekly payouts for APR calculation:", weeklyPayouts);
  
  if (!weeklyPayouts.length) {
    console.log("No payouts found for APR calculation");
    return null;
  }

  let totalAprBasisPoints = 0n;
  
  weeklyPayouts.forEach((payout) => {
    if (payout.sirInUSD && payout.ethInUSD) {
      const sirStakedUsd = parseUnits(payout.sirInUSD, 0);
      const ethDividendsUsd = parseUnits(payout.ethInUSD, 0);
      
      // APR Formula: (ETH dividends USD / SIR staked USD) × (365 days / 7 days) × 100%
      // Using integer math: (365 * 100 * ethDividends) / (7 * sirStaked)
      // This gives us APR in basis points (1% = 100 basis points)
      const payoutAprBasisPoints = safeDivide(
        365n * 100n * ethDividendsUsd, 
        7n * sirStakedUsd
      );
      
      totalAprBasisPoints += payoutAprBasisPoints;
    }
  });
  
  console.log("Total APR (basis points):", totalAprBasisPoints);
  return totalAprBasisPoints;
}

/**
 * Performs safe division of two bigints, returning 0 if either operand is 0
 * @param dividend - The number to be divided
 * @param divisor - The number to divide by
 * @returns Result of division, or 0 if either input is 0
 */
function safeDivide(dividend: bigint, divisor: bigint): bigint {
  if (dividend === 0n || divisor === 0n) {
    return 0n;
  }
  return dividend / divisor;
}
