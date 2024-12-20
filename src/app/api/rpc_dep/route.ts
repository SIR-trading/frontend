import { env } from "@/env";
import { kv } from "@vercel/kv";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import z from "zod";
const EthCallParamsSchema = z.union([
  z.object({
    data: z.string(),
    from: z.string().optional(),
    to: z.string(),
    value: z.string().optional(),
  }),
  z.string(),
]);
const EthCallSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.number(),
  method: z.string(),
  params: z.tuple([EthCallParamsSchema, z.literal("latest")]).optional(),
});
// const { limit } = new Ratelimit({
//   redis: kv,
//   limiter: Ratelimit.slidingWindow(
//     10000,
//     "60s",
//     // 200 requests from the same IP in 900 seconds
//   ),
// });
const handler = async (req: NextRequest) => {
  // const limiter = await limit(req.ip ?? "0");
  // if (!limiter.success) {
  //   console.log("RPC Rate Limited");
  //   return NextResponse.json({ success: false }, { status: 429 });
  // }

  const j = (await req.json()) as unknown;
  const call = EthCallSchema.safeParse(j);
  call.success;
  if (call.success) {
    // ensure only our contracts get called
    // for (const param of call?.data?.params) {
    //   if (param !== "latest") {
    //     if (
    //       param.to !== env.NEXT_PUBLIC_SIR_ADDRESS &&
    //       param.to !== env.NEXT_PUBLIC_VAULT_ADDRESS &&
    //       param.to !== env.NEXT_PUBLIC_ASSISTANT_ADDRESS
    //     ) {
    //       console.error("WRONG ADDRESS IN RPC");
    //       return NextResponse.json({ success: false }, { status: 429 });
    //     }
    //   }
    // }
    const rpcCall: unknown = await fetch(env.RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: call.success ? JSON.stringify(call.data) : JSON.stringify({}),
    }).then((r) => r.json());
    return NextResponse.json(rpcCall);
  } else if (!call.success) {
    console.error("FAILED TO PARSE JSON");
    console.log(call.error);
    return NextResponse.json({ success: false }, { status: 429 });
  } else {
    return NextResponse.json({ success: false }, { status: 429 });
  }
};

export { handler as GET, handler as POST };
