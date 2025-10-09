import { useAccount, useReadContract, useReadContracts } from "wagmi";
import {
  NonfungiblePositionManagerContract,
  UniswapV3StakerContract,
} from "@/contracts/uniswapV3Staker";
import { SirContract } from "@/contracts/sir";
import { WrappedNativeTokenContract } from "@/contracts/weth";
import { UniswapV3PoolABI } from "@/contracts/uniswap-v3-pool";
import type { LpPosition } from "../types";
import { useMemo, useCallback } from "react";
import type { Address } from "viem";
import { keccak256, encodeAbiParameters, parseAbiParameters } from "viem";
import buildData from "@/../public/build-data.json";
import { api } from "@/trpc/react";
import { useSirPrice } from "@/contexts/SirPriceContext";
import {
  getCurrentActiveIncentives,
  type IncentiveKey,
} from "@/data/uniswapIncentives";

// Get the SIR/WETH 1% pool address from build data
const SIR_WETH_POOL_ADDRESS = buildData.contractAddresses
  .sirWethPool1Percent as `0x${string}`;
const TARGET_FEE = 10000; // 1% = 10000 (fee is in hundredths of a bip)

// Generate a unique ID for an incentive key (for display/mapping)
function getIncentiveId(incentive: IncentiveKey): string {
  return `${incentive.rewardToken}-${incentive.pool}-${incentive.startTime}-${incentive.endTime}`;
}

// Compute the keccak256 hash of an incentive key (for contract calls)
function computeIncentiveId(incentive: IncentiveKey): `0x${string}` {
  // The incentive ID is the keccak256 hash of the ABI-encoded incentive key
  // Must encode as a tuple to match Solidity's abi.encode(key)
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

// Uniswap V3 Math Functions
const Q96 = 2n ** 96n;

// Simplified tick to sqrtPriceX96 conversion using the standard formula
function tickToSqrtPriceX96(tick: number): bigint {
  // sqrt(1.0001^tick) * 2^96
  // We use the approximation: sqrtPriceX96 = 2^96 * 1.0001^(tick/2)
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
    // All liquidity is in token0
    amount0 =
      (liquidity * Q96 * (sqrtRatioBX96 - sqrtRatioAX96)) /
      sqrtRatioBX96 /
      sqrtRatioAX96;
  } else if (currentTick >= tickUpper) {
    // All liquidity is in token1
    amount1 = (liquidity * (sqrtRatioBX96 - sqrtRatioAX96)) / Q96;
  } else {
    // Liquidity is active, split between both tokens
    amount0 =
      (liquidity * Q96 * (sqrtRatioBX96 - sqrtPriceX96)) /
      sqrtRatioBX96 /
      sqrtPriceX96;
    amount1 = (liquidity * (sqrtPriceX96 - sqrtRatioAX96)) / Q96;
  }

  return { amount0, amount1 };
}

/**
 * Hook to fetch all user's Uniswap V3 LP positions
 * Filters for SIR/WETH 1% pool only
 */
