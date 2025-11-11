import type { Address } from "viem";
import { env } from "@/env";

export interface IncentiveKey {
  rewardToken: Address;
  pool: Address; // SIR/WETH 1% pool address
  startTime: bigint;
  endTime: bigint;
  refundee: Address;
  rewards: bigint; // Total rewards allocated to this incentive (in SIR with 12 decimals)
}

/**
 * Incentive configuration without addresses (addresses come from contract files)
 */
export interface IncentiveConfig {
  startTime: bigint;
  endTime: bigint;
  refundee: Address;
  rewards: bigint; // Total rewards allocated to this incentive (in SIR with 12 decimals)
}

/**
 * Active incentives by chain ID (without rewardToken and pool - those are constant)
 *
 * To add a new incentive:
 * 1. Get the incentive parameters from the createIncentive transaction
 * 2. Add a new entry to the array for your chain with:
 *    - startTime: Unix timestamp when the incentive starts
 *    - endTime: Unix timestamp when the incentive ends
 *    - refundee: Address that can claim unclaimed rewards after end time
 *
 * Note: rewardToken and pool are automatically set from build-data.json at runtime
 */
export const INCENTIVES_BY_CHAIN: Record<number, IncentiveConfig[]> = {
  // Ethereum Mainnet
  1: [
    {
      startTime: 1759892400n,
      endTime: 1762574400n,
      refundee: "0x5000Ff6Cc1864690d947B864B9FB0d603E8d1F1A" as Address,
      rewards: 10000000000000n,
    },
    {
      startTime: 1760009400n,
      endTime: 1762691400n,
      refundee: "0x5000Ff6Cc1864690d947B864B9FB0d603E8d1F1A" as Address,
      rewards: 10000000000000000000n,
    },
    {
      startTime: 1762858000n,
      endTime: 1765446400n,
      refundee: "0x5000Ff6Cc1864690d947B864B9FB0d603E8d1F1A" as Address,
      rewards: 5229817701260795897n,
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
 * Get raw incentive configs for the current chain (without addresses)
 * Used by build script which provides addresses separately
 */
export function getChainIncentiveConfigs(): IncentiveConfig[] {
  const chainId = parseInt(env.NEXT_PUBLIC_CHAIN_ID);
  return INCENTIVES_BY_CHAIN[chainId] ?? [];
}

/**
 * Get incentives for the current chain (addresses must be provided by caller)
 * Used by build script during validation
 */
export function getChainIncentivesWithAddresses(
  sirAddress: Address,
  poolAddress: Address,
): IncentiveKey[] {
  const configs = getChainIncentiveConfigs();

  return configs.map((config) => ({
    rewardToken: sirAddress,
    pool: poolAddress,
    startTime: config.startTime,
    endTime: config.endTime,
    refundee: config.refundee,
    rewards: config.rewards,
  }));
}

/**
 * Get incentives for the current chain at runtime
 * This function requires build-data.json to exist
 *
 * Note: This is exported for use at runtime by components.
 * Do NOT use this in the build script - use getChainIncentiveConfigs() instead.
 */
function getChainIncentives(): IncentiveKey[] {
  // This file should only be used at runtime after build completes
  // At runtime, we can safely import files that depend on build-data.json

  // Dynamic imports will be resolved at runtime, not during build script execution
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const sirContract = require("@/contracts/sir") as {
    SirContract: { address: Address };
  };
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const buildData = require("@/../public/build-data.json") as {
    contractAddresses: { sir: Address; sirWethPool1Percent: Address };
  };

  const sirAddress = sirContract.SirContract.address;
  const poolAddress = buildData.contractAddresses.sirWethPool1Percent;

  return getChainIncentivesWithAddresses(sirAddress, poolAddress);
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
