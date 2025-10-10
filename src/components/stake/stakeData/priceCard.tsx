"use client";
import React, { useState } from "react";
import Show from "@/components/shared/show";
import { SirContract } from "@/contracts/sir";
import { getExplorerUrl } from "@/lib/chains";
import { ExternalLink, Copy, Check } from "lucide-react";
import { useSirPrice } from "@/contexts/SirPriceContext";

export default function PriceCard() {
  const { sirPrice, isLoading } = useSirPrice();
  const [copied, setCopied] = useState(false);

  const formatPrice = (price: number) => {
    if (price < 0.0001) return `${price.toFixed(8)} USD`;
    if (price < 0.01) return `${price.toFixed(6)} USD`;
    if (price < 1) return `${price.toFixed(4)} USD`;
    return `${price.toFixed(2)} USD`;
  };

  const contractUrl = `${getExplorerUrl()}/address/${SirContract.address}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(SirContract.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-md bg-primary/5 p-3 dark:bg-primary text-center">
      <div className="text-xs text-muted-foreground">
        SIR Price
      </div>
      <Show
        when={!isLoading && sirPrice !== null && sirPrice !== undefined}
        fallback={
          <>
            <div className="mt-1 h-7 w-16 animate-pulse rounded bg-foreground/10 mx-auto"></div>
            <div className="mt-1 h-4 w-12 animate-pulse rounded bg-foreground/10 mx-auto"></div>
          </>
        }
      >
        <div className="mt-1 text-lg font-semibold">
          {sirPrice ? formatPrice(sirPrice) : "—"}
        </div>
        <div className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <button
            onClick={handleCopy}
            className="hover:text-foreground transition-colors cursor-pointer"
            title="Copy contract address"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </button>
          <a
            href={contractUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
            title="View SIR contract on explorer"
          >
            View Contract
          </a>
          <a
            href={contractUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
            title="View SIR contract on explorer"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </Show>
    </div>
  );
}