export function useUserLpPositions() {
  const { address } = useAccount();
  const { sirPrice, isLoading: isSirPriceLoading } = useSirPrice();

  // Get WETH price
  const {
    data: wethPrice,
    isLoading: isWethPriceLoading,
    isFetching: isWethPriceFetching
  } = api.price.getTokenPriceWithFallback.useQuery(
    {
      tokenAddress: WrappedNativeTokenContract.address,
      tokenDecimals: 18,
    },
    {
      staleTime: 60000, // Cache for 1 minute
    },
  );

  // Get current tick and sqrtPriceX96 from the SIR/WETH pool
  const {
    data: slot0Data,
    isLoading: isSlot0Loading,
    isFetching: isSlot0Fetching
  } = useReadContract({
    address: SIR_WETH_POOL_ADDRESS,
    abi: UniswapV3PoolABI,
    functionName: "slot0",
    query: {
      staleTime: 60000, // Cache for 1 minute
    },
  });

  const currentTick = slot0Data ? slot0Data[1] : 0;
  const sqrtPriceX96 = slot0Data ? slot0Data[0] : 0n;

  // Get user's NFT balance
  const {
    data: balance,
    isLoading: isLoadingBalance,
    refetch: refetchUserBalance,
  } = useReadContract({
    ...NonfungiblePositionManagerContract,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
    },
  });

  // Also get staker's NFT balance (for staked positions)
  const {
    data: stakerBalance,
    isLoading: isLoadingStakerBalance,
    refetch: refetchStakerBalance,
  } = useReadContract({
    ...NonfungiblePositionManagerContract,
    functionName: "balanceOf",
    args: [UniswapV3StakerContract.address],
    query: {
      enabled: Boolean(address),
    },
  });

  // Get all token IDs owned by user AND staker contract
  const tokenIdContracts = useMemo(() => {
    const contracts = [];

    // User's own positions
    if (balance && balance > 0n && address) {
      for (let i = 0; i < Number(balance); i++) {
        contracts.push({
          ...NonfungiblePositionManagerContract,
          functionName: "tokenOfOwnerByIndex" as const,
          args: [address, BigInt(i)] as const,
        });
      }
    }

    // Staker's positions (we'll filter for user's later)
    if (stakerBalance && stakerBalance > 0n) {
      for (let i = 0; i < Number(stakerBalance); i++) {
        contracts.push({
          ...NonfungiblePositionManagerContract,
          functionName: "tokenOfOwnerByIndex" as const,
          args: [UniswapV3StakerContract.address, BigInt(i)] as const,
        });
      }
    }

    return contracts;
  }, [balance, stakerBalance, address]);

  const {
    data: tokenIdsData,
    isLoading: isLoadingTokenIds,
    refetch: refetchTokenIds,
  } = useReadContracts({
    contracts: tokenIdContracts,
    query: {
      enabled: tokenIdContracts.length > 0,
    },
  });

  const tokenIds = useMemo(() => {
    if (!tokenIdsData) return [];
    return tokenIdsData
      .map((result) => result.result)
      .filter((id): id is bigint => id !== undefined);
  }, [tokenIdsData]);

  // Get active incentives
  const activeIncentives = useMemo(() => {
    const incentives = getCurrentActiveIncentives();
    const now = Math.floor(Date.now() / 1000);
    incentives.forEach((incentive, index) => {
      const hash = computeIncentiveId(incentive);
      const startTime = Number(incentive.startTime);
      const endTime = Number(incentive.endTime);
    });
    return incentives;
  }, []);

  // Fetch incentive data for all active incentives
  const incentiveContracts = useMemo(() => {
    return activeIncentives.map((incentive) => ({
      ...UniswapV3StakerContract,
      functionName: "incentives" as const,
      args: [computeIncentiveId(incentive)] as const,
    }));
  }, [activeIncentives]);

  const {
    data: incentivesData,
    isLoading: isIncentivesLoading,
    isFetching: isIncentivesFetching
  } = useReadContracts({
    contracts: incentiveContracts,
    query: {
      enabled: incentiveContracts.length > 0,
      staleTime: 60000, // Cache for 1 minute
    },
  });

  // Fetch position details for all token IDs
  // For each tokenId, we fetch: positions, deposits, and stakes for each active incentive
  const positionContracts = useMemo(() => {
    return tokenIds.flatMap((tokenId) => [
      // 1. Position data from NonfungiblePositionManager
      {
        ...NonfungiblePositionManagerContract,
        functionName: "positions" as const,
        args: [tokenId] as const,
      },
      // 2. Deposit data from UniswapV3Staker
      {
        ...UniswapV3StakerContract,
        functionName: "deposits" as const,
        args: [tokenId] as const,
      },
      // 3. Stakes data for each active incentive
      ...activeIncentives.map((incentive) => ({
        ...UniswapV3StakerContract,
        functionName: "stakes" as const,
        args: [tokenId, computeIncentiveId(incentive)] as const,
      })),
    ]);
  }, [tokenIds, activeIncentives]);

  const {
    data: positionsData,
    isLoading: isLoadingPositions,
    refetch: refetchPositions,
  } = useReadContracts({
    contracts: positionContracts,
    query: {
      enabled: positionContracts.length > 0,
    },
  });

  // Process positions and filter for SIR/WETH 1% pool
  const { unstakedPositions, stakedPositions, globalStakingStats } =
    useMemo(() => {
      // Check if all required data for calculations is available
      if (!positionsData || !sirPrice || !wethPrice || !sqrtPriceX96) {
        return {
          unstakedPositions: [],
          stakedPositions: [],
          globalStakingStats: {
            totalValueStakedUsd: 0,
            inRangeValueStakedUsd: 0,
          },
        };
      }

      const unstaked: LpPosition[] = [];
      const staked: LpPosition[] = [];

      // Track all staked positions globally (for TVL calculation)
      let totalValueStakedUsd = 0;
      let inRangeValueStakedUsd = 0;

      // Calculate the number of calls per token ID
      const callsPerToken = 2 + activeIncentives.length; // positions + deposits + (stakes per incentive)

      for (let i = 0; i < tokenIds.length; i++) {
        const baseIndex = i * callsPerToken;
        const positionIndex = baseIndex;
        const depositIndex = baseIndex + 1;
        const stakesStartIndex = baseIndex + 2;

        const positionResult = positionsData[positionIndex];
        const depositResult = positionsData[depositIndex];

        if (!positionResult?.result || !depositResult?.result) continue;

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

        const deposit = depositResult.result as readonly [
          Address, // owner
          number, // numberOfStakes (uint48)
          number, // tickLower
          number, // tickUpper
        ];

        const [, , token0, token1, fee, tickLower, tickUpper, liquidity] =
          position;
        const [depositOwner, numberOfStakes] = deposit;

        // Filter out closed positions (positions with no liquidity)
        if (liquidity === 0n) continue;

        // Filter for SIR/WETH 1% positions only
        const isSirToken0 =
          token0.toLowerCase() === SirContract.address.toLowerCase();
        const isSirToken1 =
          token1.toLowerCase() === SirContract.address.toLowerCase();
        const isWethToken0 =
          token0.toLowerCase() ===
          WrappedNativeTokenContract.address.toLowerCase();
        const isWethToken1 =
          token1.toLowerCase() ===
          WrappedNativeTokenContract.address.toLowerCase();
        const isSirWethPair =
          (isSirToken0 && isWethToken1) || (isSirToken1 && isWethToken0);
        const isTargetFee = fee === TARGET_FEE;

        if (!isSirWethPair || !isTargetFee) continue;

        // Check if position is staked by the current user
        const isStaked =
          depositOwner !== "0x0000000000000000000000000000000000000000" &&
          Number(numberOfStakes) > 0;
        const isStakedByUser = address
          ? isStaked && depositOwner.toLowerCase() === address.toLowerCase()
          : false;
        const isOwnedByUser = address
          ? !isStaked &&
            (depositOwner === "0x0000000000000000000000000000000000000000" ||
              depositOwner.toLowerCase() === address.toLowerCase())
          : false;

        // Build position object
        const currentTokenId = tokenIds[i];
        if (!currentTokenId) continue;

        // Calculate if position is in range
        const isInRange = currentTick >= tickLower && currentTick < tickUpper;

        // Extract stakes data for each active incentive
        const stakesPerIncentive = new Map<string, bigint>();
        const missingIncentives: IncentiveKey[] = [];

        for (let j = 0; j < activeIncentives.length; j++) {
          const stakeIndex = stakesStartIndex + j;
          const stakeResult = positionsData[stakeIndex];
          const incentive = activeIncentives[j];

          if (!incentive) continue;

          const incentiveId = getIncentiveId(incentive);

          if (stakeResult?.result) {
            // stakes returns (secondsPerLiquidityInsideInitialX128, liquidity) in that order!
            const stakeData = stakeResult.result as readonly [bigint, bigint];
            const stakedLiquidity = stakeData[1]; // liquidity is the SECOND return value (index 1)

            stakesPerIncentive.set(incentiveId, stakedLiquidity);

            // If liquidity is 0, position is not staked in this incentive
            if (stakedLiquidity === 0n) {
              missingIncentives.push(incentive);
            }
          } else {
            // If we couldn't fetch stakes, assume it's missing
            missingIncentives.push(incentive);
          }
        }

        // Calculate accurate USD value using Uniswap V3 math
        let positionValueUsd = 0;
        if (sirPrice && wethPrice && liquidity > 0n && sqrtPriceX96 > 0n) {
          // Calculate actual token amounts from the liquidity
          const { amount0, amount1 } = getTokenAmountsFromLiquidity(
            liquidity,
            sqrtPriceX96,
            tickLower,
            tickUpper,
            currentTick,
          );

          // Determine which token is SIR and which is WETH based on addresses
          // token0 should be the lower address alphabetically
          const sirIsToken0 = isSirToken0;

          // Calculate USD value based on which token is which
          if (sirIsToken0) {
            // token0 is SIR (12 decimals), token1 is WETH (18 decimals)
            const sirAmount = Number(amount0) / 1e12; // SIR has 12 decimals
            const wethAmount = Number(amount1) / 1e18; // WETH has 18 decimals
            positionValueUsd = sirAmount * sirPrice + wethAmount * wethPrice;
          } else {
            // token0 is WETH (18 decimals), token1 is SIR (12 decimals)
            const wethAmount = Number(amount0) / 1e18; // WETH has 18 decimals
            const sirAmount = Number(amount1) / 1e12; // SIR has 12 decimals
            positionValueUsd = sirAmount * sirPrice + wethAmount * wethPrice;
          }
        }

        const lpPosition: LpPosition = {
          tokenId: currentTokenId,
          owner: isStaked
            ? depositOwner
            : address ??
              ("0x0000000000000000000000000000000000000000" as Address),
          token0,
          token1,
          fee,
          tickLower,
          tickUpper,
          liquidity,
          isStaked,
          numberOfStakes: Number(numberOfStakes),
          valueUsd: positionValueUsd,
          rewardsSir: 0n, // Will be fetched later for staked positions
          isInRange,
          stakesPerIncentive,
          missingIncentives,
        };

        // Track global staking stats for ALL staked positions
        if (isStaked && positionValueUsd > 0) {
          totalValueStakedUsd += positionValueUsd;
          if (isInRange) {
            inRangeValueStakedUsd += positionValueUsd;
          }
        }

        // Categorize user positions based on stake status and incentive participation
        // "LP Positions" card: unstaked OR missing some incentives (for completing stake)
        // "Staked LP Positions" card: in staker contract (for unstaking)
        if (isStakedByUser) {
          // Position is in staker contract - always show in "Staked" for unstaking option
          staked.push(lpPosition);

          // If missing some incentives, also show in "LP Positions" to allow completing the stake
          if (missingIncentives.length > 0) {
            unstaked.push(lpPosition);
          }
        } else if (isOwnedByUser) {
          // Not in staker contract at all - only show in "LP Positions"
          unstaked.push(lpPosition);
        }
      }

      return {
        unstakedPositions: unstaked,
        stakedPositions: staked,
        globalStakingStats: {
          totalValueStakedUsd,
          inRangeValueStakedUsd,
        },
      };
    }, [
      positionsData,
      tokenIds,
      address,
      currentTick,
      sqrtPriceX96,
      sirPrice,
      wethPrice,
      activeIncentives,
    ]);

  // Calculate staking APR from incentive data
  const stakingApr = useMemo(() => {
    // Need all required data - return null only when we're sure there's no APR to calculate
    // If data is still loading, this will naturally return null which shows as "TBD"
    if (
      !sirPrice ||
      !sqrtPriceX96 ||
      !wethPrice ||
      globalStakingStats.inRangeValueStakedUsd === 0 ||
      activeIncentives.length === 0
    ) {
      return null;
    }

    let totalSirPerSecond = 0;

    // Sum up SIR per second across all active incentives
    for (const incentive of activeIncentives) {
      // Use the original total rewards from the incentive configuration
      // NOT totalRewardUnclaimed which decreases as users claim
      const totalRewardSir = Number(incentive.rewards) / 1e12;

      // Calculate duration in seconds
      const startTime = Number(incentive.startTime);
      const endTime = Number(incentive.endTime);
      const duration = endTime - startTime;

      if (duration <= 0) continue;

      // Calculate SIR per second for this incentive based on original allocation
      const sirPerSecond = totalRewardSir / duration;
      totalSirPerSecond += sirPerSecond;
    }

    if (totalSirPerSecond === 0) return null;

    // Convert to USD per second
    const usdPerSecond = totalSirPerSecond * sirPrice;

    // Calculate annual USD (seconds in a year)
    const annualUsd = usdPerSecond * 31536000;

    // Calculate APR as percentage
    const apr = (annualUsd / globalStakingStats.inRangeValueStakedUsd) * 100;

    return apr;
  }, [
    activeIncentives,
    sirPrice,
    sqrtPriceX96,
    wethPrice,
    globalStakingStats.inRangeValueStakedUsd,
  ]);

  // Fetch rewards for the user (single call)
  const { data: userRewards, refetch: refetchRewards } = useReadContract({
    ...UniswapV3StakerContract,
    functionName: "rewards",
    args: address ? [SirContract.address, address] : undefined,
    query: {
      enabled: Boolean(address),
    },
  });

  // Update positions with rewards (distribute to all positions for display)
  const stakedPositionsWithRewards = useMemo(() => {
    const totalRewards = userRewards ?? 0n;
    // For display purposes, we'll show total rewards on first position
    return stakedPositions.map((position, i) => ({
      ...position,
      rewardsSir: i === 0 ? totalRewards : 0n,
    }));
  }, [stakedPositions, userRewards]);

  // Check if we have staked positions but haven't calculated their value yet
  // This detects the race condition where positions exist but prices aren't ready
  const hasUncalculatedPositions =
    stakerBalance !== undefined &&
    stakerBalance > 0n &&
    globalStakingStats.totalValueStakedUsd === 0 &&
    (!sirPrice || !wethPrice || !sqrtPriceX96);

  // Check if essential data is still loading or fetching
  // We need to check both isLoading (initial load) and isFetching (refetch/refresh)
  const essentialDataLoading =
    isSirPriceLoading ||
    isWethPriceLoading ||
    isWethPriceFetching ||
    isSlot0Loading ||
    isSlot0Fetching ||
    (incentiveContracts.length > 0 && (isIncentivesLoading || isIncentivesFetching)) ||
    !sirPrice ||
    !wethPrice ||
    !slot0Data ||
    (incentiveContracts.length > 0 && !incentivesData);

  const isLoading =
    isLoadingBalance ||
    isLoadingStakerBalance ||
    (tokenIdContracts.length > 0 && isLoadingTokenIds) ||
    (positionContracts.length > 0 && isLoadingPositions) ||
    essentialDataLoading ||
    hasUncalculatedPositions;

  // Combined refetch function to refresh all data
  const refetchAll = useCallback(async () => {
    // Refetch in order - balances first, then token IDs, then positions
    await Promise.all([refetchUserBalance(), refetchStakerBalance()]);
    await refetchTokenIds();
    await refetchPositions();
    await refetchRewards();
  }, [
    refetchUserBalance,
    refetchStakerBalance,
    refetchTokenIds,
    refetchPositions,
    refetchRewards,
  ]);

  return {
    unstakedPositions,
    stakedPositions: stakedPositionsWithRewards,
    isLoading,
    globalStakingStats,
    userRewards: userRewards ?? 0n,
    refetchAll,
    stakingApr,
  };
}
