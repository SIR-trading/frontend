import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { ZTokenPrices } from "@/lib/schemas";

export const priceRouter = createTRPCRouter({
  // Returns the latest price for vault tokens by symbol
  getVaultPrices: publicProcedure
    .input(
      z.object({
        collateralToken: z.string(),
        debtToken: z.string(),
        chain: z.string().default("eth-mainnet"),
      }),
    )
    .query(async ({ input }) => {
      const { collateralToken, debtToken, chain } = input;

      const options = {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          addresses: [
            { network: chain, address: collateralToken },
            { network: chain, address: debtToken },
          ],
        }),
      };

      const response = await fetch(
        `https://api.g.alchemy.com/prices/v1/${process.env.ALCHEMY_BEARER}/tokens/by-address`,
        options,
      );
      // Parse and validate the fetched JSON using ZVaultPrices
      return ZTokenPrices.parse(await response.json());
    }),

  // Get token price by address
  getTokenPrice: publicProcedure
    .input(z.object({ chain: z.string(), contractAddress: z.string() }))
    .query(async ({ input }) => {
      const { chain, contractAddress } = input;

      const options = {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          addresses: [{ network: chain, address: contractAddress }],
        }),
      };

      const response = await fetch(
        `https://api.g.alchemy.com/prices/v1/${process.env.ALCHEMY_BEARER}/tokens/by-address`,
        options,
      );
      // Parse and validate the fetched JSON using ZVaultPrices
      return ZTokenPrices.parse(await response.json());
    }),

  getTokenPrices: publicProcedure
    .input(
      z.object({
        addresses: z.array(z.string()),
        chain: z.string().default("eth-mainnet"),
      }),
    )
    .query(async ({ input }) => {
      const { addresses, chain } = input;

      const options = {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          addresses: addresses.map((address) => ({ network: chain, address })),
        }),
      };

      const response = await fetch(
        `https://api.g.alchemy.com/prices/v1/${process.env.ALCHEMY_BEARER}/tokens/by-address`,
        options,
      );
      // Parse and validate the fetched JSON using ZTokenPrices
      const result = ZTokenPrices.parse(await response.json());

      // Convert result to the object format {address: result}
      return result.data.reduce(
        (acc, token) => {
          acc[token.address] = token;
          return acc;
        },
        {} as Record<string, (typeof result.data)[0]>,
      );
    }),
});
