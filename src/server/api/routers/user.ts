import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { getBalance, multicall, readContract } from "@/lib/viemClient";
import { erc20Abi, parseUnits } from "viem";
import { type TAddressString } from "@/lib/types";
import {
  executeGetUserApePositions,
  executeGetUserTeaPositions,
} from "@/server/queries/vaults";
import { VaultContract } from "@/contracts/vault";
import { SirContract } from "@/contracts/sir";
import { AssistantContract } from "@/contracts/assistant";

export const userRouter = createTRPCRouter({
  getTeaRewards: publicProcedure
    .input(
      z.object({
        vaultId: z.string(),
        userAddress: z.string().startsWith("0x"),
      }),
    )
    .query(async ({ input }) => {
      const rewards = await readContract({
        ...VaultContract,
        functionName: "unclaimedRewards",
        args: [
          parseUnits(input.vaultId, 0),
          input.userAddress as TAddressString,
        ],
      });
      return rewards;
    }),
  getBalanceAndAllowance: publicProcedure
    .input(
      z.object({
        userAddress: z.string().startsWith("0x").optional(),
        tokenAddress: z.string().startsWith("0x").optional(),
        spender: z.string().startsWith("0x").optional(),
      }),
    )
    .query(async ({ input }) => {
      if (!input.tokenAddress || !input.userAddress || !input.spender) {
        return {};
      }

      const [balance, allowance] = await multicall({
        contracts: [
          {
            address: input.tokenAddress as TAddressString,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [input.userAddress as TAddressString],
          },
          {
            address: input.tokenAddress as TAddressString,
            abi: erc20Abi,
            functionName: "allowance",
            args: [
              input.userAddress as TAddressString,
              input.spender as TAddressString,
            ],
          },
        ],
      });
      return {
        tokenBalance: balance,
        tokenAllowance: allowance,
      };
    }),
  getEthBalance: publicProcedure
    .input(
      z.object({
        userAddress: z.string().startsWith("0x").length(42).optional(),
      }),
    )
    .query(async ({ input }) => {
      if (!input?.userAddress) {
        throw new Error("No user address provided.");
      }
      const bal = await getBalance({
        address: input.userAddress as TAddressString,
      });
      return bal;
    }),
  getApeBalance: publicProcedure
    .input(
      z.object({
        address: z.string().startsWith("0x").length(42).optional(),
        user: z.string().startsWith("0x").length(42).optional(),
      }),
    )
    .query(async ({ input }) => {
      if (!input.address || !input.user) {
        throw Error("Null pointer");
      }
      const result = await readContract({
        abi: erc20Abi,
        address: input.address as TAddressString,
        functionName: "balanceOf",
        args: [input.user as TAddressString],
      });

      return result;
    }),
  getTeaBalance: publicProcedure
    .input(
      z.object({
        user: z.string().startsWith("0x").length(42).optional(),
        vaultId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const result = await readContract({
        ...VaultContract,
        functionName: "balanceOf",
        args: [input.user as TAddressString, parseUnits(input.vaultId, 0)],
      });
      return result;
    }),
  getApePositions: publicProcedure
    .input(
      z.object({ address: z.string().startsWith("0x").length(42).optional() }),
    )
    .query(async ({ input }) => {
      if (!input.address) {
        return { apePositions: [] };
      }
      const result = await executeGetUserApePositions({
        user: input.address as TAddressString,
      });

      return result;
    }),
  getUserBalancesInVaults: publicProcedure
    .input(
      z.object({ address: z.string().startsWith("0x").length(42).optional() }),
    )
    .query(async ({ input }) => {
      if (!input.address) {
        return { apeBalances: [], teaBalances: [], unclaimedSirRewards: [] };
      }
      const totalVaults = await readContract({
        ...VaultContract,
        functionName: "numberOfVaults",
      });
      if (!totalVaults) {
        return { apeBalances: [], teaBalances: [], unclaimedSirRewards: [] };
      }
      const [apeBalances, teaBalances, unclaimedSirRewards] =
        await readContract({
          ...AssistantContract,
          functionName: "getUserBalances",
          args: [
            input.address as TAddressString,
            BigInt(0), // offset
            BigInt(totalVaults),
          ],
        });

      return {
        apeBalances,
        teaBalances,
        unclaimedSirRewards,
      };
    }),
  getTeaPositions: publicProcedure
    .input(
      z.object({ address: z.string().startsWith("0x").length(42).optional() }),
    )
    .query(async ({ input }) => {
      if (!input.address) {
        return { teaPositions: [] };
      }
      const result = await executeGetUserTeaPositions({
        user: input.address as TAddressString,
      });

      return result;
    }),

  getUnclaimedContributorRewards: publicProcedure
    .input(
      z.object({
        user: z.string().startsWith("0x").length(42).optional(),
      }),
    )
    .query(async ({ input }) => {
      const result = await readContract({
        abi: SirContract.abi,
        address: SirContract.address,
        functionName: "contributorUnclaimedSIR",
        args: [input.user as TAddressString],
      });
      return result;
    }),
  getUnstakedSirBalance: publicProcedure
    .input(
      z.object({
        user: z.string().startsWith("0x").length(42).optional(),
      }),
    )
    .query(async ({ input }) => {
      const result = await readContract({
        abi: SirContract.abi,
        address: SirContract.address,
        functionName: "balanceOf",
        args: [input.user as TAddressString],
      });
      return result;
    }),
  getUserSirDividends: publicProcedure
    .input(
      z.object({
        user: z.string().startsWith("0x").length(42).optional(),
      }),
    )
    .query(async ({ input }) => {
      const result = await readContract({
        abi: SirContract.abi,
        address: SirContract.address,
        functionName: "unclaimedDividends",
        args: [input.user as TAddressString],
      });
      return result;
    }),
  getStakedSirPosition: publicProcedure
    .input(z.object({ user: z.string() }))
    .query(async ({ input }) => {
      const result = await readContract({
        abi: SirContract.abi,
        address: SirContract.address,
        functionName: "stakeOf",
        args: [input.user as TAddressString],
      });
      const [unlockedStake, lockedStake] = result;
      return { unlockedStake, lockedStake };
    }),
  getTotalSirBalance: publicProcedure
    .input(
      z.object({
        user: z.string().startsWith("0x").length(42).optional(),
      }),
    )
    .query(async ({ input }) => {
      const result = await readContract({
        abi: SirContract.abi,
        address: SirContract.address,
        functionName: "stakeOf",
        args: [input.user as TAddressString],
      });
      return result.reduce((acc, val) => acc + BigInt(val), BigInt(0));
    }),
  getSirSupply: publicProcedure.query(async () => {
    const result = await readContract({
      abi: SirContract.abi,
      address: SirContract.address,
      functionName: "supply",
      args: [],
    });
    return result;
  }),

  getSirTotalSupply: publicProcedure.query(async () => {
    const result = await readContract({
      abi: SirContract.abi,
      address: SirContract.address,
      functionName: "totalSupply",
      args: [],
    });
    return result;
  }),

  getWeeklyApr: publicProcedure.query(async () => {
    const { getWeeklyApr } = await import("@/lib/apr");
    return await getWeeklyApr();
  }),

  getMonthlyApr: publicProcedure.query(async () => {
    const { getMonthlyApr } = await import("@/lib/apr");
    return await getMonthlyApr();
  }),
});
