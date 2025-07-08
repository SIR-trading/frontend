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

    return Object.entries(groupedPositions).reduce<
      Record<
        string,
        {
          positions: {
            pnlUsd: number;
            pnlCollateral: number;
            pnlUsdPercentage: number;
            pnlCollateralPercentage: number;
          }[];
          total: {
            pnlUsd: number;
            pnlCollateral: number;
            pnlUsdPercentage: number;
            pnlCollateralPercentage: number;
          };
        }
      >
    >((acc, [user, userPositions]) => {
      const { items: positions, total: totalDepositAndWithdraw } =
        userPositions.reduce(
          (res, position) => {
            const collateralDeposited = +formatUnits(
              BigInt(position.collateralDeposited),
              Number(position.decimal),
            );
            const collateralWithdrawn = +formatUnits(
              BigInt(position.collateralWithdrawn),
              Number(position.decimal),
            );
            const dollarDeposited = +formatUnits(
              BigInt(position.dollarDeposited),
              Number(position.decimal),
            );
            const dollarWithdrawn = +formatUnits(
              BigInt(position.dollarWithdrawn),
              Number(position.decimal),
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
    }, {});
  }),
});
