import { getBlock } from "@/lib/viemClient";
import { executeGetBlockNumber } from "@/server/queries/utils";
import type { NextApiRequest } from "next";
import { NextRequest, NextResponse } from "next/server";
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
// Poll subgraph to check if its up to date
// Generally used to invalidate queries after transaction
// **Subgraph is not live data
const handler = async (req: NextRequest) => {
  try {
    let loops = 0;
    let blockNumber = 0;
    const queryBlock = req?.nextUrl?.searchParams.get("block");

    console.log(queryBlock);
    if (queryBlock) {
      blockNumber = parseInt(queryBlock);
    } else {
      blockNumber = await getBlock().then((r) => parseInt(r.number.toString()));
    }
    let graphBlock = await executeGetBlockNumber();
    if (!graphBlock) {
      console.error("Failed to parse graphBlock");
      return NextResponse.json({ success: false }, { status: 500 });
    }
    while (graphBlock._meta.block.number < blockNumber) {
      console.log(loops, "LOOPS", blockNumber, graphBlock._meta.block.number);
      await sleep(300);
      loops++;
      graphBlock = await executeGetBlockNumber();
      console.log(graphBlock);
      if (!graphBlock) {
        console.error("Failed to parse graphBlock");
        return NextResponse.json({ success: false }, { status: 500 });
      }
      if (loops > 50) {
        return NextResponse.json({ success: false }, { status: 200 });
      }
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false }, { status: 500 });
  }
};

export { handler as GET };
