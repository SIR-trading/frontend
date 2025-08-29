import { graphqlClient } from "@/lib/graphqlClient";
import groupBy from "lodash.groupby";
import { formatUnits, getAddress } from "viem";
import type { TClosedApePositions, ClosedApePositionFragment } from "@/lib/types";
import { gql } from "graphql-request";

const calculatePnl = (withdrawn: number, deposited: number) =>
  withdrawn - deposited;
const calculatePercentage = (withdrawn: number, deposited: number) =>
  deposited > 0 ? (withdrawn / deposited - 1) * 100 : 0;

const lastMonthClosedPositionsQuery = gql`
  #graphql
  query LastMonthClosedPositionsQuery($startTimestamp: Int, $endTimestamp: Int) {
    closedApePositions(
      where: { 
        timestamp_gte: $startTimestamp,
        timestamp_lt: $endTimestamp 
      }
    ) {
      collateralDeposited
      collateralWithdrawn
      dollarDeposited
      dollarWithdrawn
      user
      vaultId
      timestamp
      decimal
    }
  }
`;

export async function getLastMonthClosedPositions(): Promise<TClosedApePositions> {
  // Get the first and last day of the previous month
  const now = new Date();
  const firstDayOfCurrentMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0)
  );
  const firstDayOfLastMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0)
  );
  
  const startTimestamp = Math.floor(firstDayOfLastMonth.getTime() / 1000);
  const endTimestamp = Math.floor(firstDayOfCurrentMonth.getTime() / 1000);

  const queryResponse = await graphqlClient.request<{ closedApePositions: ClosedApePositionFragment[] }>(
    lastMonthClosedPositionsQuery, 
    {
      startTimestamp,
      endTimestamp
    }
  );

  const closedApePositions = queryResponse.closedApePositions;
  
  const groupedPositions = groupBy(closedApePositions, (position) =>
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
            Number(position.decimal),
          );
          const collateralWithdrawn = +formatUnits(
            BigInt(position.collateralWithdrawn),
            Number(position.decimal),
          );
          const dollarDeposited = +formatUnits(
            BigInt(position.dollarDeposited),
            6,
          );
          const dollarWithdrawn = +formatUnits(
            BigInt(position.dollarWithdrawn),
            6,
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
            dollarDeposited,
            collateralDeposited,
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

  // Build final rankings
  const finalLeaderboard: TClosedApePositions = {};
  sortedUsers.forEach(({ user, positions, total }, index) => {
    finalLeaderboard[user] = {
      positions,
      total,
      rank: index + 1,
    };
  });

  return finalLeaderboard;
}