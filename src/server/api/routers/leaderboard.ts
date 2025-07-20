import { ApeContract } from "@/contracts/ape";
import { AssistantContract } from "@/contracts/assistant";
import type { TCurrentApePositions, TClosedApePositions } from "@/lib/types";
import { multicall, readContract } from "@/lib/viemClient";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  getClosedApePositions,
  getCurrentApePositions,
} from "@/server/queries/leaderboard";
import groupBy from "lodash.groupby";
import { formatEther, formatUnits, fromHex, getAddress } from "viem";

const calculatePnl = (withdrawn: number, deposited: number) =>
  withdrawn - deposited;

const calculatePercentage = (withdrawn: number, deposited: number) =>
  deposited > 0 ? (withdrawn / deposited - 1) * 100 : 0;

export const leaderboardRouter = createTRPCRouter({
  getActiveApePositions: publicProcedure.query(async () => {
    const { apePositions } = await getCurrentApePositions();

    const apeTotalSupply = await multicall({
      contracts: apePositions.map((position) => ({
        address: position.apeAddress,
        abi: ApeContract.abi,
        functionName: "totalSupply",
      })),
    });

    const vaultReserves = await readContract({
      ...AssistantContract,
      functionName: "getReserves",
      args: [
        apePositions.map((position) => fromHex(position.vaultId, "number")),
      ],
    });

    const netPosition = apePositions.map(
      (
        {
          apeBalance,
          leverageTier,
          vaultId,
          user,
          collateralTotal,
          dollarTotal,
        },
        index,
      ) => {
        const totalSupply = BigInt(apeTotalSupply[index]?.result ?? 0n);
        const collateralApeVault = vaultReserves[index]?.reserveApes ?? 0n;
        const collateralPosition =
          (BigInt(apeBalance) * collateralApeVault) / totalSupply;

        const leverageMultiplier = BigInt(1 + (leverageTier - 1) * 10000);
        const netCollateralPosition = collateralPosition / leverageMultiplier;

        return {
          vaultId,
          user,
          collateralPosition,
          collateralTotal,
          netCollateralPosition,
          dollarTotal,
        };
      },
    );

    const groupedPositions = groupBy(netPosition, (position) =>
      getAddress(position.user),
    );

    return Object.entries(groupedPositions).reduce<TCurrentApePositions>(
      (acc, [user, userPositions]) => {
        const totalNet = userPositions.reduce(
          (res, { netCollateralPosition }) => res + netCollateralPosition,
          0n,
        );
        acc[user] = {
          pnlUsd: +formatEther(totalNet), // USD amounts always use 6 decimals
          pnlUsdPercentage: +formatEther(totalNet),
        };
        return acc;
      },
      {} as TCurrentApePositions,
    );
  }),
  getClosedApePositions: publicProcedure.query(async () => {
    const { closedApePositions } = await getClosedApePositions();

    const groupedPositions = groupBy(closedApePositions, (position) =>
      getAddress(position.user),
    );

    return Object.entries(groupedPositions).reduce<TClosedApePositions>(
      (acc, [user, userPositions]) => {
        const { items: positions, total: totalDepositAndWithdraw } =
          userPositions.reduce(
            (res, position) => {
              // Collateral amounts use position-specific decimals
              const collateralDeposited = +formatUnits(
                BigInt(position.collateralDeposited),
                Number(position.decimal),
              );
              const collateralWithdrawn = +formatUnits(
                BigInt(position.collateralWithdrawn),
                Number(position.decimal),
              );
              // USD amounts always use 6 decimals (standard USD precision)
              const dollarDeposited = +formatUnits(
                BigInt(position.dollarDeposited),
                6, // USD amounts always use 6 decimals
              );
              const dollarWithdrawn = +formatUnits(
                BigInt(position.dollarWithdrawn),
                6, // USD amounts always use 6 decimals
              );

              const pnlUsd = calculatePnl(dollarWithdrawn, dollarDeposited);
              const pnlCollateral = calculatePnl(
                collateralWithdrawn,
                collateralDeposited,
              );
              const pnlUsdPercentage = calculatePercentage(
                dollarWithdrawn,
                dollarDeposited,
              );
              const pnlCollateralPercentage = calculatePercentage(
                collateralWithdrawn,
                collateralDeposited,
              );

              res.items.push({
                pnlUsd,
                pnlCollateral,
                pnlUsdPercentage,
                pnlCollateralPercentage,
                timestamp: +position.timestamp,
                vaultId: position.vaultId,
              });
              res.total.dollarWithdrawn += dollarWithdrawn;
              res.total.dollarDeposited += dollarDeposited;
              res.total.collateralWithdrawn += collateralWithdrawn;
              res.total.collateralDeposited += collateralDeposited;

              return res;
            },
            {
              items: [] as {
                pnlUsd: number;
                pnlCollateral: number;
                pnlUsdPercentage: number;
                pnlCollateralPercentage: number;
                timestamp: number;
                vaultId: `0x${string}`;
              }[],
              total: {
                dollarDeposited: 0,
                dollarWithdrawn: 0,
                collateralDeposited: 0,
                collateralWithdrawn: 0,
              },
            },
          );

        const total = {
          pnlUsd: calculatePnl(
            totalDepositAndWithdraw.dollarWithdrawn,
            totalDepositAndWithdraw.dollarDeposited,
          ),
          pnlCollateral: calculatePnl(
            totalDepositAndWithdraw.collateralWithdrawn,
            totalDepositAndWithdraw.collateralDeposited,
          ),
          pnlUsdPercentage: calculatePercentage(
            totalDepositAndWithdraw.dollarWithdrawn,
            totalDepositAndWithdraw.dollarDeposited,
          ),
          pnlCollateralPercentage: calculatePercentage(
            totalDepositAndWithdraw.collateralWithdrawn,
            totalDepositAndWithdraw.collateralDeposited,
          ),
        };

        acc[user] = { positions, total };
        return acc;
      },
      {},
    );
  }),
});
