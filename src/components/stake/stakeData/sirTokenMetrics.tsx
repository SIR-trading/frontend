"use client";
import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import Show from "@/components/shared/show";
import { useStaking } from "@/contexts/StakingContext";
import { useSirUsdPrice } from "@/components/shared/stake/hooks/useSirUsdPrice";
import { BuySirButton } from "@/components/buySirButton";
import { formatUnits } from "viem";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function SirTokenMetrics() {
  const { totalSupply, unstakedSupply, totalSupplyLoading, unstakedSupplyLoading } = useStaking();
  const { pricePerToken, isLoading: priceLoading } = useSirUsdPrice();

  // Calculate circulating supply (total - staked)
  const circulatingSupply = useMemo(() => {
    if (totalSupply && unstakedSupply !== undefined) {
      // Circulating supply is the unstaked supply (not locked in staking)
      return unstakedSupply;
    }
    return 0n;
  }, [totalSupply, unstakedSupply]);

  // Calculate market cap
  const marketCap = useMemo(() => {
    if (pricePerToken && totalSupply) {
      const totalSupplyNumber = parseFloat(formatUnits(totalSupply, 12));
      return totalSupplyNumber * pricePerToken;
    }
    return null;
  }, [pricePerToken, totalSupply]);

  // Format numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatSupply = (supply: bigint) => {
    const supplyNumber = parseFloat(formatUnits(supply, 12));
    if (supplyNumber >= 1e9) return `${(supplyNumber / 1e9).toFixed(2)}B`;
    if (supplyNumber >= 1e6) return `${(supplyNumber / 1e6).toFixed(2)}M`;
    if (supplyNumber >= 1e3) return `${(supplyNumber / 1e3).toFixed(2)}K`;
    return supplyNumber.toFixed(2);
  };

  const isLoading = totalSupplyLoading || unstakedSupplyLoading || priceLoading;

  return (
    <Card className="flex flex-col gap-4 rounded-md bg-secondary p-6 transition-colors hover:bg-secondary/80">
      <div className="flex items-center justify-between">
        <div className="text-sm font-normal text-muted-foreground">
          SIR Token
        </div>
        <BuySirButton />
      </div>

      <Show
        when={!isLoading}
        fallback={
          <div className="space-y-3">
            <div className="h-8 w-32 animate-pulse rounded bg-foreground/10"></div>
            <div className="h-6 w-24 animate-pulse rounded bg-foreground/10"></div>
            <div className="h-6 w-28 animate-pulse rounded bg-foreground/10"></div>
          </div>
        }
      >
        <div className="space-y-3">
          {/* Price */}
          <div>
            <div className="text-2xl font-semibold">
              {pricePerToken ? `$${pricePerToken.toFixed(4)}` : "—"}
            </div>
            <div className="text-xs text-muted-foreground">Price per SIR</div>
          </div>

          {/* Market Cap */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Market Cap</div>
            <div className="text-sm font-medium">
              {marketCap ? formatNumber(marketCap) : "—"}
            </div>
          </div>

          {/* Circulating Supply */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Circulating</div>
            <div className="text-sm font-medium">
              {circulatingSupply ? formatSupply(circulatingSupply) : "—"}
            </div>
          </div>

          {/* Total Supply */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Total Supply</div>
            <div className="text-sm font-medium">
              {totalSupply ? formatSupply(totalSupply) : "—"}
            </div>
          </div>
        </div>
      </Show>
    </Card>
  );
}