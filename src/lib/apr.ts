import { executeGetDividendGreaterThan } from "@/server/queries/dividendsPaid";

/**
 * Calculates the annualized percentage return (APR) based on the last week's dividend events
 */
export async function getWeeklyApr(): Promise<{ apr: string; latestTimestamp: number }> {
  // Get current timestamp and calculate one week ago
  const oneWeekAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
  
  // Fetch dividend events from last week directly from subgraph
  const weeklyDividends = await executeGetDividendGreaterThan({ timestamp: oneWeekAgo });
  
  if (!weeklyDividends.length) {
    return { apr: "0", latestTimestamp: Math.floor(Date.now() / 1000) };
  }

  let totalApr = 0;
  const SIR_DECIMALS = 12;
  const ETH_DECIMALS = 18;
  
  weeklyDividends.forEach((dividend) => {
    if (dividend.ethAmount && dividend.stakedAmount && dividend.sirEthPrice) {
      // Parse amounts - ethAmount is in wei (18 decimals)
      // stakedAmount is in SIR units (12 decimals)
      // sirEthPrice has no decimals (if 1 SIR = 1 ETH, then sirEthPrice = 1)
      const ethAmount = parseFloat(String(dividend.ethAmount)) / Math.pow(10, ETH_DECIMALS);
      const sirAmount = parseFloat(String(dividend.stakedAmount)) / Math.pow(10, SIR_DECIMALS);
      const sirEthPrice = parseFloat(String(dividend.sirEthPrice));
            
      // Skip calculations if any value is zero
      if (ethAmount === 0 || sirAmount === 0 || sirEthPrice === 0) {
        console.warn("Skipping dividend with zero values");
        return;
      }
      
      // Calculate SIR staked value in ETH
      const sirStakedEth = sirAmount * sirEthPrice;
      
      // APR Formula: (ETH dividends / SIR staked in ETH) × (365 days / 7 days) × 100%
      const payoutApr = (ethAmount / sirStakedEth) * (365 / 7) * 100;
      
      totalApr += payoutApr;
    }
  });
  
  return { 
    apr: totalApr.toFixed(2), 
    latestTimestamp: Math.floor(Date.now() / 1000) 
  };
}

/**
 * Calculates the annualized percentage return (APR) based on the last 30 days' dividend events
 */
export async function getMonthlyApr(): Promise<{ apr: string; latestTimestamp: number; totalEthDistributed: string }> {
  // Get current timestamp and calculate 30 days ago
  const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);

  // Fetch dividend events from last 30 days directly from subgraph
  const monthlyDividends = await executeGetDividendGreaterThan({ timestamp: thirtyDaysAgo });

  if (!monthlyDividends.length) {
    return { apr: "0", latestTimestamp: Math.floor(Date.now() / 1000), totalEthDistributed: "0" };
  }

  let totalApr = 0;
  let totalEthDistributed = 0n;
  const SIR_DECIMALS = 12;
  const ETH_DECIMALS = 18;

  monthlyDividends.forEach((dividend) => {
    // Always sum the ETH amount regardless of whether we can calculate APR
    if (dividend.ethAmount) {
      totalEthDistributed += BigInt(dividend.ethAmount);
    }

    // Only calculate APR if we have all required fields
    if (dividend.ethAmount && dividend.stakedAmount && dividend.sirEthPrice) {
      // Parse amounts - ethAmount is in wei (18 decimals)
      // stakedAmount is in SIR units (12 decimals)
      // sirEthPrice has no decimals (if 1 SIR = 1 ETH, then sirEthPrice = 1)
      const ethAmount = parseFloat(String(dividend.ethAmount)) / Math.pow(10, ETH_DECIMALS);
      const sirAmount = parseFloat(String(dividend.stakedAmount)) / Math.pow(10, SIR_DECIMALS);
      const sirEthPrice = parseFloat(String(dividend.sirEthPrice));

      // Skip calculations if any value is zero
      if (ethAmount === 0 || sirAmount === 0 || sirEthPrice === 0) {
        console.warn("Skipping dividend with zero values");
        return;
      }

      // Calculate SIR staked value in ETH
      const sirStakedEth = sirAmount * sirEthPrice;

      // APR Formula: (ETH dividends / SIR staked in ETH) × (365 days / 30 days) × 100%
      const payoutApr = (ethAmount / sirStakedEth) * (365 / 30) * 100;

      totalApr += payoutApr;
    }
  });

  return {
    apr: totalApr.toFixed(2),
    latestTimestamp: Math.floor(Date.now() / 1000),
    totalEthDistributed: totalEthDistributed.toString()
  };
}
