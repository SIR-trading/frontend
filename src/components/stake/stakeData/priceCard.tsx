"use client";
import React from "react";
import Show from "@/components/shared/show";
import { BuySirButton } from "@/components/buySirButton";
import { useSirPrice } from "@/contexts/SirPriceContext";

export default function PriceCard() {
  const { sirPrice, isLoading } = useSirPrice();

  const formatPrice = (price: number) => {
    if (price < 0.0001) return `${price.toFixed(8)} USD`;
    if (price < 0.01) return `${price.toFixed(6)} USD`;
    if (price < 1) return `${price.toFixed(4)} USD`;
    return `${price.toFixed(2)} USD`;
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
        <div className="text-xs">
          <BuySirButton />
        </div>
      </Show>
    </div>
  );
}