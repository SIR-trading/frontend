import "server-only";
import { env } from "@/env";
import { getCurrentChainConfig, getRpcUrl } from "./chains";
// Don't let client use viem client
// Make all rpc calls on backend

import { createPublicClient, http, type Chain } from "viem";
import * as viemChains from "viem/chains";

const getChainId = () => {
  const result = env.NEXT_PUBLIC_CHAIN_ID;
  return parseInt(result);
};

const chainId = getChainId();
const chainConfig = getCurrentChainConfig();

// Map chain IDs to viem chain objects
const viemChainMap: Record<number, Chain> = {
  1: viemChains.mainnet,
  11155111: viemChains.sepolia,
  // HyperEVM chains will use custom chain config below
};

// Get the appropriate viem chain or create a custom one
const chain = viemChainMap[chainId] ?? {
  id: chainId,
  name: chainConfig.name,
  nativeCurrency: chainConfig.nativeCurrency,
  rpcUrls: {
    default: { http: [getRpcUrl()] },
    public: { http: [getRpcUrl()] },
  },
  blockExplorers: {
    default: { name: "Explorer", url: chainConfig.explorerUrl },
  },
};

const viemClient = createPublicClient({
  chain: chain,
  transport: http(getRpcUrl()),
});
export const readContract = viemClient.readContract;
export const simulateContract = viemClient.simulateContract;
export const multicall = viemClient.multicall;
export const getBalance = viemClient.getBalance;
export const getBlock = viemClient.getBlock;
export const rpcViemClient = {
  simulateContract: viemClient.simulateContract,
  readContract: viemClient.readContract,
  multicall: viemClient.multicall,
  getBalance: viemClient.getBalance,
  getBlock: viemClient.getBlock,
};
