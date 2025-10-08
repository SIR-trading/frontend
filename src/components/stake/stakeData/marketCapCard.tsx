"use client";
import React, { useMemo } from "react";
import Show from "@/components/shared/show";
import { useStaking } from "@/contexts/StakingContext";
import { formatUnits } from "viem";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { SirContract } from "@/contracts/sir";
import { getExplorerUrl } from "@/lib/chains";
import { ExternalLink } from "lucide-react";
import { useSirPrice } from "@/contexts/SirPriceContext";

export default function MarketCapCard() {
  const { totalSupply, totalSupplyLoading } = useStaking();
  const { sirPrice, isLoading: priceLoading } = useSirPrice();

  const marketCap = useMemo(() => {
    if (!sirPrice || !totalSupply) return null;
    const totalSupplyNumber = parseFloat(formatUnits(totalSupply, 12)); // SIR has 12 decimals
    return totalSupplyNumber * sirPrice;
  }, [sirPrice, totalSupply]);

  const isLoading = totalSupplyLoading || priceLoading;

  const contractUrl = `${getExplorerUrl()}/address/${SirContract.address}`;

  return (
    <div className="rounded-md bg-primary/5 p-3 dark:bg-primary text-center">
      <div className="text-xs text-muted-foreground">
        Market Cap
      </div>
      <Show
        when={!isLoading && marketCap !== null}
        fallback={
          <div className="mt-1 h-7 w-24 animate-pulse rounded bg-foreground/10 mx-auto"></div>
        }
      >
        <div className="mt-1 text-lg font-semibold">
          ${marketCap ? <DisplayFormattedNumber num={marketCap} significant={3} /> : "—"}
        </div>
        <div className="text-xs text-muted-foreground">
          <a
            href={contractUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            title="View SIR contract on explorer"
          >
            View Contract
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </Show>
    </div>
  );
}