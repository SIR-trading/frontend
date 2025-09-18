// Minimal Uniswap V3 Pool ABI for reading price data
export const UniswapV3PoolABI = [
  {
    inputs: [],
    name: "slot0",
    outputs: [
      { internalType: "uint160", name: "sqrtPriceX96", type: "uint160" },
      { internalType: "int24", name: "tick", type: "int24" },
      { internalType: "uint16", name: "observationIndex", type: "uint16" },
      { internalType: "uint16", name: "observationCardinality", type: "uint16" },
      { internalType: "uint16", name: "observationCardinalityNext", type: "uint16" },
      { internalType: "uint8", name: "feeProtocol", type: "uint8" },
      { internalType: "bool", name: "unlocked", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "liquidity",
    outputs: [{ internalType: "uint128", name: "", type: "uint128" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token0",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token1",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "fee",
    outputs: [{ internalType: "uint24", name: "", type: "uint24" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Uniswap V3 Factory addresses by chain ID
export const UNISWAP_V3_FACTORY_ADDRESSES: Record<number, string> = {
  1: "0x1F98431c8aD98523631AE4a59f267346ea31F984", // Ethereum Mainnet
  11155111: "0x0227628f3F023bb0B980b67D528571c95c6DaC1c", // Sepolia
  998: "0xB1c0fa0B789320044A6F623cFe5eBda9562602E3", // HyperEVM Mainnet
  999: "0x22B0768972bB7f1F5ea7a8740BB8f94b32483826", // HyperEVM Testnet
};

// Uniswap V3 Pool init code hashes by chain ID
export const UNISWAP_V3_POOL_INIT_CODE_HASHES: Record<number, string> = {
  1: "0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54", // Ethereum Mainnet
  11155111: "0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54", // Sepolia (same as mainnet)
  998: "0xe3572921be1688dba92df30c6781b8770499ff274d20ae9b325f4242634774fb", // HyperEVM Mainnet
  999: "0xe3572921be1688dba92df30c6781b8770499ff274d20ae9b325f4242634774fb", // HyperEVM Testnet
};

// Get factory address for a specific chain
export function getUniswapV3Factory(chainId: number): string {
  const factory = UNISWAP_V3_FACTORY_ADDRESSES[chainId];
  if (!factory) {
    throw new Error(`Uniswap V3 Factory not configured for chain ${chainId}`);
  }
  return factory;
}

// Get pool init code hash for a specific chain
export function getUniswapV3PoolInitCodeHash(chainId: number): string {
  const initCodeHash = UNISWAP_V3_POOL_INIT_CODE_HASHES[chainId];
  if (!initCodeHash) {
    throw new Error(`Uniswap V3 Pool init code hash not configured for chain ${chainId}`);
  }
  return initCodeHash;
}

// Common fee tiers (in basis points * 100)
export const FEE_TIERS = {
  LOWEST: 100, // 0.01%
  LOW: 500, // 0.05%
  MEDIUM: 3000, // 0.3%
  HIGH: 10000, // 1%
} as const;