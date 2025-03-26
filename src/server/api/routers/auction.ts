import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { getOngoingAuctions } from "@/server/queries/auctions";
import { multicall } from "@/lib/viemClient";
import { SirContract } from "@/contracts/sir";
import type { Address } from "viem";
import { erc20Abi } from "viem";

export const auctionRouter = createTRPCRouter({
  getOngoingAuctions: publicProcedure
    .input(z.string().startsWith("0x").length(42).optional())
    .query(async ({ input: user }) => {
      const auctions = await getOngoingAuctions(user, "ongoing");
      return auctions.auctions;
    }),

  getExpiredAuctions: publicProcedure
    .input(z.string().startsWith("0x").length(42).optional())
    .query(async ({ input: user }) => {
      const auctions = await getOngoingAuctions(user, "expired");
      return auctions.auctions;
    }),

  getallAuctions: publicProcedure
    .input(z.string().startsWith("0x").length(42).optional())
    .query(async ({ input: user }) => {
      const auctions = await getOngoingAuctions(user);
      return auctions.auctions;
    }),

  getAuctionBalances: publicProcedure
    .input(z.array(z.string().startsWith("0x").length(42)))
    .query(async ({ input: addresses }) => {
      const balances = await multicall({
        contracts: addresses.map((address) => ({
          address: address as Address,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [SirContract.address],
        })),
      });

      const auctionBalanceMap = new Map<string, bigint>();
      addresses.forEach((address, index) => {
        auctionBalanceMap.set(address, BigInt(balances[index]?.result ?? 0));
      });

      return auctionBalanceMap;
    }),
});
