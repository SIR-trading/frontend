import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { readContract } from "@/lib/viemClient";
import { erc20Abi } from "viem";
import type { TAddressString } from "@/lib/types";
export const erc20Router = createTRPCRouter({
  getErc20Decimals: publicProcedure
    .input(
      z.object({
        tokenAddress: z.string().startsWith("0x").length(42),
      }),
    )
    .query(async ({ input }) => {
      const decimals = await readContract({
        address: input.tokenAddress as TAddressString,
        abi: erc20Abi,
        functionName: "decimals",
      });
      return decimals;
    }),
});
