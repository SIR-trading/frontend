import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";
import { z } from "zod";
import { insertErrorLogs } from "@/lib/db/queries/insert";
import type { InsertErrorLogs } from "@/lib/db/schema";
import { createHash } from "crypto";
import { env } from "@/env";
import { selectErrorLogs, selectLogCountFromIp } from "@/lib/db/queries/select";
const ratelimit = new Ratelimit({
  redis: kv,
  // 5 requests from the same IP in 10 seconds
  limiter: Ratelimit.slidingWindow(5, "100 s"),
});
const ErrorLogSchema = z.object({
  userAddress: z.string(),
  error: z.string(),
  details: z.string(),
});
export type ErrorLog = z.infer<typeof ErrorLogSchema>;
const handler = async (req: NextRequest) => {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip: string = forwardedFor?.split(",")[0] ?? realIp ?? "unknown";

  console.log({ ip });
  if (!ip || ip === "unknown")
    return NextResponse.json({ success: false }, { status: 200 });
  const rate = await ratelimit.limit(ip);
  console.log("5");
  if (!rate.success)
    return NextResponse.json({ success: false }, { status: 200 });
  console.log("4");

  const resp = (await req.json()) as unknown;
  const ipHash = hashString(ip);
  const ipData = await selectLogCountFromIp({ ipHash });
  if (!ipData) return NextResponse.json({ success: false }, { status: 200 });
  console.log("3");
  const { count } = ipData;
  if (count > 1000)
    return NextResponse.json({ success: false }, { status: 200 });
  console.log("2");
  const parsed = ErrorLogSchema.safeParse(resp);
  if (parsed.success) {
    console.log("1");
    const { details, error, userAddress } = parsed.data;
    const data: InsertErrorLogs = {
      error,
      details,
      userAddress,
      timestamp: Math.floor(Date.now() / 1000),
      ip: ipHash,
    };
    await insertErrorLogs(data);
    return NextResponse.json({ success: true }, { status: 200 });
  } else {
    return NextResponse.json({ success: false }, { status: 200 });
  }
};
const getHandler = async (req: NextRequest) => {
  const auth = req.headers.get("Authorization");
  if (!auth?.includes(env.SECRET_KEY))
    return NextResponse.json({ success: false }, { status: 403 });
  try {
    const logs = await selectErrorLogs();
    return NextResponse.json(logs, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false }, { status: 403 });
  }
};
export { handler as POST, getHandler as GET };

function hashString(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
