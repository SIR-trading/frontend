import { eq, count } from "drizzle-orm";
import { db } from "../db";
import { errorLogs } from "../schema";

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
