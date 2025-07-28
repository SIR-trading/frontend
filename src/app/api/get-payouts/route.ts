import { env } from "@/env";
import type { TAddressString } from "@/lib/types";
import buildData from "@/../public/build-data.json";

const SIR_ADDRESS = buildData.contractAddresses.sir as TAddressString;
import { selectPayouts } from "@/lib/db/queries/select";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
const RATE_LIMIT = 1; // Max 5 requests per 1000 seconds
const WINDOW_MS = 1000 * 60 * 100; // Time window in milliseconds
const rateLimit = new Map<string, number[]>();
async function handler(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? req.ip;
  if (!ip) {
    return new NextResponse("No IP Provided", { status: 429 });
  }
  const now = Date.now();
  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, []);
  }
  const timestamps = rateLimit.get(ip);
  if (!timestamps)
    return new NextResponse("Something went wrong.", { status: 429 });
  const filteredTimestamps = timestamps.filter(
    (timestamp) => now - timestamp < WINDOW_MS,
  );
  filteredTimestamps.push(now);

  rateLimit.set(ip, filteredTimestamps);

  if (filteredTimestamps.length > RATE_LIMIT) {
    return new NextResponse("Too many requests", { status: 429 });
  }
  const { searchParams } = new URL(req.url ?? "");
  const auth = searchParams.get("auth");
  if (auth === env.SECRET_KEY) {
    const chainId = parseInt(searchParams.get("chainId") ?? env.NEXT_PUBLIC_CHAIN_ID ?? "1");
    
    // Get SIR contract address from build-time data, fallback to env var
    let contractAddress = searchParams.get("contractAddress");
    if (!contractAddress) {
      try {
        contractAddress = SIR_ADDRESS;
      } catch {
        // Fallback to env var if build-time data not available
        contractAddress = env.NEXT_PUBLIC_SIR_ADDRESS ?? '';
      }
    }
    
    const payouts = await selectPayouts(chainId, contractAddress);
    return NextResponse.json({ payouts }, { status: 200 });
  }
  return NextResponse.json({}, { status: 403 });
}

export { handler as GET };
