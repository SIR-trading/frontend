import { ApeContract } from "@/contracts/ape";
import { AssistantContract } from "@/contracts/assistant";
import type { TCurrentApePositions } from "@/lib/types";
import { multicall, readContract } from "@/lib/viemClient";
import { getCurrentApePositions } from "@/server/queries/leaderboard";
import { formatUnits, fromHex, getAddress } from "viem";
import buildData from "@/../public/build-data.json";
import { appRouter } from "@/server/api/root";
import { createCallerFactory } from "@/server/api/trpc";

export async function getActiveApePositions(): Promise<TCurrentApePositions> {
  const { apePositions } = await getCurrentApePositions();
  if (apePositions.length === 0) return {};

  // Create TRPC caller for server-side calls
  const createCaller = createCallerFactory(appRouter);
  const caller = createCaller({ headers: new Headers() });

  const { totalSupplyContracts, vaultIds, uniqueCollateralTokens } = apePositions.reduce(
    (acc, position) => {
      if (!acc.collateralTokenSet.has(position.vault.collateralToken.id)) {
        acc.collateralTokenSet.add(position.vault.collateralToken.id);
        acc.uniqueCollateralTokens.push({
          address: position.vault.collateralToken.id,
          decimals: position.vault.collateralToken.decimals,
        });
      }
      acc.totalSupplyContracts.push({
        address: position.vault.ape.id,
        abi: ApeContract.abi,
        functionName: "totalSupply" as const,
      });
      acc.vaultIds.push(fromHex(position.vault.id, "number"));
      return acc;
    },
    {
      collateralTokenSet: new Set<string>(),
      totalSupplyContracts: [] as {
        address: `0x${string}`;
        abi: typeof ApeContract.abi;
        functionName: "totalSupply";
      }[],
      vaultIds: [] as number[],
      uniqueCollateralTokens: [] as { address: string; decimals: number }[],
    },
  );

  // Fetch APE total supply and vault reserves in parallel
  const [apeTotalSupply, vaultReserves] = await Promise.all([
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

  // Use optimized batch price fetching via Uniswap multicall
  // This replaces individual Alchemy/CoinGecko calls + fallbacks
  const decimalsMap = Object.fromEntries(
    uniqueCollateralTokens.map(t => [t.address, t.decimals])
  );

  const batchPrices = await caller.vault.getBatchCollateralPrices({
    collateralTokens: uniqueCollateralTokens.map(t => t.address),
    decimals: decimalsMap,
  });

  // Convert to existing format (Record<string, string>)
  const prices: Record<string, string> = {};
  Object.entries(batchPrices).forEach(([address, usdPrice]) => {
    prices[address] = usdPrice.toString();
  });

  console.log(`Fetched ${Object.keys(prices).length} collateral prices using batch endpoint`);

  const allPositions: Array<{
    vaultId: `0x${string}`;
    user: `0x${string}`;
    apeBalance: string;
    collateralToken: string;
    collateralSymbol?: string;
    debtToken?: string;
    debtSymbol?: string;
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
        balance,
        user,
        dollarTotal,
        collateralTotal,
        vault,
      },
      index,
    ) => {
      // Get vault state data
      const apeTotalSupplyInVault = BigInt(apeTotalSupply[index]?.result ?? 0n);
      const vaultCollateralReserves = vaultReserves[index]?.reserveApes ?? 0n;
      
      // Skip if vault has no supply or reserves
      if (apeTotalSupplyInVault === 0n || vaultCollateralReserves === 0n) return;
      
      // Step 1: Calculate user's share of vault collateral
      // User owns (balance / totalSupply) of the vault's collateral
      const userApeBalance = BigInt(balance);
      const userShareOfVaultCollateral =
        (userApeBalance * vaultCollateralReserves) / apeTotalSupplyInVault;
      
      // Step 2: Apply leverage adjustment to get net position
      // Higher leverage tiers have higher fees, reducing net collateral
      // Formula: 10000 + (2^leverageTier * baseFeeInBasisPoints)
      const leverageFeeMultiplier = BigInt(10000 + 2 ** vault.leverageTier * baseFeeInBasisPoints);
      const netCollateralAfterFees =
        (userShareOfVaultCollateral * 10000n) / leverageFeeMultiplier;
      
      // Step 3: Convert positions to human-readable numbers
      const currentCollateralAmount = +formatUnits(
        netCollateralAfterFees,
        vault.collateralToken.decimals,
      );
      // collateralTotal is a BigInt string from the subgraph (in smallest units)
      // Need to format it with the proper decimals
      const originalCollateralDeposited = +formatUnits(
        BigInt(collateralTotal),
        vault.collateralToken.decimals,
      );

      // Step 4: Calculate USD values using current market prices
      const currentTokenPrice = +(prices[vault.collateralToken.id] ?? "0");
      const currentPositionValueUsd = currentCollateralAmount * currentTokenPrice;
      // dollarTotal is now a BigDecimal string from the subgraph
      const originalDepositValueUsd = parseFloat(dollarTotal);
      
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
        vaultId: vault.id,
        apeBalance: formatUnits(userApeBalance, vault.ape.decimals),
        collateralToken: vault.collateralToken.id,
        collateralSymbol: vault.collateralToken.symbol ?? undefined,
        debtToken: vault.debtToken.id,
        debtSymbol: vault.debtToken.symbol ?? undefined,
        pnlUsd,
        pnlUsdPercentage,
        pnlCollateral,
        pnlCollateralPercentage,
        leverageTier: vault.leverageTier,
        netCollateralPosition: currentPositionValueUsd,
        dollarTotal: originalDepositValueUsd,
        collateralTotal: originalCollateralDeposited.toString(),
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
