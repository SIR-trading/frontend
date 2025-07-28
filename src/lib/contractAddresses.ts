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
    // Fallback to environment variables (for backward compatibility during migration)
    console.warn('Failed to load build-time data, falling back to env vars:', error);
    
    switch (contract) {
      case EContracts.SIR:
        return (env.NEXT_PUBLIC_SIR_ADDRESS ?? '') as TAddressString;
      case EContracts.ORACLE:
        return (env.NEXT_PUBLIC_ORACLE_ADDRESS ?? '') as TAddressString;
      case EContracts.ASSISTANT:
        return env.NEXT_PUBLIC_ASSISTANT_ADDRESS as TAddressString;
      case EContracts.VAULT:
        return (env.NEXT_PUBLIC_VAULT_ADDRESS ?? '') as TAddressString;
      case EContracts.SYSTEM_CONTROL:
        return '' as TAddressString;
    }
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
