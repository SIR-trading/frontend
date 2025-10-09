import type { Address } from "viem";
import { env } from "@/env";
import buildData from "../../public/build-data.json";

const SIR_ADDRESS = buildData.contractAddresses.sir as Address;
const SIR_WETH_POOL_1_PERCENT = buildData.contractAddresses
  .sirWethPool1Percent as Address;

export interface IncentiveKey {
  rewardToken: Address;
  pool: Address; // SIR/WETH 1% pool address
  startTime: bigint;
  endTime: bigint;
  refundee: Address;
}

/**
 * Active incentives by chain ID
 *
 * To add a new incentive:
 * 1. Get the incentive parameters from the createIncentive transaction
 * 2. Add a new entry to the array for your chain with:
 *    - rewardToken: Address of the reward token (usually SIR)
 *    - pool: Address of the SIR/WETH 1% Uniswap V3 pool
 *    - startTime: Unix timestamp when the incentive starts
 *    - endTime: Unix timestamp when the incentive ends
 *    - refundee: Address that can claim unclaimed rewards after end time
 */
export const INCENTIVES_BY_CHAIN: Record<number, IncentiveKey[]> = {
  // Ethereum Mainnet
  1: [
    {
      rewardToken: SIR_ADDRESS,
      pool: SIR_WETH_POOL_1_PERCENT,
      startTime: 1759892400n,
      endTime: 1762574400n,
      refundee: "0x5000Ff6Cc1864690d947B864B9FB0d603E8d1F1A" as Address,
    },
    {
      rewardToken: SIR_ADDRESS,
      pool: SIR_WETH_POOL_1_PERCENT,
      startTime: 1760009400n,
      endTime: 1762691400n,
      refundee: "0x5000Ff6Cc1864690d947B864B9FB0d603E8d1F1A" as Address,
    },
  ],

  // Sepolia Testnet
  11155111: [],

  // HyperEVM Testnet
  998: [],

  // HyperEVM Mainnet
  999: [],
};

/**
 * Get incentives for the current chain
 */
function getChainIncentives(): IncentiveKey[] {
  const chainId = parseInt(env.NEXT_PUBLIC_CHAIN_ID);
  return INCENTIVES_BY_CHAIN[chainId] ?? [];
}

/**
 * Get currently active incentives (filtered by current timestamp)
 * Only returns incentives where current time is between startTime and endTime
 */
export function getCurrentActiveIncentives(): IncentiveKey[] {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const chainIncentives = getChainIncentives();
  return chainIncentives.filter(
    (incentive) => incentive.startTime <= now && incentive.endTime >= now,
  );
}

/**
 * Check if any incentives are currently active
 */
export function hasActiveIncentives(): boolean {
  return getCurrentActiveIncentives().length > 0;
}

/**
 * Get the total number of active incentives
 */
export function getActiveIncentivesCount(): number {
  return getCurrentActiveIncentives().length;
}

/**
 * Get all incentives for the current chain (including inactive ones)
 */
export function getAllChainIncentives(): IncentiveKey[] {
  return getChainIncentives();
}
