import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { NonfungiblePositionManagerContract, UniswapV3StakerContract } from "@/contracts/uniswapV3Staker";
import { SirContract } from "@/contracts/sir";
import { WrappedNativeTokenContract } from "@/contracts/weth";
import { UniswapV3PoolABI } from "@/contracts/uniswap-v3-pool";
import { getCurrentActiveIncentives, getAllChainIncentives } from "@/data/uniswapIncentives";
import type { Address } from "viem";
import { keccak256, encodeAbiParameters } from "viem";
import { multicall, readContract } from "@/lib/viemClient";
import buildData from "@/../public/build-data.json";

// Get the SIR/WETH 1% pool address from build data
const SIR_WETH_POOL_ADDRESS = buildData.contractAddresses.sirWethPool1Percent as `0x${string}`;
const TARGET_FEE = 10000; // 1% = 10000 (fee is in hundredths of a bip)


// Uniswap V3 Math Functions
const Q96 = 2n ** 96n;

function tickToSqrtPriceX96(tick: number): bigint {
  const tickBase = 1.0001;
  const sqrtPrice = Math.sqrt(Math.pow(tickBase, tick));
  return BigInt(Math.floor(sqrtPrice * Number(Q96)));
}

function getTokenAmountsFromLiquidity(
  liquidity: bigint,
  sqrtPriceX96: bigint,
  tickLower: number,
  tickUpper: number,
  currentTick: number,
): { amount0: bigint; amount1: bigint } {
  const sqrtRatioAX96 = tickToSqrtPriceX96(tickLower);
  const sqrtRatioBX96 = tickToSqrtPriceX96(tickUpper);

  let amount0 = 0n;
  let amount1 = 0n;

  if (currentTick < tickLower) {
    amount0 = (liquidity * Q96 * (sqrtRatioBX96 - sqrtRatioAX96)) / sqrtRatioBX96 / sqrtRatioAX96;
  } else if (currentTick >= tickUpper) {
    amount1 = (liquidity * (sqrtRatioBX96 - sqrtRatioAX96)) / Q96;
  } else {
    amount0 = (liquidity * Q96 * (sqrtRatioBX96 - sqrtPriceX96)) / sqrtRatioBX96 / sqrtPriceX96;
    amount1 = (liquidity * (sqrtPriceX96 - sqrtRatioAX96)) / Q96;
  }

  return { amount0, amount1 };
}

// Generate a unique ID for an incentive key (for display/mapping)
function getIncentiveId(incentive: { rewardToken: Address; pool: Address; startTime: bigint; endTime: bigint }): string {
  return `${incentive.rewardToken}-${incentive.pool}-${incentive.startTime}-${incentive.endTime}`;
}

// Compute the keccak256 hash of an incentive key (for contract calls)
function computeIncentiveId(incentive: { rewardToken: Address; pool: Address; startTime: bigint; endTime: bigint; refundee: Address }): `0x${string}` {
  const encoded = encodeAbiParameters(
    [
      {
        type: "tuple",
        components: [
          { name: "rewardToken", type: "address" },
          { name: "pool", type: "address" },
          { name: "startTime", type: "uint256" },
          { name: "endTime", type: "uint256" },
          { name: "refundee", type: "address" },
        ],
      },
    ],
    [
      {
        rewardToken: incentive.rewardToken,
        pool: incentive.pool,
        startTime: incentive.startTime,
        endTime: incentive.endTime,
        refundee: incentive.refundee,
      },
    ],
  );
  return keccak256(encoded);
}

// Cache for global stats (5 minute cache)
let globalStatsCache: {
  data: {
    totalValueStakedUsd: number;
    inRangeValueStakedUsd: number;
    incentiveStats: Record<string, { inRangeValueStakedUsd: number }>;
  };
  timestamp: number;
} | null = null;

const GLOBAL_STATS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface GlobalStatsInput {
  sirPrice: number;
  wethPrice: number;
}

