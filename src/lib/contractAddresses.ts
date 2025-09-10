import { env } from "@/env";
import type { TAddressString } from "./types";
import { loadBuildTimeDataSync, loadBuildTimeData } from "./loadBuildTimeData";

export enum EContracts {
  "SIR",
  "ASSISTANT",
  "VAULT",
  "ORACLE",
  "SYSTEM_CONTROL",
}

/**
 * Get contract address synchronously (for server-side usage)
 */
export function getAddress(contract: EContracts): TAddressString {
  try {
    // Try to load from build-time data first
    const buildData = loadBuildTimeDataSync();
    
    switch (contract) {
      case EContracts.SIR:
        return buildData.contractAddresses.sir;
      case EContracts.ORACLE:
        return buildData.contractAddresses.oracle;
      case EContracts.ASSISTANT:
        return buildData.contractAddresses.assistant;
      case EContracts.VAULT:
        return buildData.contractAddresses.vault;
      case EContracts.SYSTEM_CONTROL:
        return buildData.contractAddresses.systemControl;
    }
  } catch (error) {
    // No fallbacks - if we can't get addresses from Assistant contract, something is wrong
    console.error('Failed to load build-time data from Assistant contract:', error);
    
    // Only Assistant address comes from env, all others must come from the contract
    if (contract === EContracts.ASSISTANT) {
      return env.NEXT_PUBLIC_ASSISTANT_ADDRESS as TAddressString;
    }
    
    throw new Error(`Failed to get address for ${EContracts[contract]} - build-time data from Assistant contract is required`);
  }
}

/**
 * Get contract address asynchronously (for client-side usage)
 */
export async function getAddressAsync(contract: EContracts): Promise<TAddressString> {
  try {
    const buildData = await loadBuildTimeData();
    
    switch (contract) {
      case EContracts.SIR:
        return buildData.contractAddresses.sir;
      case EContracts.ORACLE:
        return buildData.contractAddresses.oracle;
      case EContracts.ASSISTANT:
        return buildData.contractAddresses.assistant;
      case EContracts.VAULT:
        return buildData.contractAddresses.vault;
      case EContracts.SYSTEM_CONTROL:
        return buildData.contractAddresses.systemControl;
    }
  } catch (error) {
    console.warn('Failed to load build-time data, falling back to env vars:', error);
    return getAddress(contract);
  }
}
