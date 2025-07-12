import { createTRPCRouter, publicProcedure } from "../trpc";
import { executeGetLastestDividendsPaid } from "@/server/queries/dividendsPaid";
import { selectCurrentApr } from "@/lib/db/queries/select";
//sleep function
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export const dividendsRouter = createTRPCRouter({
  longPollDividends: publicProcedure.query(async () => {
    const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID ?? "1");
    const contractAddress = process.env.NEXT_PUBLIC_SIR_ADDRESS;
    
    if (!contractAddress) {
      throw new Error("NEXT_PUBLIC_SIR_ADDRESS is not set");
    }

    const event = await executeGetLastestDividendsPaid();
    let tries = 0;
    while (true) {
      tries++;
      await sleep(1000);
      const lastPayout = await selectCurrentApr(chainId, contractAddress);
      console.log(lastPayout?.latestTimestamp, event[0]?.timestamp);

      if (
        lastPayout?.latestTimestamp === parseInt(event[0]?.timestamp ?? "0")
      ) {
        return true;
      }
      if (tries > 10) {
        return false;
      }
    }
  }),
  getApr: publicProcedure.query(async () => {
    const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID ?? "1");
    const contractAddress = process.env.NEXT_PUBLIC_SIR_ADDRESS;
    
    if (!contractAddress) {
      throw new Error("NEXT_PUBLIC_SIR_ADDRESS is not set");
    }

    const result = await selectCurrentApr(chainId, contractAddress);
    console.log(result, "RESULT");
    return result;
  }),
});
