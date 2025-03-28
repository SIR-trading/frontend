import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { ZTokenPricesSchema } from "@/lib/schemas";
type AddressQuery = {
  network: string;
  address: string;
}
export const priceRouter = createTRPCRouter({
  // Returns the latest price for vault tokens by symbol
  getVaultPrices: publicProcedure
    .input(z.object({ collateralToken: z.string(), debtToken: z.string(), chain: z.string().default("eth-mainnet") }))
    .query(async ({ input }) => {
      const { collateralToken, debtToken, chain } = input;
      console.log("-_".repeat(100), "Fetching vault prices for:", collateralToken, debtToken);
      const addressList: AddressQuery[] = [
        { network: chain, address: collateralToken },
        { network: chain, address: debtToken }
      ];
      const options = {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({
          addresses: addressList
        })

      };

      const response = await fetch(
        `https://api.g.alchemy.com/prices/v1/${process.env.ALCHEMY_BEARER}/tokens/by-address`,
        options
      );
      // Parse and validate the fetched JSON using ZVaultPrices
      return ZTokenPricesSchema.parse(await response.json());
    }),

  // Get token price by address
  getTokenPrice: publicProcedure
    .input(z.object({ chain: z.string(), contractAddress: z.string() }))
    .query(async ({ input }) => {
      const { chain, contractAddress } = input;
      console.log("-_".repeat(100), "fetching price for", contractAddress);

      const options = {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({
          addresses: [
            { network: chain, address: contractAddress }
          ]
        })
      };

      const response = await fetch(
        `https://api.g.alchemy.com/prices/v1/${process.env.ALCHEMY_BEARER}/tokens/by-address`,
        options
      );
      // Parse and validate the fetched JSON using ZVaultPrices
      return ZTokenPricesSchema.parse(await response.json());
    }),

  // Get token price by address
  getTokenListPrices: publicProcedure
    .input(z.object({ chain: z.string(), contractAddressList: z.array(z.string()) }))
    .query(async ({ input }) => {
      const { chain, contractAddressList } = input;
      console.log("-_".repeat(100), "fetching price for", contractAddressList);
      const addressList: AddressQuery[] = contractAddressList.map(address => { return { network: chain, address } });
      console.log(addressList, "_=".repeat(500));
      const options = {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({ addresses: addressList })
      };

      const response = await fetch(
        `https://api.g.alchemy.com/prices/v1/${process.env.ALCHEMY_BEARER}/tokens/by-address`,
        options
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Alchemy API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
      }
      const typedResponse = ZTokenPricesSchema.parse(await response.json());
      console.log("FROM_INPUT___", ">".repeat(100), typedResponse.data[0]?.prices)
      // Parse and validate the fetched JSON using ZVaultPrices
      return typedResponse;
    })
});
