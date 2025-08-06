import { ApeContract } from "@/contracts/ape";
import { AssistantContract } from "@/contracts/assistant";
import { VaultContract } from "@/contracts/vault";
import { env } from "@/env";
import { ZTokenPrices } from "@/lib/schemas";
import type { TCurrentApePositions } from "@/lib/types";
import { multicall, readContract } from "@/lib/viemClient";
import { getCurrentApePositions } from "@/server/queries/leaderboard";
import { formatUnits, fromHex, getAddress } from "viem";

const calculatePnl = (withdrawn: number, deposited: number) =>
  withdrawn - deposited;
const calculatePercentage = (withdrawn: number, deposited: number) =>
  deposited > 0 ? (withdrawn / deposited - 1) * 100 : 0;

export async function getActiveApePositions(): Promise<TCurrentApePositions> {
  const { apePositions } = await getCurrentApePositions();
  if (apePositions.length === 0) return {};

  const { apeTokens, totalSupplyContracts, vaultIds } = apePositions.reduce(
    (acc, position) => {
      if (!acc.collateralTokenSet.has(position.collateralToken)) {
        acc.collateralTokenSet.add(position.collateralToken);
        acc.apeTokens.push({
          network: "eth-mainnet",
          address: position.collateralToken,
        });
      }
      acc.totalSupplyContracts.push({
        address: position.apeAddress,
        abi: ApeContract.abi,
        functionName: "totalSupply" as const,
      });
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
          body: JSON.stringify({ addresses: apeTokens }),
        },
      ).catch(() => null),
      multicall({ contracts: totalSupplyContracts }),
      readContract({
        ...AssistantContract,
        functionName: "getReserves",
        args: [vaultIds],
      }),
      readContract({ ...VaultContract, functionName: "systemParams" }),
    ]);

  const fBase = systemParams.baseFee.fee;
  const prices: Record<string, string> = {};
  if (priceResponse?.ok) {
    try {
      const priceResult = ZTokenPrices.parse(await priceResponse.json());
      priceResult.data.forEach((token) => {
        prices[token.address] = token.prices[0]?.value ?? "0";
      });
    } catch {}
  }

  const allPositions: Array<{
    vaultId: `0x${string}`;
    user: `0x${string}`;
    apeBalance: string;
    collateralToken: string;
    pnlUsd: number;
    pnlUsdPercentage: number;
    pnlCollateral: number;
    pnlCollateralPercentage: number;
    leverageTier: number;
    netCollateralPosition: number;
    dollarTotal: number;
    collateralTotal: string;
  }> = [];

  apePositions.forEach(
    (
      {
        apeBalance,
        user,
        collateralToken,
        dollarTotal,
        collateralTotal,
        apeDecimals,
        leverageTier,
        vaultId,
      },
      index,
    ) => {
      const totalSupply = BigInt(apeTotalSupply[index]?.result ?? 0n);
      const collateralApeVault = vaultReserves[index]?.reserveApes ?? 0n;
      if (totalSupply === 0n || collateralApeVault === 0n) return;
      const collateralPosition =
        (BigInt(apeBalance) * collateralApeVault) / totalSupply;
      const leverageMultiplier = BigInt(10000 + 2 ** leverageTier * fBase);
      const netCollateralPosition =
        (collateralPosition * 10000n) / leverageMultiplier;
      const dollarValue = prices[collateralToken] ?? "0";
      const netCollateralPositionUsd =
        +formatUnits(netCollateralPosition, apeDecimals) * +dollarValue;
      const dollarTotalUsd = +formatUnits(BigInt(dollarTotal), 6);
      const currentCollateralAmount = +formatUnits(
        netCollateralPosition,
        apeDecimals,
      );
      const originalCollateralDeposited = +formatUnits(
        BigInt(collateralTotal),
        apeDecimals,
      );
      const pnlUsd = netCollateralPositionUsd - dollarTotalUsd;
      const pnlPercentage =
        dollarTotalUsd > 0 ? (pnlUsd / dollarTotalUsd) * 100 : 0;
      const pnlCollateral =
        currentCollateralAmount - originalCollateralDeposited;
      const pnlCollateralPercentage =
        originalCollateralDeposited > 0
          ? (pnlCollateral / originalCollateralDeposited) * 100
          : 0;

      allPositions.push({
        vaultId,
        apeBalance: formatUnits(BigInt(apeBalance), apeDecimals),
        collateralToken,
        pnlUsd,
        pnlUsdPercentage: pnlPercentage,
        pnlCollateral,
        pnlCollateralPercentage,
        leverageTier,
        netCollateralPosition: netCollateralPositionUsd,
        dollarTotal: dollarTotalUsd,
        collateralTotal: formatUnits(BigInt(collateralTotal), apeDecimals),
        user: getAddress(user),
      });
    },
  );

  // Sort positions by PnL in descending order
  const sortedPositions = allPositions.sort((a, b) => b.pnlUsd - a.pnlUsd);

  const result: TCurrentApePositions = {};
  sortedPositions.forEach((position, index) => {
    result[`position-${index}`] = {
      total: {
        pnlUsd: position.pnlUsd,
        pnlUsdPercentage: position.pnlUsdPercentage,
      },
      rank: index + 1,
      positions: [position], // Each entry now contains a single position
    };
  });

  return result;
}