export const lpStakingRouter = createTRPCRouter({
  getGlobalStats: publicProcedure
    .input((val: unknown) => val as GlobalStatsInput)
    .query(async ({ input }) => {
      const { sirPrice, wethPrice } = input;

      // Return cached data if available and not expired
      const now = Date.now();
      if (globalStatsCache && now - globalStatsCache.timestamp < GLOBAL_STATS_CACHE_DURATION) {
        return globalStatsCache.data;
      }

      // Get active incentives
      const activeIncentives = getCurrentActiveIncentives();
      const allIncentives = getAllChainIncentives();

      // Initialize incentive stats map
      const incentiveStatsMap: Record<string, { inRangeValueStakedUsd: number }> = {};
      activeIncentives.forEach((incentive) => {
        incentiveStatsMap[getIncentiveId(incentive)] = { inRangeValueStakedUsd: 0 };
      });

      // Get pool slot0 for current tick and price
      const slot0Data = await readContract({
        address: SIR_WETH_POOL_ADDRESS,
        abi: UniswapV3PoolABI,
        functionName: "slot0",
      });

      if (!slot0Data) {
        return {
          totalValueStakedUsd: 0,
          inRangeValueStakedUsd: 0,
          incentiveStats: incentiveStatsMap,
        };
      }

      const currentTick = slot0Data[1];
      const sqrtPriceX96 = slot0Data[0];

      // Get staker's NFT balance
      const stakerBalance = await readContract({
        address: NonfungiblePositionManagerContract.address,
        abi: NonfungiblePositionManagerContract.abi,
        functionName: "balanceOf",
        args: [UniswapV3StakerContract.address],
      });

      if (!stakerBalance || stakerBalance === 0n) {
        const result = {
          totalValueStakedUsd: 0,
          inRangeValueStakedUsd: 0,
          incentiveStats: incentiveStatsMap,
        };
        globalStatsCache = { data: result, timestamp: now };
        return result;
      }

      // Get all token IDs owned by staker
      const tokenIdContracts = [];
      for (let i = 0; i < Number(stakerBalance); i++) {
        tokenIdContracts.push({
          address: NonfungiblePositionManagerContract.address,
          abi: NonfungiblePositionManagerContract.abi,
          functionName: "tokenOfOwnerByIndex" as const,
          args: [UniswapV3StakerContract.address, BigInt(i)] as const,
        });
      }

      const tokenIdsData = await multicall({
        contracts: tokenIdContracts,
        allowFailure: true,
      });

      const tokenIds = tokenIdsData
        .map((result) => (result.status === "success" ? result.result : undefined))
        .filter((id): id is bigint => id !== undefined);

      if (tokenIds.length === 0) {
        const result = {
          totalValueStakedUsd: 0,
          inRangeValueStakedUsd: 0,
          incentiveStats: incentiveStatsMap,
        };
        globalStatsCache = { data: result, timestamp: now };
        return result;
      }

      // Get position details for all token IDs
      const callsPerToken = 2 + allIncentives.length;
      const positionContracts = tokenIds.flatMap((tokenId) => [
        {
          address: NonfungiblePositionManagerContract.address,
          abi: NonfungiblePositionManagerContract.abi,
          functionName: "positions" as const,
          args: [tokenId] as const,
        },
        {
          address: UniswapV3StakerContract.address,
          abi: UniswapV3StakerContract.abi,
          functionName: "deposits" as const,
          args: [tokenId] as const,
        },
        ...allIncentives.map((incentive) => ({
          address: UniswapV3StakerContract.address,
          abi: UniswapV3StakerContract.abi,
          functionName: "stakes" as const,
          args: [tokenId, computeIncentiveId(incentive)] as const,
        })),
      ]);

      const positionsData = await multicall({
        contracts: positionContracts,
        allowFailure: true,
      });

      // Process positions
      let totalValueStakedUsd = 0;
      let inRangeValueStakedUsd = 0;

      for (let i = 0; i < tokenIds.length; i++) {
        const baseIndex = i * callsPerToken;
        const positionIndex = baseIndex;
        const depositIndex = baseIndex + 1;
        const stakesStartIndex = baseIndex + 2;

        const positionResult = positionsData[positionIndex];
        const depositResult = positionsData[depositIndex];

        if (!positionResult || positionResult.status !== "success" || !depositResult || depositResult.status !== "success") continue;

        const position = positionResult.result as readonly [
          bigint, // nonce
          Address, // operator
          Address, // token0
          Address, // token1
          number, // fee
          number, // tickLower
          number, // tickUpper
          bigint, // liquidity
          bigint, // feeGrowthInside0LastX128
          bigint, // feeGrowthInside1LastX128
          bigint, // tokensOwed0
          bigint, // tokensOwed1
        ];

        const [, , token0, token1, fee, tickLower, tickUpper, liquidity] = position;

        // Filter out closed positions
        if (liquidity === 0n) continue;

        // Filter for SIR/WETH 1% positions only
        const isSirToken0 = token0.toLowerCase() === SirContract.address.toLowerCase();
        const isSirToken1 = token1.toLowerCase() === SirContract.address.toLowerCase();
        const isWethToken0 = token0.toLowerCase() === WrappedNativeTokenContract.address.toLowerCase();
        const isWethToken1 = token1.toLowerCase() === WrappedNativeTokenContract.address.toLowerCase();
        const isSirWethPair = (isSirToken0 && isWethToken1) || (isSirToken1 && isWethToken0);
        const isTargetFee = fee === TARGET_FEE;

        if (!isSirWethPair || !isTargetFee) continue;

        // Check if position is in range
        const isInRange = currentTick >= tickLower && currentTick < tickUpper;

        // Calculate USD value
        let positionValueUsd = 0;
        if (liquidity > 0n && sqrtPriceX96 > 0n) {
          const { amount0, amount1 } = getTokenAmountsFromLiquidity(
            liquidity,
            sqrtPriceX96,
            tickLower,
            tickUpper,
            currentTick,
          );

          const sirIsToken0 = isSirToken0;

          if (sirIsToken0) {
            const sirAmount = Number(amount0) / 1e12;
            const wethAmount = Number(amount1) / 1e18;
            positionValueUsd = sirAmount * sirPrice + wethAmount * wethPrice;
          } else {
            const wethAmount = Number(amount0) / 1e18;
            const sirAmount = Number(amount1) / 1e12;
            positionValueUsd = sirAmount * sirPrice + wethAmount * wethPrice;
          }
        }

        // Extract stakes data
        const stakesPerIncentive = new Map<string, bigint>();
        for (let j = 0; j < allIncentives.length; j++) {
          const stakeIndex = stakesStartIndex + j;
          const stakeResult = positionsData[stakeIndex];
          const incentive = allIncentives[j];

          if (!incentive || !stakeResult || stakeResult.status !== "success") continue;

          const incentiveId = getIncentiveId(incentive);
          const stakeData = stakeResult.result as readonly [bigint, bigint];
          const stakedLiquidity = stakeData[1];

          stakesPerIncentive.set(incentiveId, stakedLiquidity);
        }

        // Update global stats
        if (positionValueUsd > 0) {
          totalValueStakedUsd += positionValueUsd;
          if (isInRange) {
            inRangeValueStakedUsd += positionValueUsd;

            // Update per-incentive stats
            stakesPerIncentive.forEach((stakedLiquidity, incentiveId) => {
              const stats = incentiveStatsMap[incentiveId];
              if (stakedLiquidity > 0n && stats) {
                stats.inRangeValueStakedUsd += positionValueUsd;
              }
            });
          }
        }
      }

      const result = {
        totalValueStakedUsd,
        inRangeValueStakedUsd,
        incentiveStats: incentiveStatsMap,
      };

      // Cache the result
      globalStatsCache = { data: result, timestamp: now };

      return result;
    }),
});
