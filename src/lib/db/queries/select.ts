import { desc, gt, eq, count, and } from "drizzle-orm";
import { db } from "../db";
import { currentApr, errorLogs, payoutTable } from "../schema";

export async function selectPayouts(chainId?: number, contractAddress?: string) {
  const query = db.select().from(payoutTable);
  
  if (chainId && contractAddress) {
    return query.where(
      and(
        eq(payoutTable.chainId, chainId),
        eq(payoutTable.contractAddress, contractAddress)
      )
    );
  }
  
  return query;
}

export async function selectLastWeekPayouts(chainId: number, contractAddress: string) {
  const now = Math.floor(Date.now() / 1000);
  console.log({ now });
  const payouts = await db
    .select()
    .from(payoutTable)
    .where(
      and(
        gt(payoutTable.timestamp, now - 30 * 7 * 60 * 60),
        eq(payoutTable.chainId, chainId),
        eq(payoutTable.contractAddress, contractAddress)
      )
    );
  return payouts;
}

export async function selectLastPayout(chainId: number, contractAddress: string) {
  const apr = await db
    .select()
    .from(payoutTable)
    .where(
      and(
        eq(payoutTable.chainId, chainId),
        eq(payoutTable.contractAddress, contractAddress)
      )
    )
    .orderBy(desc(payoutTable.timestamp))
    .limit(1);
  return apr;
}

export async function selectCurrentApr(chainId: number, contractAddress: string) {
  try {
    const result = await db
      .select()
      .from(currentApr)
      .where(
        and(
          eq(currentApr.chainId, chainId),
          eq(currentApr.contractAddress, contractAddress)
        )
      );
    return result[0];
  } catch (e) {
    console.error(e);
    return { id: 0, apr: "0", latestTimestamp: 0, chainId, contractAddress };
  }
}
export async function selectErrorLogs() {
  const logs = await db.select().from(errorLogs);
  return logs;
}
export async function selectLogCountFromIp({ ipHash }: { ipHash: string }) {
  const logs = await db
    .select({ count: count() })
    .from(errorLogs)
    .where(eq(errorLogs.ip, ipHash));
  return logs[0];
}
