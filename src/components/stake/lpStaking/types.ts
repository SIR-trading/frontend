import type { IncentiveKey } from '@/data/uniswapIncentives';

export interface LpPosition {
  tokenId: bigint;
  owner: string;
  token0: string;
  token1: string;
  fee: number;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  isStaked: boolean;
  numberOfStakes: number;
  valueUsd: number;
  rewardsSir: bigint; // Accumulated rewards in SIR
  isInRange: boolean; // Whether position is currently active/in-range
  stakesPerIncentive: Map<string, bigint>; // Map of incentive ID -> liquidity staked in that incentive
  missingIncentives: IncentiveKey[]; // Incentives this position is not yet participating in
}
