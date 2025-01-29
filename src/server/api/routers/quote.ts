import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { UniswapQuoterV2 } from "@/contracts/uniswap-quoterv2";
import { rpcViemClient } from "@/lib/viemClient";
import { OracleContract } from "@/contracts/oracle";
import type { TAddressString } from "@/lib/types";
import { parseUnits } from "viem";
export const quoteRouter = createTRPCRouter({
  getUniswapSwapQuote: publicProcedure
    .input(
      z.object({
        tokenAddressA: z.string().startsWith("0x").length(42),
        tokenAddressB: z.string().startsWith("0x").length(42),
        amount: z.string(),
        decimals: z.number(),
      }),
    )
    .query(async ({ input }) => {
      // grab fee tier
      // from SIR Oracle to ensure we get quote from correct pool

      const feeTier = await rpcViemClient.readContract({
        ...OracleContract,
        functionName: "state",
        args: [
          input.tokenAddressA as TAddressString,
          input.tokenAddressB as TAddressString,
        ],
      });
      const simmy = await rpcViemClient.simulateContract({
        ...UniswapQuoterV2,
        functionName: "quoteExactInputSingle",
        args: [
          {
            tokenIn: input.tokenAddressB as TAddressString,
            tokenOut: input.tokenAddressA as TAddressString,
            fee: feeTier.uniswapFeeTier.fee,
            amountIn: parseUnits(input.amount, input.decimals),
            sqrtPriceLimitX96: 0n,
          },
        ],
      });
      const [amountOut, sqrtPrice, initializedTicksCrossed, gasEstimate] =
        simmy.result;
      console.log(amountOut, "AMOUNT OUT");
      return { amountOut, sqrtPrice, initializedTicksCrossed, gasEstimate };
    }),
});
