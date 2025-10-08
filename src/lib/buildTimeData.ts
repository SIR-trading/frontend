import { createPublicClient, http, type Address, keccak256, getAddress, encodePacked, encodeAbiParameters } from 'viem';
import { base } from 'viem/chains';
import type { TAddressString } from './types';
import { CHAIN_CONFIGS } from '@/config/chains';

// Load environment variables from .env file when running as a script
import { config } from 'dotenv';
config();

// Get environment variables directly for build script (avoids full env validation)
const RPC_URL = process.env.RPC_URL;
const ASSISTANT_ADDRESS = process.env.NEXT_PUBLIC_ASSISTANT_ADDRESS;
const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID ?? '1');

// Get chain configuration
const chainConfig = CHAIN_CONFIGS[CHAIN_ID];
if (!chainConfig) {
  throw new Error(`Chain configuration not found for chain ID: ${CHAIN_ID}`);
}

const UNIV3_STAKER_ADDRESS = chainConfig.contracts.uniswapV3Staker;
const UNIV3_FACTORY = chainConfig.contracts.uniswapV3Factory;
const POOL_INIT_CODE_HASH = chainConfig.contracts.uniswapV3PoolInitCodeHash;
const WRAPPED_NATIVE_TOKEN = chainConfig.wrappedNativeToken.address;

console.log('Environment variables:');
console.log('RPC_URL:', RPC_URL ? 'SET' : 'NOT SET');
console.log('ASSISTANT_ADDRESS:', ASSISTANT_ADDRESS ? 'SET' : 'NOT SET');
console.log('CHAIN_ID:', CHAIN_ID);
console.log('UNIV3_STAKER_ADDRESS:', UNIV3_STAKER_ADDRESS);

if (!ASSISTANT_ADDRESS) {
  throw new Error('NEXT_PUBLIC_ASSISTANT_ADDRESS environment variable is required');
}

if (!RPC_URL) {
  throw new Error('RPC_URL environment variable is required');
}

if (!UNIV3_STAKER_ADDRESS || UNIV3_STAKER_ADDRESS === '0x0000000000000000000000000000000000000000') {
  console.warn('⚠️  Uniswap V3 Staker address not configured for this chain');
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

const UNIV3_STAKER_ABI = [
  {
    type: "function",
    name: "nonfungiblePositionManager",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "contract INonfungiblePositionManager" }],
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
  uniswapV3Staker: TAddressString;
  nftPositionManager: TAddressString;
  sirWethPool1Percent: TAddressString;
}

/**
 * Computes the Uniswap V3 pool address deterministically using CREATE2
 */
function computePoolAddress(
  factory: Address,
  token0: Address,
  token1: Address,
  fee: number,
  initCodeHash: string
): Address {
  // Sort tokens (lower address first)
  const [sortedToken0, sortedToken1] = token0.toLowerCase() < token1.toLowerCase()
    ? [token0, token1]
    : [token1, token0];

  // Compute pool key hash (salt for CREATE2)
  // IMPORTANT: Uniswap V3 uses abi.encode (not encodePacked) for the salt
  const encoded = encodeAbiParameters(
    [
      { name: 'token0', type: 'address' },
      { name: 'token1', type: 'address' },
      { name: 'fee', type: 'uint24' }
    ],
    [getAddress(sortedToken0), getAddress(sortedToken1), fee]
  );
  const salt = keccak256(encoded);

  // Compute CREATE2 address
  // Formula: keccak256(abi.encodePacked(0xff, factory, salt, initCodeHash))
  const hash = keccak256(
    encodePacked(
      ['bytes1', 'address', 'bytes32', 'bytes32'],
      ['0xff', getAddress(factory), salt, initCodeHash as `0x${string}`]
    )
  );
  const poolAddress = getAddress(`0x${hash.slice(-40)}`);

  return poolAddress;
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
  const uniswapV3StakerAddress = UNIV3_STAKER_ADDRESS as Address;

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

    // Step 3: Get NFT Position Manager address from Uniswap V3 Staker contract (if available)
    let nftPositionManagerAddress: Address = '0x0000000000000000000000000000000000000000' as Address;
    if (UNIV3_STAKER_ADDRESS && UNIV3_STAKER_ADDRESS !== '0x0000000000000000000000000000000000000000') {
      try {
        nftPositionManagerAddress = await client.readContract({
          address: uniswapV3StakerAddress,
          abi: UNIV3_STAKER_ABI,
          functionName: 'nonfungiblePositionManager',
        });
      } catch (error) {
        console.warn('⚠️  Could not fetch NFT Position Manager address:', error);
      }
    }

    // Step 4: Compute SIR/WETH 1% pool address deterministically
    const poolFee = 10000; // 1% fee tier
    const sirWethPoolAddress = computePoolAddress(
      UNIV3_FACTORY as Address,
      sirAddress,
      WRAPPED_NATIVE_TOKEN as Address,
      poolFee,
      POOL_INIT_CODE_HASH
    );

    console.log('📊 Computed SIR/WETH 1% pool address:', sirWethPoolAddress);

    // Step 4: Get system parameters
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
      uniswapV3Staker: uniswapV3StakerAddress,
      nftPositionManager: nftPositionManagerAddress,
      sirWethPool1Percent: sirWethPoolAddress,
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
