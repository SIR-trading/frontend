import { db } from "../db";
import type {
  InsertErrorLogs,
} from "../schema";
import { errorLogs } from "../schema";

export async function insertErrorLogs(data: InsertErrorLogs) {
  const query = await db.insert(errorLogs).values(data);
  return query;
}
