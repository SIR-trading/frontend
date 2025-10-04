"use client";
import React from "react";
import { Card } from "@/components/ui/card";
import Show from "@/components/shared/show";
import { api } from "@/trpc/react";
import { getDexName } from "@/lib/chains";
import { BuySirButton } from "@/components/buySirButton";

export default function PriceCard() {
  const { data: sirPrice, isLoading } = api.price.getSirPriceInUsd.useQuery(
    undefined,
    {
      staleTime: 60000, // 1 minute cache
      refetchInterval: 60000, // Refetch every minute
    }
  );

  const formatPrice = (price: number) => {
    if (price < 0.0001) return `$${price.toFixed(8)}`;
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  };

  return (
    <Card className="flex flex-col items-center justify-center gap-3 rounded-md bg-secondary p-6 transition-colors hover:bg-secondary/80 relative">
      <div className="text-sm font-normal text-muted-foreground">
        SIR Price
      </div>
      <Show
        when={!isLoading && sirPrice !== null && sirPrice !== undefined}
        fallback={
          <div className="h-8 w-24 animate-pulse rounded bg-foreground/10"></div>
        }
      >
        <div className="space-y-2 text-center">
          <div className="text-2xl">
            {sirPrice ? formatPrice(sirPrice) : "—"}
          </div>
          <BuySirButton />
        </div>
      </Show>
    </Card>
  );
}