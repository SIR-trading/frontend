import { ApeContract } from "@/contracts/ape";
import { AssistantContract } from "@/contracts/assistant";
import { VaultContract } from "@/contracts/vault";
import { env } from "@/env";
import { ZTokenPrices } from "@/lib/schemas";
import type { TCurrentApePositions } from "@/lib/types";
import { multicall, readContract } from "@/lib/viemClient";
import { getCurrentApePositions } from "@/server/queries/leaderboard";
import { formatUnits, fromHex, getAddress } from "viem";
import buildData from "@/../public/build-data.json";
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

  const [priceResponse, apeTotalSupply, vaultReserves] =
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
    ]);

  // Use base fee from build-data (already converted to basis points)
  // buildData.systemParams.baseFee is in decimal (e.g., 0.1 for 10%)
  // Convert to basis points for the calculation (multiply by 10000)
  const baseFeeInBasisPoints = Math.round(buildData.systemParams.baseFee * 10000);
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
      // Get vault state data
      const apeTotalSupplyInVault = BigInt(apeTotalSupply[index]?.result ?? 0n);
      const vaultCollateralReserves = vaultReserves[index]?.reserveApes ?? 0n;
      
      // Skip if vault has no supply or reserves
      if (apeTotalSupplyInVault === 0n || vaultCollateralReserves === 0n) return;
      
      // Step 1: Calculate user's share of vault collateral
      // User owns (apeBalance / totalSupply) of the vault's collateral
      const userApeBalance = BigInt(apeBalance);
      const userShareOfVaultCollateral =
        (userApeBalance * vaultCollateralReserves) / apeTotalSupplyInVault;
      
      // Step 2: Apply leverage adjustment to get net position
      // Higher leverage tiers have higher fees, reducing net collateral
      // Formula: 10000 + (2^leverageTier * baseFeeInBasisPoints)
      const leverageFeeMultiplier = BigInt(10000 + 2 ** leverageTier * baseFeeInBasisPoints);
      const netCollateralAfterFees =
        (userShareOfVaultCollateral * 10000n) / leverageFeeMultiplier;
      
      // Step 3: Convert positions to human-readable numbers
      const currentCollateralAmount = +formatUnits(
        netCollateralAfterFees,
        apeDecimals,
      );
      const originalCollateralDeposited = +formatUnits(
        BigInt(collateralTotal),
        apeDecimals,
      );
      
      // Step 4: Calculate USD values using current market prices
      const currentTokenPrice = +(prices[collateralToken] ?? "0");
      const currentPositionValueUsd = currentCollateralAmount * currentTokenPrice;
      const originalDepositValueUsd = +formatUnits(BigInt(dollarTotal), 6);
      
      // Step 5: Calculate PnL (Profit and Loss)
      // PnL in USD
      const pnlUsd = currentPositionValueUsd - originalDepositValueUsd;
      const pnlUsdPercentage =
        originalDepositValueUsd > 0 
          ? (pnlUsd / originalDepositValueUsd) * 100 
          : 0;
      
      // PnL in collateral tokens
      const pnlCollateral = currentCollateralAmount - originalCollateralDeposited;
      const pnlCollateralPercentage =
        originalCollateralDeposited > 0
          ? (pnlCollateral / originalCollateralDeposited) * 100
          : 0;

      // Store calculated position data
      allPositions.push({
        vaultId,
        apeBalance: formatUnits(userApeBalance, apeDecimals),
        collateralToken,
        pnlUsd,
        pnlUsdPercentage,
        pnlCollateral,
        pnlCollateralPercentage,
        leverageTier,
        netCollateralPosition: currentPositionValueUsd,
        dollarTotal: originalDepositValueUsd,
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
      rank: index + 1,
      position, // Each entry now contains a single position
    };
  });

  return result;
}
