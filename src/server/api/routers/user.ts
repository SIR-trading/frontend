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
      console.log(balance, allowance, input.tokenAddress, "BAL ALLOWANCE");
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
      console.log({ input });
      if (!input.address) {
        return;
      }
      const result = await executeGetUserApePositions({
        user: input.address as TAddressString,
      });

      return result;
    }),

  getTeaPositions: publicProcedure
    .input(
      z.object({ address: z.string().startsWith("0x").length(42).optional() }),
    )
    .query(async ({ input }) => {
      console.log({ input });
      if (!input.address) {
        return;
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
        functionName: "totalBalanceOf",
        args: [input.user as TAddressString],
      });
      return result;
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
});
//todo use ZOD

// create: publicProcedure
//   .input(z.object({ name: z.string().min(1) }))
//   .mutation(async ({ input }) => {
//     // simulate a slow db call
//     await new Promise((resolve) => setTimeout(resolve, 1000));

//     user = { id: user.id + 1, name: input.name };
//     return user;
//   }),
