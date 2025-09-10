import { env } from "@/env";

export interface ChainConfig {
  id: number;
  name: string;
  alchemyPrefix: string;
  explorerUrl: string;
  explorerApiUrl?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  1: {
    id: 1,
    name: "Ethereum Mainnet",
    alchemyPrefix: "https://eth-mainnet.g.alchemy.com/v2/",
    explorerUrl: "https://etherscan.io",
    explorerApiUrl: "https://api.etherscan.io/api",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  11155111: {
    id: 11155111,
    name: "Sepolia",
    alchemyPrefix: "https://eth-sepolia.g.alchemy.com/v2/",
    explorerUrl: "https://sepolia.etherscan.io",
    explorerApiUrl: "https://api-sepolia.etherscan.io/api",
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  998: {
    id: 998,
    name: "HyperEVM Testnet",
    alchemyPrefix: "", // HyperEVM doesn't use Alchemy - RPC_URL must be provided
    explorerUrl: "https://testnet.explorer.hyperliquid.xyz",
    nativeCurrency: {
      name: "HYPE",
      symbol: "HYPE",
      decimals: 18,
    },
  },
  999: {
    id: 999,
    name: "HyperEVM",
    alchemyPrefix: "", // HyperEVM doesn't use Alchemy - RPC_URL must be provided
    explorerUrl: "https://explorer.hyperliquid.xyz",
    nativeCurrency: {
      name: "HYPE",
      symbol: "HYPE",
      decimals: 18,
    },
  },
};

export function getCurrentChainConfig(): ChainConfig {
  const chainId = parseInt(env.NEXT_PUBLIC_CHAIN_ID);
  const config = CHAIN_CONFIGS[chainId];
  
  if (!config) {
    throw new Error(`Chain configuration not found for chain ID: ${chainId}`);
  }
  
  return config;
}

export function getRpcUrl(): string {
  return env.RPC_URL;
}

export function getExplorerUrl(chainId?: number): string {
  const targetChainId = chainId ?? parseInt(env.NEXT_PUBLIC_CHAIN_ID);
  const config = CHAIN_CONFIGS[targetChainId];
  
  if (!config) {
    throw new Error(`Chain configuration not found for chain ID: ${targetChainId}`);
  }
  
  return config.explorerUrl;
}

export function getChainName(chainId?: number): string {
  const targetChainId = chainId ?? parseInt(env.NEXT_PUBLIC_CHAIN_ID);
  const config = CHAIN_CONFIGS[targetChainId];
  
  return config?.name ?? `Chain ${targetChainId}`;
}