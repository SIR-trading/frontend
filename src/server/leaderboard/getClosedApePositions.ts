import { getClosedApePositions as getClosedApePositionsQuery } from "@/server/queries/leaderboard";
import groupBy from "lodash.groupby";
import { formatUnits, getAddress } from "viem";
import type { TClosedApePositions } from "@/lib/types";

const calculatePnl = (withdrawn: number, deposited: number) =>
  withdrawn - deposited;
const calculatePercentage = (withdrawn: number, deposited: number) =>
  deposited > 0 ? (withdrawn / deposited - 1) * 100 : 0;

export async function getClosedApePositions(): Promise<TClosedApePositions> {
  const { apePositionCloseds } = await getClosedApePositionsQuery();
  const groupedPositions = groupBy(apePositionCloseds, (position) =>
    getAddress(position.user),
  );

  const userResults = Object.entries(
    groupedPositions,
  ).reduce<TClosedApePositions>((acc, [user, userPositions]) => {
    const { items: positions, total: totalDepositAndWithdraw } =
      userPositions.reduce(
        (res, position) => {
          const collateralDeposited = +formatUnits(
            BigInt(position.collateralDeposited),
            position.vault.collateralToken.decimals,
          );
          const collateralWithdrawn = +formatUnits(
            BigInt(position.collateralWithdrawn),
            position.vault.collateralToken.decimals,
          );
          // dollarDeposited and dollarWithdrawn are now BigDecimal strings
          const dollarDeposited = parseFloat(position.dollarDeposited);
          const dollarWithdrawn = parseFloat(position.dollarWithdrawn);
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
            dollarDeposited,
            collateralDeposited,
            timestamp: +position.timestamp,
            vaultId: position.vault.id,
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
            dollarDeposited: number;
            collateralDeposited: number;
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
    acc[user] = { rank: 0, positions, total };
    return acc;
  }, {});

  const sortedUsers = Object.entries(userResults)
    .map(([user, data]) => ({
      user,
      ...data,
    }))
    .sort((a, b) => b.total.pnlUsd - a.total.pnlUsd);

  // Build final result with rankings
  const result: TClosedApePositions = {};
  sortedUsers.forEach(({ user, positions, total }, index) => {
    result[user] = {
      positions,
      total,
      rank: index + 1,
    };
  });

  return result;
}
