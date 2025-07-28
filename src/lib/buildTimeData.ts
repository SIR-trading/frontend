import { createPublicClient, http, type Address } from 'viem';
import { base } from 'viem/chains';
import type { TAddressString } from './types';

// Load environment variables from .env file when running as a script
import { config } from 'dotenv';
config();

// Get environment variables directly for build script (avoids full env validation)
const RPC_URL = process.env.RPC_URL;
const ASSISTANT_ADDRESS = process.env.NEXT_PUBLIC_ASSISTANT_ADDRESS;

console.log('Environment variables:');
console.log('RPC_URL:', RPC_URL ? 'SET' : 'NOT SET');
console.log('ASSISTANT_ADDRESS:', ASSISTANT_ADDRESS ? 'SET' : 'NOT SET');

if (!ASSISTANT_ADDRESS) {
  throw new Error('NEXT_PUBLIC_ASSISTANT_ADDRESS environment variable is required');
}

if (!RPC_URL) {
  throw new Error('RPC_URL environment variable is required');
}

// Minimal ABI definitions needed for build-time data fetching
const ASSISTANT_ABI = [
  {
    type: "function",
    name: "VAULT",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "contract IVault" }],
    stateMutability: "view",
  },
] as const;

const VAULT_ABI = [
  {
    type: "function",
    name: "SIR",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "SYSTEM_CONTROL",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "ORACLE",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "contract Oracle" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "systemParams",
    inputs: [],
    outputs: [
      {
        name: "systemParams_",
        type: "tuple",
        internalType: "struct SirStructs.SystemParameters",
        components: [
          {
            name: "baseFee",
            type: "tuple",
            internalType: "struct SirStructs.FeeStructure",
            components: [
              { name: "fee", type: "uint16", internalType: "uint16" },
              { name: "feeNew", type: "uint16", internalType: "uint16" },
              {
                name: "timestampUpdate",
                type: "uint40",
                internalType: "uint40",
              },
            ],
          },
          {
            name: "lpFee",
            type: "tuple",
            internalType: "struct SirStructs.FeeStructure",
            components: [
              { name: "fee", type: "uint16", internalType: "uint16" },
              { name: "feeNew", type: "uint16", internalType: "uint16" },
              {
                name: "timestampUpdate",
                type: "uint40",
                internalType: "uint40",
              },
            ],
          },
          { name: "mintingStopped", type: "bool", internalType: "bool" },
          { name: "cumulativeTax", type: "uint16", internalType: "uint16" },
        ],
      },
    ],
    stateMutability: "view",
  },
] as const;

export interface ContractAddresses {
  assistant: TAddressString;
  vault: TAddressString;
  sir: TAddressString;
  systemControl: TAddressString;
  oracle: TAddressString;
}

export interface SystemParams {
  baseFee: number; // converted from basis points
  mintingFee: number; // converted from basis points  
  mintingStopped: boolean;
  cumulativeTax: number;
  lastUpdated: number;
}

export interface BuildTimeData {
  contractAddresses: ContractAddresses;
  systemParams: SystemParams;
  buildTimestamp: number;
}

/**
 * Fetches contract addresses and system parameters at build time
 * Only requires ASSISTANT_ADDRESS in environment variables
 */
export async function fetchBuildTimeData(): Promise<BuildTimeData> {
  // Create public client for Base network
  const client = createPublicClient({
    chain: base,
    transport: http(RPC_URL),
  });

  const assistantAddress = ASSISTANT_ADDRESS as Address;

  try {
    // Step 1: Get Vault address from Assistant contract
    const vaultAddress = await client.readContract({
      address: assistantAddress,
      abi: ASSISTANT_ABI,
      functionName: 'VAULT',
    });

    // Step 2: Get SIR, SystemControl, and Oracle addresses from Vault contract
    const [sirAddress, systemControlAddress, oracleAddress] = await Promise.all([
      client.readContract({
        address: vaultAddress,
        abi: VAULT_ABI,
        functionName: 'SIR',
      }),
      client.readContract({
        address: vaultAddress,
        abi: VAULT_ABI,
        functionName: 'SYSTEM_CONTROL',
      }),
      client.readContract({
        address: vaultAddress,
        abi: VAULT_ABI,
        functionName: 'ORACLE',
      }),
    ]);

    // Step 3: Get system parameters
    const systemParamsResult = await client.readContract({
      address: vaultAddress,
      abi: VAULT_ABI,
      functionName: 'systemParams',
    });

    const rawParams = systemParamsResult as {
      baseFee: { fee: number; feeNew: number; timestampUpdate: number };
      lpFee: { fee: number; feeNew: number; timestampUpdate: number };
      mintingStopped: boolean;
      cumulativeTax: number;
    };

    const contractAddresses: ContractAddresses = {
      assistant: assistantAddress,
      vault: vaultAddress,
      sir: sirAddress,
      systemControl: systemControlAddress,
      oracle: oracleAddress,
    };

    const systemParams: SystemParams = {
      baseFee: rawParams.baseFee.fee / 10000, // Convert from basis points (e.g., 250 -> 0.025 = 2.5%)
      mintingFee: rawParams.lpFee.fee / 10000, // Convert from basis points
      mintingStopped: rawParams.mintingStopped,
      cumulativeTax: rawParams.cumulativeTax,
      lastUpdated: Date.now(),
    };

    return {
      contractAddresses,
      systemParams,
      buildTimestamp: Date.now(),
    };
  } catch (error) {
    console.error('Failed to fetch build-time data:', error);
    throw new Error(`Build-time data fetching failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
