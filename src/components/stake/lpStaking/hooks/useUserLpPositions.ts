import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { NonfungiblePositionManagerContract, UniswapV3StakerContract } from '@/contracts/uniswapV3Staker';
import { SirContract } from '@/contracts/sir';
import { WrappedNativeTokenContract } from '@/contracts/weth';
import { UniswapV3PoolABI } from '@/contracts/uniswap-v3-pool';
import type { LpPosition } from '../types';
import { useMemo } from 'react';
import type { Address } from 'viem';
import buildData from '@/../public/build-data.json';

// Get the SIR/WETH 1% pool address from build data
const SIR_WETH_POOL_ADDRESS = buildData.contractAddresses.sirWethPool1Percent as `0x${string}`;
const TARGET_FEE = 10000; // 1% = 10000 (fee is in hundredths of a bip)

/**
 * Hook to fetch all user's Uniswap V3 LP positions
 * Filters for SIR/WETH 1% pool only
 */
export function useUserLpPositions() {
  const { address } = useAccount();

  // Get current tick from the SIR/WETH pool
  const { data: slot0Data } = useReadContract({
    address: SIR_WETH_POOL_ADDRESS,
    abi: UniswapV3PoolABI,
    functionName: 'slot0',
    query: {
      staleTime: 5000, // Refresh every 5 seconds
    },
  });

  const currentTick = slot0Data ? slot0Data[1] : 0;

  // Get user's NFT balance
  const { data: balance, isLoading: isLoadingBalance } = useReadContract({
    ...NonfungiblePositionManagerContract,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
    },
  });

  // Get all token IDs owned by user
  const tokenIdContracts = useMemo(() => {
    if (!balance || balance === 0n || !address) return [];
    return Array.from({ length: Number(balance) }, (_, i) => ({
      ...NonfungiblePositionManagerContract,
      functionName: 'tokenOfOwnerByIndex' as const,
      args: [address, BigInt(i)] as const,
    }));
  }, [balance, address]);

  const { data: tokenIdsData, isLoading: isLoadingTokenIds } = useReadContracts({
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

  // Fetch position details for all token IDs
  const positionContracts = useMemo(() => {
    return tokenIds.flatMap((tokenId) => [
      {
        ...NonfungiblePositionManagerContract,
        functionName: 'positions' as const,
        args: [tokenId] as const,
      },
      {
        ...UniswapV3StakerContract,
        functionName: 'deposits' as const,
        args: [tokenId] as const,
      },
    ]);
  }, [tokenIds]);

  const { data: positionsData, isLoading: isLoadingPositions } = useReadContracts({
    contracts: positionContracts,
    query: {
      enabled: positionContracts.length > 0,
    },
  });

  // Process positions and filter for SIR/WETH 1% pool
  const { unstakedPositions, stakedPositions } = useMemo(() => {
    if (!positionsData || !address) {
      return { unstakedPositions: [], stakedPositions: [] };
    }

    const unstaked: LpPosition[] = [];
    const staked: LpPosition[] = [];

    for (let i = 0; i < tokenIds.length; i++) {
      const positionIndex = i * 2;
      const depositIndex = i * 2 + 1;

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

      const [, , token0, token1, fee, tickLower, tickUpper, liquidity] = position;
      const [depositOwner, numberOfStakes] = deposit;

      // Filter out closed positions (positions with no liquidity)
      if (liquidity === 0n) continue;

      // Filter for SIR/WETH 1% positions only
      const isSirToken0 = token0.toLowerCase() === SirContract.address.toLowerCase();
      const isSirToken1 = token1.toLowerCase() === SirContract.address.toLowerCase();
      const isWethToken0 = token0.toLowerCase() === WrappedNativeTokenContract.address.toLowerCase();
      const isWethToken1 = token1.toLowerCase() === WrappedNativeTokenContract.address.toLowerCase();
      const isSirWethPair = (isSirToken0 && isWethToken1) || (isSirToken1 && isWethToken0);
      const isTargetFee = fee === TARGET_FEE;

      if (!isSirWethPair || !isTargetFee) continue;

      // Check if position is staked
      const isStaked = depositOwner !== '0x0000000000000000000000000000000000000000' && Number(numberOfStakes) > 0;
      const isOwnedByUser = !isStaked && (depositOwner === '0x0000000000000000000000000000000000000000' || depositOwner === address);

      // Build position object
      const currentTokenId = tokenIds[i];
      if (!currentTokenId) continue;

      // Calculate if position is in range
      const isInRange = currentTick >= tickLower && currentTick < tickUpper;

      const lpPosition: LpPosition = {
        tokenId: currentTokenId,
        owner: isStaked ? depositOwner : address,
        token0,
        token1,
        fee,
        tickLower,
        tickUpper,
        liquidity,
        isStaked,
        numberOfStakes: Number(numberOfStakes),
        valueUsd: 0, // TODO: Calculate USD value
        rewardsSir: 0n, // TODO: Fetch rewards for staked positions
        isInRange,
      };

      if (isStaked) {
        staked.push(lpPosition);
      } else if (isOwnedByUser) {
        unstaked.push(lpPosition);
      }
    }

    return { unstakedPositions: unstaked, stakedPositions: staked };
  }, [positionsData, tokenIds, address, currentTick]);

  // Fetch rewards for staked positions
  const rewardContracts = useMemo(() => {
    if (!address) return [];
    return stakedPositions.map(() => ({
      ...UniswapV3StakerContract,
      functionName: 'rewards' as const,
      args: [SirContract.address, address] as const,
    }));
  }, [stakedPositions, address]);

  const { data: rewardsData } = useReadContracts({
    contracts: rewardContracts,
    query: {
      enabled: rewardContracts.length > 0,
    },
  });

  // Update positions with rewards
  const stakedPositionsWithRewards = useMemo(() => {
    if (!rewardsData) return stakedPositions;
    return stakedPositions.map((position, i) => ({
      ...position,
      rewardsSir: rewardsData[i]?.result ? rewardsData[i].result : 0n,
    }));
  }, [stakedPositions, rewardsData]);

  // Calculate total value locked (sum of all staked position values)
  const totalValueLockedUsd = useMemo(() => {
    return stakedPositionsWithRewards.reduce((sum, position) => sum + position.valueUsd, 0);
  }, [stakedPositionsWithRewards]);

  const isLoading = isLoadingBalance || isLoadingTokenIds || isLoadingPositions;

  return {
    unstakedPositions,
    stakedPositions: stakedPositionsWithRewards,
    isLoading,
    totalValueLockedUsd,
  };
}
