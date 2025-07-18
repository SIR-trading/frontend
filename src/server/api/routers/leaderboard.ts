import type { TClosedApePositions } from "@/lib/types";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { getClosedApePositions } from "@/server/queries/leaderboard";
import groupBy from "lodash.groupby";
import { formatUnits, getAddress } from "viem";

const calculatePnl = (withdrawn: number, deposited: number) =>
  withdrawn - deposited;

const calculatePercentage = (withdrawn: number, deposited: number) =>
  deposited > 0 ? (withdrawn / deposited - 1) * 100 : 0;

export const leaderboardRouter = createTRPCRouter({
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
