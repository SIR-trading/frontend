"use client";
import React, { useEffect, useState } from "react";
import { getDexName } from "@/lib/chains";
import { useChainId } from "wagmi";
import { api } from "@/trpc/react";
import { TrendingUp, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useSirPrice } from "@/contexts/SirPriceContext";

interface SirPriceChartProps {
  height?: number; // Height in pixels, defaults to 400
}

export default function SirPriceChart({ height = 400 }: SirPriceChartProps) {
  const chainId = useChainId();
  const [isExpanded, setIsExpanded] = useState(false);
  const [chartTheme, setChartTheme] = useState("dark");

  // Check if SIR price is available
  const { sirPrice, isLoading: sirPriceLoading, error: sirPriceError } = useSirPrice();
  const priceUnavailable = sirPriceError || (!sirPriceLoading && (sirPrice === null || sirPrice === undefined));

  // Get the most liquid pool address for the chart URL
  const { data: poolData, isLoading: isPoolLoading, isError: poolError } = api.quote.getMostLiquidSirPool.useQuery(
    undefined,
    {
      staleTime: 300000, // Cache for 5 minutes
      retry: false, // Don't retry on error
    }
  );

  // Check if pool data is unavailable (error or no pool found after loading)
  const poolUnavailable = poolError || (!isPoolLoading && !poolData);

  // Detect theme changes
  useEffect(() => {
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setChartTheme(isDark ? "dark" : "light");
    };

    updateTheme();

    // Watch for theme changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Construct the DexScreener embed URL
  const getDexScreenerUrl = () => {
    if (!poolData?.poolAddress) return undefined;

    // Determine the network prefix for DexScreener
    let network = "ethereum";
    if (chainId === 11155111) network = "sepolia";
    else if (chainId === 998 || chainId === 999) network = "hyperevm";

    // DexScreener embed parameters
    const params = new URLSearchParams({
      embed: "1",
      theme: chartTheme,
      chartTheme: chartTheme,
      chartType: "usd",
      interval: "60", // 1 hour candles
      chartStyle: "1", // 0=bars, 1=candles, 2=line
      chartDefaultOnMobile: "1",
      info: "0", // Hide info panel
      trades: "0", // Hide trades
      tabs: "0", // Hide tabs
      chartLeftToolbar: "0", // Hide left toolbar
      loadChartSettings: "0" // Don't load saved settings
    });

    return `https://dexscreener.com/${network}/${poolData.poolAddress}?${params.toString()}`;
  };

  const chartUrl = getDexScreenerUrl();
  const dexName = getDexName(chainId);

  // Show "Not available" if price or pool is unavailable
  if (priceUnavailable || poolUnavailable) {
    return (
      <div className="rounded-md bg-primary/5 pt-6 px-0.5 pb-0.5 lg:p-6 dark:bg-primary">
        <div className="flex items-center justify-between mb-4 px-4 lg:px-0">
          <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            SIR Price Chart
          </h3>
        </div>
        <div className="flex items-center justify-center text-muted-foreground px-4 lg:px-0" style={{ height: `${height}px` }}>
          <p className="text-sm italic">Not available</p>
        </div>
      </div>
    );
  }

  // Show loading state while fetching data
  if (isPoolLoading || sirPriceLoading) {
    return (
      <div className="rounded-md bg-primary/5 pt-6 px-0.5 pb-0.5 lg:p-6 dark:bg-primary">
        <div className="flex items-center justify-between mb-4 px-4 lg:px-0">
          <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            SIR Price Chart
          </h3>
        </div>
        <div className="flex items-center justify-center text-muted-foreground px-4 lg:px-0" style={{ height: `${height}px` }}>
          <p className="text-sm">Loading chart data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main chart */}
      <div className="rounded-md bg-primary/5 pt-6 px-0.5 pb-0.5 lg:p-6 dark:bg-primary">
        <div className="flex items-center justify-between mb-4 px-4 lg:px-0">
          <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            SIR Price Chart • Live data from {dexName}
          </h3>
          <button
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
            title="Expand chart"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Expand
          </button>
        </div>

        {/* Embedded chart */}
        <div className="relative w-full overflow-hidden rounded border border-border/50" style={{ height: `${height}px` }}>
          <iframe
            src={chartUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            className="absolute inset-0"
            title="SIR Price Chart"
            style={{ border: 0 }}
          />
        </div>
      </div>

      {/* Expanded modal view */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsExpanded(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-4 z-50 flex items-center justify-center"
            >
              <div className="relative h-full w-full max-w-6xl rounded-lg border border-foreground/20 bg-background shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/50 bg-foreground/5 px-4 py-3">
                  <h3 className="flex items-center gap-2 text-sm font-medium">
                    <TrendingUp className="h-4 w-4" />
                    SIR Price Chart • Live price data from {dexName}
                  </h3>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>

                {/* Full-size chart */}
                <div className="h-[calc(100%-52px)] w-full">
                  <iframe
                    src={chartUrl}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    title="SIR Price Chart Expanded"
                    style={{ border: 0 }}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}