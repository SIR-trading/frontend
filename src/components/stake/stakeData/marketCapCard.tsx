"use client";
import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import Show from "@/components/shared/show";
import { api } from "@/trpc/react";
import { useStaking } from "@/contexts/StakingContext";
import { formatUnits } from "viem";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { SirContract } from "@/contracts/sir";
import { getExplorerUrl } from "@/lib/chains";
import { ExternalLink } from "lucide-react";

export default function MarketCapCard() {
  const { totalSupply, totalSupplyLoading } = useStaking();

  const { data: sirPrice, isLoading: priceLoading } = api.price.getSirPriceInUsd.useQuery(
    undefined,
    {
      staleTime: 60000, // 1 minute cache
      refetchInterval: 60000, // Refetch every minute
    }
  );

  const marketCap = useMemo(() => {
    if (!sirPrice || !totalSupply) return null;
    const totalSupplyNumber = parseFloat(formatUnits(totalSupply, 12)); // SIR has 12 decimals
    return totalSupplyNumber * sirPrice;
  }, [sirPrice, totalSupply]);

  const isLoading = totalSupplyLoading || priceLoading;

  const contractUrl = `${getExplorerUrl()}/address/${SirContract.address}`;

  return (
    <Card className="flex flex-col items-center justify-center gap-3 rounded-md bg-secondary p-6 transition-colors hover:bg-secondary/80">
      <div className="text-sm font-normal text-muted-foreground">
        Market Cap
      </div>
      <Show
        when={!isLoading && marketCap !== null}
        fallback={
          <div className="space-y-2">
            <div className="h-8 w-24 animate-pulse rounded bg-foreground/10"></div>
            <div className="h-4 w-20 animate-pulse rounded bg-foreground/10"></div>
          </div>
        }
      >
        <div className="space-y-2 text-center">
          <div className="text-2xl">
            ${marketCap ? <DisplayFormattedNumber num={marketCap} significant={3} /> : "—"}
          </div>
          <a
            href={contractUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            title="View SIR contract on explorer"
          >
            View Contract
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </Show>
    </Card>
  );
}