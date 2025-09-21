import { useMemo } from "react";
import { env } from "@/env";

type VaultChartConfigs = Record<number, Record<string, string>>;

// Configuration for Dune Analytics charts per chain and vault ID
const VAULT_CHARTS: VaultChartConfigs = {
  // Mainnet (chain ID 1)
  1: {
    "1": "https://dune.com/embeds/5640030/9172204",
    "2": "https://dune.com/embeds/5648390/9177434",
    "9": "https://dune.com/embeds/5648413/9177463"
    // Add more vault IDs and their embed URLs as needed
  },
  // Sepolia (chain ID 11155111)
  11155111: {
    // Add Sepolia vault charts here
  },
  // HyperEVM (chain ID 998)
  998: {
    // Add HyperEVM testnet vault charts here
  },
  // HyperEVM Mainnet (chain ID 999)
  999: {
    // Add HyperEVM mainnet vault charts here
  }
};

export function useDuneCharts(vaultId?: string) {
  // Use the app's configured chain ID instead of wallet's connected chain
  const chainId = parseInt(env.NEXT_PUBLIC_CHAIN_ID);

  const embedUrl = useMemo(() => {
    if (!vaultId || !chainId) return null;
    const chainCharts = VAULT_CHARTS[chainId];
    if (!chainCharts) return null;
    return chainCharts[vaultId] ?? null;
  }, [vaultId, chainId]);

  const hasChart = Boolean(embedUrl);

  return {
    embedUrl,
    hasChart,
  };
}

// Helper function to generate Dune embed URL from a query URL
export function generateDuneEmbedUrl(queryUrl: string): string {
  // Extract query ID from URL like: https://dune.com/queries/123456
  const match = queryUrl.match(/queries\/(\d+)/);
  if (match?.[1]) {
    // Return embed URL format
    // Note: You'll need to append the visualization ID which is specific to each chart
    return `https://dune.com/embeds/${match[1]}/`;
  }
  return queryUrl;
}