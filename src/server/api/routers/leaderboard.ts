import { ApeContract } from "@/contracts/ape";
import { AssistantContract } from "@/contracts/assistant";
import { env } from "@/env";
import { ZTokenPrices } from "@/lib/schemas";
import type { TCurrentApePositions, TClosedApePositions } from "@/lib/types";
import { multicall, readContract } from "@/lib/viemClient";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  getClosedApePositions,
  getCurrentApePositions,
} from "@/server/queries/leaderboard";
import groupBy from "lodash.groupby";
import { formatUnits, fromHex, getAddress } from "viem";
import { VaultContract } from "@/contracts/vault";

const calculatePnl = (withdrawn: number, deposited: number) =>
  withdrawn - deposited;

const calculatePercentage = (withdrawn: number, deposited: number) =>
  deposited > 0 ? (withdrawn / deposited - 1) * 100 : 0;

export const leaderboardRouter = createTRPCRouter({
  getActiveApePositions: publicProcedure.query(async () => {
    const { apePositions } = await getCurrentApePositions();

    if (apePositions.length === 0) {
      return {} as TCurrentApePositions;
    }

    // Optimize data preparation using a single reduce
    const { apeTokens, totalSupplyContracts, vaultIds } = apePositions.reduce(
      (acc, position) => {
        // Add unique collateral tokens for price API
        if (!acc.collateralTokenSet.has(position.collateralToken)) {
          acc.collateralTokenSet.add(position.collateralToken);
          acc.apeTokens.push({
            network: "eth-mainnet",
            address: position.collateralToken,
          });
        }

        // Add contract call for total supply
        acc.totalSupplyContracts.push({
          address: position.apeAddress,
          abi: ApeContract.abi,
          functionName: "totalSupply" as const,
        });

        // Add vault ID
        acc.vaultIds.push(fromHex(position.vaultId, "number"));

        return acc;
      },
      {
        collateralTokenSet: new Set<string>(),
        apeTokens: [] as { network: string; address: string }[],
        totalSupplyContracts: [] as {
          address: `0x${string}`;
          abi: typeof ApeContract.abi;
          functionName: "totalSupply";
        }[],
        vaultIds: [] as number[],
      },
    );

    // Execute all async operations in parallel
    const [priceResponse, apeTotalSupply, vaultReserves, systemParams] =
      await Promise.all([
        fetch(
          `https://api.g.alchemy.com/prices/v1/${env.ALCHEMY_BEARER}/tokens/by-address`,
          {
            method: "POST",
            headers: {
              accept: "application/json",
              "content-type": "application/json",
            },
            body: JSON.stringify({
              addresses: apeTokens,
            }),
          },
        ).catch((error) => {
          console.error("Failed to fetch token prices:", error);
          return null;
        }),
        multicall({
          contracts: totalSupplyContracts,
        }),
        readContract({
          ...AssistantContract,
          functionName: "getReserves",
          args: [vaultIds],
        }),
        readContract({
          ...VaultContract,
          functionName: "systemParams",
        }),
      ]);

    const fBase = systemParams.baseFee.fee;

    // Build price lookup map with fallback handling
    const prices: Record<string, string> = {};
    if (priceResponse?.ok) {
      try {
        const priceResult = ZTokenPrices.parse(await priceResponse.json());
        priceResult.data.forEach((token) => {
          prices[token.address] = token.prices[0]?.value ?? "0";
        });
      } catch (error) {
        console.error("Failed to parse price data:", error);
      }
    }

    // Process positions with optimized calculations
    const userPositionsMap = new Map<
      string,
      {
        totalNet: number;
        dollarTotal: number;
        positions: {
          vaultId: `0x${string}`;
          apeBalance: string;
          collateralToken: string;
          pnlUsd: number;
          pnlUsdPercentage: number;
          leverageTier: number;
          netCollateralPosition: number;
          dollarTotal: number;
        }[];
      }
    >();

    apePositions.forEach(
      (
        {
          apeBalance,
          user,
          collateralToken,
          dollarTotal,
          apeDecimals,
          leverageTier,
          vaultId,
        },
        index,
      ) => {
        const totalSupply = BigInt(apeTotalSupply[index]?.result ?? 0n);
        const collateralApeVault = vaultReserves[index]?.reserveApes ?? 0n;

        // Skip calculation if no reserves or total supply
        if (totalSupply === 0n || collateralApeVault === 0n) {
          return;
        }

        const collateralPosition =
          (BigInt(apeBalance) * collateralApeVault) / totalSupply;

        const leverageMultiplier = BigInt(10000 + (leverageTier - 1) * fBase);
        const netCollateralPosition =
          (collateralPosition * 10000n) / leverageMultiplier; // 10000n to adjust fBase for percentage

        const dollarValue = prices[collateralToken] ?? "0";
        const netCollateralPositionUsd =
          +formatUnits(netCollateralPosition, apeDecimals) * +dollarValue;

        // Parse dollar total (assuming it's in wei format like other USD amounts)
        const dollarTotalUsd = +formatUnits(BigInt(dollarTotal), 6);

        // Calculate PnL: subtract dollarTotal from totalNet
        const pnlUsd = netCollateralPositionUsd - dollarTotalUsd;
        const pnlPercentage =
          dollarTotalUsd > 0 ? (pnlUsd / dollarTotalUsd) * 100 : 0;

        // Accumulate user positions with individual position details
        const userAddress = getAddress(user);
        const current = userPositionsMap.get(userAddress) ?? {
          totalNet: 0,
          dollarTotal: 0,
          positions: [],
        };

        // Add individual position details
        const positionDetail = {
          vaultId,
          apeBalance: formatUnits(BigInt(apeBalance), apeDecimals),
          collateralToken,
          pnlUsd,
          pnlUsdPercentage: pnlPercentage,
          leverageTier,
          netCollateralPosition: netCollateralPositionUsd,
          dollarTotal: dollarTotalUsd,
        };

        userPositionsMap.set(userAddress, {
          totalNet: current.totalNet + netCollateralPositionUsd,
          dollarTotal: current.dollarTotal + dollarTotalUsd,
          positions: [...current.positions, positionDetail],
        });
      },
    );

    // Convert to final format
    const result: TCurrentApePositions = {};
    userPositionsMap.forEach(({ totalNet, dollarTotal, positions }, user) => {
      result[user] = {
        total: {
          pnlUsd: calculatePnl(totalNet, dollarTotal),
          pnlUsdPercentage: calculatePercentage(totalNet, dollarTotal),
        },
        positions,
      };
    });

    return result;
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
