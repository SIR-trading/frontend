import { eq, and } from "drizzle-orm";
import { db } from "../db";
import type {
  InsertCurrentApr,
  InsertErrorLogs,
  InsertPayout,
} from "../schema";
import { currentApr, errorLogs, payoutTable } from "../schema";

export async function insertPayout(data: InsertPayout) {
  try {
    const existingRecord = await db
      .select()
      .from(payoutTable)
      .where(
        and(
          eq(payoutTable.timestamp, data.timestamp),
          eq(payoutTable.chainId, data.chainId),
          eq(payoutTable.contractAddress, data.contractAddress)
        )
      );
    if (existingRecord.length) {
      // ensure we don't dup multiple dividends events
      console.log("Record with this timestamp, chain, and contract already exists.");
      return null;
    }
    const query = await db.insert(payoutTable).values(data);
    return query;
  } catch (error) {
    console.error("Error inserting data:", error);
  }
}

export async function insertOrUpdateCurrentApr(data: InsertCurrentApr) {
  const query = await db
    .insert(currentApr)
    .values(data)
    .onConflictDoUpdate({ 
      target: [currentApr.chainId, currentApr.contractAddress], 
      set: {
        apr: data.apr,
        latestTimestamp: data.latestTimestamp,
      }
    });
  return query;
}
export async function insertErrorLogs(data: InsertErrorLogs) {
  const query = await db.insert(errorLogs).values(data);
  return query;
}
export async function deletePayouts() {
  const query = await db.delete(payoutTable);
  return query;
}
export async function deleteCurrentApr() {
  const query = await db.delete(currentApr);
  return query;
}
