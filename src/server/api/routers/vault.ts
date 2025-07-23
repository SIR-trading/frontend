import { ApeContract } from "@/contracts/ape";
import { AssistantContract } from "@/contracts/assistant";
import { getVaultsForTable } from "@/lib/getVaults";
import { ZAddress } from "@/lib/schemas";
import type { TAddressString } from "@/lib/types";
import { multicall, readContract } from "@/lib/viemClient";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { executeSearchVaultsQuery } from "@/server/queries/searchVaults";
import { executeVaultsQuery } from "@/server/queries/vaults";
import { executeGetVaultFees } from "@/server/queries/fees";
import type { Address } from "viem";
import { erc20Abi } from "viem";
import { parseUnits } from "viem";
import { z } from "zod";
import { VaultContract } from "@/contracts/vault";
const ZVaultFilters = z.object({
  filterLeverage: z.string().optional(),
  filterDebtToken: z.string().optional(),
  filterCollateralToken: z.string().optional(),
});
export const vaultRouter = createTRPCRouter({
  getVaults: publicProcedure
    .input(
      z
        .object({
          filterLeverage: z.string().optional(),
          filterDebtToken: z.string().optional(),
          filterCollateralToken: z.string().optional(),
          first: z.number().optional(),
          sortbyVaultId: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      console.log(input, "INPUT");
      if (input) {
        const {
          filterLeverage,
          filterDebtToken,
          first,
          filterCollateralToken,
          sortbyVaultId,
        } = input;
        const vaults = await executeVaultsQuery({
          filterLeverage,
          filterDebtToken,
          filterCollateralToken,
          first,
          sortbyVaultId,
        });
        return vaults;
      } else {
        const vaults = await executeVaultsQuery({});
        return vaults;
      }
    }),
  getSearchVaults: publicProcedure
    .input(
      z.object({
        filters: ZVaultFilters.optional(),
        search: z.string(),
        type: z.union([z.literal("debt"), z.literal("collateral")]),
      }),
    )
    .query(async ({ input }) => {
      const result = await executeSearchVaultsQuery({
        ...input.filters,
        search: input.search,
        type: input.type,
      });
      return result;
    }),
  getTableVaults: publicProcedure
    .input(
      z
        .object({
          offset: z.number().optional(),
          filters: ZVaultFilters.extend({
            skip: z.number().optional(),
          }).optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const result = await getVaultsForTable(
        input?.offset ?? 0,
        input?.filters,
      );
      return result;
    }),
  getReserve: publicProcedure
    .input(z.object({ vaultId: z.number() }))
    .query(async ({ input }) => {
      const result = await readContract({
        ...AssistantContract,
        args: [[input.vaultId]],
        functionName: "getReserves",
      });
      return result;
    }),
  getDebtTokenMax: publicProcedure
    .input(
      z.object({
        debtToken: ZAddress,
        collateralToken: ZAddress,
        maxCollateralIn: z.string(),
        decimals: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const result = await readContract({
        ...AssistantContract,
        functionName: "quoteCollateralToDebtToken",
        args: [
          input.debtToken as TAddressString,
          input.collateralToken as TAddressString,
          parseUnits(input.maxCollateralIn, input.decimals),
        ],
      });
      return result;
    }),
  getReserves: publicProcedure
    .input(z.object({ vaultIds: z.array(z.number()).optional() }))
    .query(async ({ input }) => {
      if (!input.vaultIds) return [];
      const result = await readContract({
        ...AssistantContract,
        args: [input.vaultIds],
        functionName: "getReserves",
      });
      return result;
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
  getTotalCollateralFeesInVault: publicProcedure
    .input(z.array(z.string().startsWith("0x").length(42)))
    .query(async ({ input }) => {
      const totalReservesResult = await multicall({
        contracts: input.map((address) => ({
          ...VaultContract,
          functionName: "totalReserves",
          args: [address],
        })),
      });

      const balanceResult = await multicall({
        contracts: input.map((address) => ({
          abi: erc20Abi,
          address: address as Address,
          functionName: "balanceOf",
          args: [VaultContract.address],
        })),
      });

      const tokenWithFeesMap = new Map<string, bigint>();
      input.forEach((token, index) => {
        const balance = BigInt(balanceResult[index]?.result ?? 0);
        const reserve = BigInt(
          (totalReservesResult[index]?.result as unknown as
            | bigint
            | undefined) ?? 0,
        );
        const fees = balance - reserve;
        if (fees > BigInt(0)) tokenWithFeesMap.set(token, fees);
      });

      return tokenWithFeesMap;
    }),

  quoteBurn: publicProcedure
    .input(
      z.object({
        debtToken: z.string().startsWith("0x"),
        collateralToken: z.string().startsWith("0x"),
        leverageTier: z.number(),
        amount: z.string(),
        isApe: z.boolean(),
        decimals: z.number(),
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
          parseUnits(input.amount, input.decimals),
        ],
      });

      return result;
    }),
  quoteMint: publicProcedure
    .input(
      z.object({
        debtToken: z.string().startsWith("0x").optional(),
        collateralToken: z.string().startsWith("0x").optional(),
        usingDebtToken: z.boolean(),
        leverageTier: z.number().optional(),
        amount: z.string().optional(),
        decimals: z.number(),
        isApe: z.boolean(),
      }),
    )
    .query(async ({ input }) => {
      if (
        !input.collateralToken ||
        !input.debtToken ||
        input.leverageTier === undefined ||
        input.amount === undefined
      ) {
        return;
      }

      if (input.usingDebtToken) {
        const quote = await readContract({
          abi: AssistantContract.abi,
          address: AssistantContract.address,
          functionName: "quoteMintWithDebtToken",
          args: [
            input.isApe,
            {
              debtToken: input.debtToken as TAddressString,
              collateralToken: input.collateralToken as TAddressString,
              leverageTier: input.leverageTier,
            },
            parseUnits(input.amount, input.decimals),
          ],
        });
        return quote;
      } else {
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
            parseUnits(input.amount, input.decimals),
          ],
        });
        return [quote, 0n];
      }
    }),

  getVaultApy: publicProcedure
    .input(
      z.object({
        vaultId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { vaultId } = input;
      
      // Calculate timestamp for 1 month ago (30 days * 24 hours * 60 minutes * 60 seconds)
      const oneMonthAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
      
      try {
        const feesData = await executeGetVaultFees({
          vaultId,
          timestampThreshold: oneMonthAgo.toString(),
        });

        // Multiply all lpApy values from the past month
        const totalLpApy = feesData.fees.reduce((prod, fee) => {
          return prod * (1 + parseFloat(fee.lpApy));
        }, 1);
        
        // Convert to annualized percentage
        const annualizedApy = (totalLpApy ** (365 / 30) - 1) * 100;

        return {
          apy: annualizedApy,
          feesCount: feesData.fees.length,
        };
      } catch (error) {
        console.error("Error fetching vault APY:", error);
        return {
          apy: 0,
          feesCount: 0,
        };
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
