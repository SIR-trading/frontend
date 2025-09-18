import chainsConfig from './chains.json';

export interface ChainConfig {
  chainId: number;
  name: string;
  isTestnet: boolean;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorers: {
    default: {
      name: string;
      url: string;
    };
  };
  contracts: {
    uniswapV3Factory: string;
    uniswapV3PoolInitCodeHash: string;
  };
  coingecko: {
    platformId: string | null;
  };
  wrappedNativeToken: {
    address: string;
    symbol: string;
    name: string;
  };
}

// Type-safe chain configurations
export const CHAIN_CONFIGS: Record<number, ChainConfig> = chainsConfig as Record<number, ChainConfig>;

// Helper function to get chain config
export function getChainConfig(chainId: number): ChainConfig {
  const config = CHAIN_CONFIGS[chainId];
  if (!config) {
    throw new Error(`Chain configuration not found for chainId: ${chainId}`);
  }
  return config;
}

// Helper function to get current chain config based on environment
export function getCurrentChainConfig(): ChainConfig {
  const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID ?? '1');
  return getChainConfig(chainId);
}

// Export specific helpers for common use cases
export function getUniswapV3Factory(chainId: number): string {
  return getChainConfig(chainId).contracts.uniswapV3Factory;
}

export function getUniswapV3PoolInitCodeHash(chainId: number): string {
  return getChainConfig(chainId).contracts.uniswapV3PoolInitCodeHash;
}

export function getBlockExplorerUrl(chainId: number): string {
  return getChainConfig(chainId).blockExplorers.default.url;
}

export function getCoingeckoPlatformId(chainId: number): string | null {
  return getChainConfig(chainId).coingecko.platformId;
}

export function getWrappedNativeToken(chainId: number): { address: string; symbol: string; name: string } {
  return getChainConfig(chainId).wrappedNativeToken;
}

export function getWrappedNativeTokenAddress(chainId: number): string {
  return getChainConfig(chainId).wrappedNativeToken.address;
}

// Export all chain IDs for convenience
export const SUPPORTED_CHAIN_IDS = Object.keys(CHAIN_CONFIGS).map(id => parseInt(id));