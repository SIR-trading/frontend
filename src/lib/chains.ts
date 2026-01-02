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
  wrappedToken: {
    symbol: string;
    name: string;
  };
  auctionBidIncreasePercentage: number; // e.g., 1 for 1%, 5 for 5%
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
    wrappedToken: {
      symbol: "WETH",
      name: "Wrapped Ether",
    },
    auctionBidIncreasePercentage: 1, // 1% for mainnet
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
    wrappedToken: {
      symbol: "WETH",
      name: "Wrapped Ether",
    },
    auctionBidIncreasePercentage: 1, // 1% for sepolia
  },
  998: {
    id: 998,
    name: "HyperEVM Testnet",
    alchemyPrefix: "", // HyperEVM doesn't use Alchemy - RPC_URL must be provided
    explorerUrl: "https://testnet.purrsec.com",
    nativeCurrency: {
      name: "HYPE",
      symbol: "HYPE",
      decimals: 18,
    },
    wrappedToken: {
      symbol: "WHYPE",
      name: "Wrapped HYPE",
    },
    auctionBidIncreasePercentage: 5, // 5% for testnet
  },
  999: {
    id: 999,
    name: "HyperEVM",
    alchemyPrefix: "", // HyperEVM doesn't use Alchemy - RPC_URL must be provided
    explorerUrl: "https://hyperevmscan.io",
    nativeCurrency: {
      name: "HYPE",
      symbol: "HYPE",
      decimals: 18,
    },
    wrappedToken: {
      symbol: "WHYPE",
      name: "Wrapped HYPE",
    },
    auctionBidIncreasePercentage: 5, // 5% for non-mainnet
  },
  6343: {
    id: 6343,
    name: "MegaETH Testnet",
    alchemyPrefix: "https://megaeth-testnet.g.alchemy.com/v2/",
    explorerUrl: "https://megaeth-testnet-v2.blockscout.com",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    wrappedToken: {
      symbol: "WETH",
      name: "Wrapped Ether",
    },
    auctionBidIncreasePercentage: 5, // 5% for testnet
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

export function getWrappedTokenSymbol(chainId?: number): string {
  const targetChainId = chainId ?? parseInt(env.NEXT_PUBLIC_CHAIN_ID);
  const config = CHAIN_CONFIGS[targetChainId];
  
  return config?.wrappedToken.symbol ?? "WETH";
}

export function getWrappedTokenName(chainId?: number): string {
  const targetChainId = chainId ?? parseInt(env.NEXT_PUBLIC_CHAIN_ID);
  const config = CHAIN_CONFIGS[targetChainId];
  
  return config?.wrappedToken.name ?? "Wrapped Ether";
}

export function getNativeCurrencySymbol(chainId?: number): string {
  const targetChainId = chainId ?? parseInt(env.NEXT_PUBLIC_CHAIN_ID);
  const config = CHAIN_CONFIGS[targetChainId];
  
  return config?.nativeCurrency.symbol ?? "ETH";
}

export function getAuctionBidIncreasePercentage(chainId?: number): number {
  const targetChainId = chainId ?? parseInt(env.NEXT_PUBLIC_CHAIN_ID);
  const config = CHAIN_CONFIGS[targetChainId];

  return config?.auctionBidIncreasePercentage ?? 1;
}

export function getDexName(chainId?: number): string {
  const targetChainId = chainId ?? parseInt(env.NEXT_PUBLIC_CHAIN_ID);
  // HyperEVM chains use HyperSwap
  if (targetChainId === 998 || targetChainId === 999) {
    return "HyperSwap";
  }
  // MegaETH uses Uni v3 clone
  if (targetChainId === 6343) {
    return "Uni v3 clone";
  }
  // All other chains use Uniswap v3
  return "Uniswap v3";
}

export function getAlchemyChainString(chainId?: number): string {
  const targetChainId = chainId ?? parseInt(env.NEXT_PUBLIC_CHAIN_ID);

  // Map chain IDs to Alchemy chain strings
  switch (targetChainId) {
    case 1:
      return "eth-mainnet";
    case 11155111:
      return "eth-sepolia";
    case 998:
      // HyperEVM testnet - Alchemy might not support it yet
      return "hyperliquid-mainnet"; // Try using mainnet API for testnet
    case 999:
      return "hyperliquid-mainnet";
    default:
      return "eth-mainnet";
  }
}

export function getCoinGeckoPlatformId(chainId?: number): string {
  const targetChainId = chainId ?? parseInt(env.NEXT_PUBLIC_CHAIN_ID);

  // Map chain IDs to CoinGecko platform IDs
  switch (targetChainId) {
    case 1:
      return "ethereum";
    case 11155111:
      return "ethereum"; // Sepolia uses ethereum platform
    case 998:
    case 999:
      return "hyperevm"; // CoinGecko platform ID for HyperEVM
    default:
      return "ethereum";
  }
}

export function shouldUseCoinGecko(chainId?: number): boolean {
  const targetChainId = chainId ?? parseInt(env.NEXT_PUBLIC_CHAIN_ID);
  // Use CoinGecko for HyperEVM chains
  return targetChainId === 998 || targetChainId === 999;
}

export function isHyperEVM(chainId?: number): boolean {
  const targetChainId = chainId ?? parseInt(env.NEXT_PUBLIC_CHAIN_ID);
  return targetChainId === 998 || targetChainId === 999;
}

/**
 * Returns true if native token bidding is supported on this chain.
 * Native bidding is available on all chains except Ethereum mainnet and Sepolia.
 */
export function supportsNativeTokenBidding(chainId?: number): boolean {
  const targetChainId = chainId ?? parseInt(env.NEXT_PUBLIC_CHAIN_ID);
  // Ethereum mainnet (1) and Sepolia (11155111) don't support native token bidding
  return targetChainId !== 1 && targetChainId !== 11155111;
}