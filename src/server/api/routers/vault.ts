import { ApeContract } from "@/contracts/ape";
import { AssistantContract } from "@/contracts/assistant";
import type { TAddressString } from "@/lib/types";
import { multicall, readContract } from "@/lib/viemClient";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { executeVaultsQuery } from "@/server/queries/vaults";
import { parseUnits } from "viem";
import { z } from "zod";
export const vaultRouter = createTRPCRouter({
  getVaults: publicProcedure.query(async ({}) => {
    const vaults = await executeVaultsQuery();
    return vaults;
  }),

  getVaultExists: publicProcedure
    .input(
      z.object({
        debtToken: z.string().startsWith("0x"),
        collateralToken: z.string().startsWith("0x"),
        leverageTier: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const result = await readContract({
        ...AssistantContract,
        functionName: "getVaultStatus",
        args: [
          {
            debtToken: input.debtToken as TAddressString,
            collateralToken: input.collateralToken as TAddressString,
            leverageTier: input.leverageTier,
          },
        ],
      });
      return result;
    }),
  getApeParams: publicProcedure
    .input(z.object({ address: z.string().startsWith("0x") }))
    .query(async ({ input }) => {
      const result = await multicall({
        contracts: [
          {
            ...ApeContract,
            address: input.address as TAddressString,
            functionName: "leverageTier",
          },
          {
            ...ApeContract,
            address: input.address as TAddressString,
            functionName: "debtToken",
          },
          {
            ...ApeContract,
            address: input.address as TAddressString,
            functionName: "collateralToken",
          },
        ],
      });

      return {
        leverageTier: result[0].result,
        debtToken: result[1].result,
        collateralToken: result[2].result,
      };
    }),

  quoteBurn: publicProcedure
    .input(
      z.object({
        debtToken: z.string().startsWith("0x"),
        collateralToken: z.string().startsWith("0x"),
        leverageTier: z.number(),
        amount: z.string(),
        isApe: z.boolean(),
      }),
    )
    .query(async ({ input }) => {
      const result = await readContract({
        ...AssistantContract,
        functionName: "quoteBurn",
        args: [
          input.isApe,
          {
            debtToken: input.debtToken as TAddressString,
            collateralToken: input.collateralToken as TAddressString,
            leverageTier: input.leverageTier,
          },
          parseUnits(input.amount, 18),
        ],
      });

      return result;
    }),
  quoteMint: publicProcedure
    .input(
      z.object({
        debtToken: z.string().startsWith("0x").optional(),
        collateralToken: z.string().startsWith("0x").optional(),
        leverageTier: z.number().optional(),
        amount: z.string().optional(),
        isApe: z.boolean(),
      }),
    )
    .query(async ({ input }) => {
      console.log({ input });
      if (
        !input.collateralToken ||
        !input.debtToken ||
        input.leverageTier === undefined ||
        input.amount === undefined
      ) {
        return;
      }

      try {
        const quote = await readContract({
          abi: AssistantContract.abi,
          address: AssistantContract.address,
          functionName: "quoteMint",
          args: [
            input.isApe,
            {
              debtToken: input.debtToken as TAddressString,
              collateralToken: input.collateralToken as TAddressString,
              leverageTier: input.leverageTier,
            },
            parseUnits(input.amount, 18),
          ],
        });
        console.log(quote, "QUOTE");
        if (!quote) throw new Error("Quote mint failed.");
        return quote;
      } catch (e) {
        console.log(e);
        // console.log(e);
        return;
      }
    }),
});

// FOR TESTING
// const vault: VaultFieldsFragment = {
//   vaultId: "1",
//   debtToken: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
//   collateralToken: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
//   leverageTier: 1,
//   debtSymbol: "test1",
//   collateralSymbol: "test2",
// };
// const vault2 = { ...vault, debtSymbol: "test3", collateralSymbol: "test4" };
// const vaults: TVaults = { vaults: { vaults: [vault] } };
// for (let i = 0; i < 11; i++) {
//   vaults.vaults.vaults.push(vault);
// }
// for (let i = 0; i < 11; i++) {
//   vaults.vaults.vaults.push(vault2);
// }
