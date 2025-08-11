import { useMemo } from "react";

type VaultChartConfigs = Record<string, string>;

// Configuration for Dune Analytics charts per vault ID
const VAULT_CHARTS: VaultChartConfigs = {
  // Example configurations - replace with your actual Dune embed URLs
  "1": "https://dune.com/embeds/5640030/9172204",
  "2": "https://dune.com/embeds/5648390/9177434",
  "9": "https://dune.com/embeds/5648413/9177463"
  // Add more vault IDs and their embed URLs as needed
};

export function useDuneCharts(vaultId?: string) {
  const embedUrl = useMemo(() => {
    if (!vaultId) return null;
    return VAULT_CHARTS[vaultId] ?? null;
  }, [vaultId]);

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