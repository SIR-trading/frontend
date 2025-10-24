"use client";
import React, { useMemo } from "react";
import Show from "@/components/shared/show";
import { useStaking } from "@/contexts/StakingContext";
import { formatUnits } from "viem";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { BuySirButton } from "@/components/buySirButton";
import { useSirPrice } from "@/contexts/SirPriceContext";

export default function MarketCapCard() {
  const { totalSupply, totalSupplyLoading } = useStaking();
  const { sirPrice, isLoading: priceLoading, error: priceError } = useSirPrice();

  const marketCap = useMemo(() => {
    if (!sirPrice || !totalSupply) return null;
    const totalSupplyNumber = parseFloat(formatUnits(totalSupply, 12)); // SIR has 12 decimals
    return totalSupplyNumber * sirPrice;
  }, [sirPrice, totalSupply]);

  const isLoading = totalSupplyLoading || priceLoading;

  // Market cap is unavailable if price failed to load or if loading finished but price is null
  const marketCapUnavailable = priceError || (!priceLoading && (sirPrice === null || sirPrice === undefined));

  return (
    <div className="rounded-md bg-primary/5 p-3 dark:bg-primary text-center">
      <div className="text-xs text-muted-foreground">
        Market Cap
      </div>
      <Show
        when={!isLoading}
        fallback={
          <>
            <div className="mt-1 h-7 w-20 animate-pulse rounded bg-foreground/10 mx-auto"></div>
            <div className="mt-1 h-4 w-16 animate-pulse rounded bg-foreground/10 mx-auto"></div>
          </>
        }
      >
        <div className="mt-1 text-lg font-semibold">
          {marketCapUnavailable ? (
            <span className="text-sm italic text-muted-foreground">Not available</span>
          ) : marketCap ? (
            <><DisplayFormattedNumber num={marketCap} significant={3} /> USD</>
          ) : (
            "—"
          )}
        </div>
        <div className="text-xs">
          <BuySirButton />
        </div>
      </Show>
    </div>
  );
}